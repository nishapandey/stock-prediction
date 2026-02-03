import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('AGG')  # Set backend once at module level
import matplotlib.pyplot as plt
import yfinance as yf
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, r2_score
from keras.models import load_model
from .serializers import StockPredictionSerializer
from .utils import save_plot
from .sentiment import get_sentiment_summary

# Configure yfinance cache to a writable location
cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.yf_cache')
os.makedirs(cache_dir, exist_ok=True)
yf.set_tz_cache_location(cache_dir)


class StockPredictionAPIView(APIView):
    def post(self, request):
        serializer = StockPredictionSerializer(data=request.data)
        if serializer.is_valid():
            ticker = serializer.validated_data['ticker'].upper()

            try:
                # Fetch stock data from yfinance
                stock = yf.Ticker(ticker)
                df = stock.history(period="10y")
                
                if df is None or df.empty:
                    return Response({
                        "error": f"No data found for ticker '{ticker}'. Please check if it's a valid stock symbol.",
                        'status': status.HTTP_404_NOT_FOUND
                    })
                
                if 'Close' not in df.columns:
                    return Response({
                        "error": f"Invalid data structure for ticker '{ticker}'. Missing Close price data.",
                        'status': status.HTTP_500_INTERNAL_SERVER_ERROR
                    })
                
                # Extract Close prices and Volume, drop NaN values
                df_full = df[['Close', 'Volume']].dropna()
                volume_data = df_full['Volume'].values
                df = df_full[['Close']]
                
                # Calculate moving averages
                ma100 = df['Close'].rolling(100).mean()
                ma200 = df['Close'].rolling(200).mean()
                
                # Generate plots
                # 1. Basic closing price plot
                plt.figure(figsize=(17.3, 7.2))
                plt.plot(df['Close'].values, label='Closing Price')
                plt.title(f'Closing price of {ticker}')
                plt.xlabel('Days')
                plt.ylabel('Price')
                plt.legend()
                plot_img = save_plot(f'{ticker}_plot.png')
                
                # 2. 100 DMA plot
                plt.figure(figsize=(17.3, 7.2))
                plt.plot(df['Close'].values, label='Closing Price')
                plt.plot(ma100.values, 'r', label='100 DMA')
                plt.title(f'100 Days Moving Average of {ticker}')
                plt.xlabel('Days')
                plt.ylabel('Price')
                plt.legend()
                plot_100_dma = save_plot(f'{ticker}_100_dma.png')

                # 3. 200 DMA plot
                plt.figure(figsize=(17.3, 7.2))
                plt.plot(df['Close'].values, label='Closing Price')
                plt.plot(ma100.values, 'r', label='100 DMA')
                plt.plot(ma200.values, 'g', label='200 DMA')
                plt.title(f'200 Days Moving Average of {ticker}')
                plt.xlabel('Days')
                plt.ylabel('Price')
                plt.legend()
                plot_200_dma = save_plot(f'{ticker}_200_dma.png')

                # Train/Test split (70/30)
                split = int(len(df) * 0.7)
                data_training = df.iloc[:split]
                data_testing = df.iloc[split:]

                # Scaling - fit only on training data
                scaler = MinMaxScaler(feature_range=(0, 1))
                scaler.fit(data_training)

                # Prepare test data - use last 100 days of training + all test data
                past_100_days = data_training.tail(100)
                final_df = pd.concat([past_100_days, data_testing], axis=0)
                input_data = scaler.transform(final_df)

                # Create test sequences
                x_test, y_test = [], []
                for i in range(100, input_data.shape[0]):
                    x_test.append(input_data[i-100:i, 0])
                    y_test.append(input_data[i, 0])

                x_test = np.array(x_test).reshape(-1, 100, 1)
                y_test = np.array(y_test)

                # Load model and make predictions
                model = load_model('stock_prediction_model.keras')
                y_predicted = model.predict(x_test)

                # Inverse transform to get original prices
                y_predicted = scaler.inverse_transform(y_predicted).flatten()
                y_test = scaler.inverse_transform(y_test.reshape(-1, 1)).flatten()

                # 4. Prediction plot
                plt.figure(figsize=(17.3, 7.2))
                plt.plot(y_test, 'b', label='Original Price')
                plt.plot(y_predicted, 'r', label='Predicted Price')
                plt.title(f'Final Prediction for {ticker}')
                plt.xlabel('Days')
                plt.ylabel('Price')
                plt.legend()
                plot_prediction = save_plot(f'{ticker}_final_prediction.png')

                # Model evaluation metrics
                mse = mean_squared_error(y_test, y_predicted)
                rmse = np.sqrt(mse)
                r2 = r2_score(y_test, y_predicted)

                # Get today's closing price for comparison
                today_price = df['Close'].iloc[-1]
                
                # Get sentiment analysis BEFORE prediction to use in adjustment
                sentiment_data = get_sentiment_summary(
                    ticker, 
                    df['Close'].values, 
                    volume_data
                )
                
                # Predict tomorrow's price using the last 100 days
                # Use a scaler fit on recent data to avoid scale mismatch
                last_100_days = df['Close'].tail(100).values.reshape(-1, 1)
                tomorrow_scaler = MinMaxScaler(feature_range=(0, 1))
                tomorrow_scaler.fit(last_100_days)
                last_100_scaled = tomorrow_scaler.transform(last_100_days)
                x_tomorrow = np.array([last_100_scaled.flatten()]).reshape(1, 100, 1)
                tomorrow_prediction_scaled = model.predict(x_tomorrow)
                base_prediction = tomorrow_scaler.inverse_transform(tomorrow_prediction_scaled)[0][0]
                
                # Apply sentiment adjustment to the prediction
                # Overall sentiment score ranges from -1 (very bearish) to +1 (very bullish)
                overall_sentiment = sentiment_data.get('overall_sentiment', 'neutral')
                sentiment_score = sentiment_data.get('sentiment_score', 0)
                
                # Calculate base price change predicted by LSTM
                base_change_pct = ((base_prediction - today_price) / today_price) * 100
                
                # Check for contradiction: LSTM vs Sentiment
                # If sentiment strongly contradicts LSTM prediction, apply correction
                sentiment_adjustment = 0.0
                
                # Strong contradiction detection
                lstm_bullish = base_change_pct > 2  # LSTM predicts >2% increase
                lstm_bearish = base_change_pct < -2  # LSTM predicts >2% decrease
                sentiment_bullish = overall_sentiment == 'bullish' and sentiment_score > 0.2
                sentiment_bearish = overall_sentiment == 'bearish' and sentiment_score < -0.2
                
                if lstm_bullish and sentiment_bearish:
                    # LSTM says up, but sentiment is bearish - dampen the prediction
                    # The more bearish, the more we reduce the predicted gain
                    dampening_factor = 0.3 + (0.7 * (1 + sentiment_score))  # 0.3 to 1.0
                    adjusted_change = base_change_pct * dampening_factor
                    tomorrow_prediction = today_price * (1 + adjusted_change / 100)
                    sentiment_adjustment = (adjusted_change - base_change_pct) / 100
                    
                elif lstm_bearish and sentiment_bullish:
                    # LSTM says down, but sentiment is bullish - dampen the decline
                    dampening_factor = 0.3 + (0.7 * (1 - sentiment_score))  # 0.3 to 1.0
                    adjusted_change = base_change_pct * dampening_factor
                    tomorrow_prediction = today_price * (1 + adjusted_change / 100)
                    sentiment_adjustment = (adjusted_change - base_change_pct) / 100
                    
                else:
                    # No strong contradiction - apply normal sentiment adjustment
                    # RSI contribution
                    rsi = sentiment_data.get('rsi')
                    if rsi is not None:
                        if rsi > 70:  # Overbought
                            sentiment_adjustment -= 0.02 * ((rsi - 70) / 30)
                        elif rsi < 30:  # Oversold
                            sentiment_adjustment += 0.02 * ((30 - rsi) / 30)
                    
                    # News sentiment contribution
                    news_score = sentiment_data.get('news_sentiment')
                    if news_score is not None:
                        sentiment_adjustment += news_score * 0.02
                    
                    # Overall sentiment contribution
                    sentiment_adjustment += sentiment_score * 0.03
                    
                    # Apply adjustment
                    tomorrow_prediction = base_prediction * (1 + sentiment_adjustment)
                
                # Store adjustment info for transparency
                adjustment_pct = ((tomorrow_prediction - base_prediction) / base_prediction) * 100
                
                # Generate prediction summary
                summary_points = []
                
                # 1. Price direction
                price_change_pct = ((tomorrow_prediction - today_price) / today_price) * 100
                if price_change_pct > 0:
                    summary_points.append(f"The model predicts a {abs(price_change_pct):.2f}% increase based on recent price patterns.")
                else:
                    summary_points.append(f"The model predicts a {abs(price_change_pct):.2f}% decrease based on recent price patterns.")
                
                # 2. Recent trend (last 5 days)
                last_5_days = df['Close'].tail(5)
                recent_trend = ((last_5_days.iloc[-1] - last_5_days.iloc[0]) / last_5_days.iloc[0]) * 100
                if recent_trend > 1:
                    summary_points.append(f"Short-term momentum is bullish (+{recent_trend:.2f}% over 5 days).")
                elif recent_trend < -1:
                    summary_points.append(f"Short-term momentum is bearish ({recent_trend:.2f}% over 5 days).")
                else:
                    summary_points.append("Short-term momentum is neutral (sideways movement).")
                
                # 3. Position relative to 100 DMA
                current_ma100 = ma100.iloc[-1]
                if today_price > current_ma100:
                    summary_points.append(f"Price is above 100-day moving average (${current_ma100:.2f}), indicating bullish trend.")
                else:
                    summary_points.append(f"Price is below 100-day moving average (${current_ma100:.2f}), indicating bearish trend.")
                
                # 4. Position relative to 200 DMA
                current_ma200 = ma200.iloc[-1]
                if today_price > current_ma200:
                    summary_points.append(f"Price is above 200-day moving average (${current_ma200:.2f}), a long-term bullish signal.")
                else:
                    summary_points.append(f"Price is below 200-day moving average (${current_ma200:.2f}), a long-term bearish signal.")
                
                # 5. Golden Cross / Death Cross
                if current_ma100 > current_ma200:
                    summary_points.append("Golden Cross pattern: 100 DMA is above 200 DMA, typically bullish.")
                else:
                    summary_points.append("Death Cross pattern: 100 DMA is below 200 DMA, typically bearish.")
                
                # 6. Sentiment-adjusted prediction explanation
                lstm_bullish = base_change_pct > 2
                lstm_bearish = base_change_pct < -2
                sentiment_bullish = overall_sentiment == 'bullish' and sentiment_score > 0.2
                sentiment_bearish = overall_sentiment == 'bearish' and sentiment_score < -0.2
                
                if lstm_bullish and sentiment_bearish:
                    summary_points.append(f"⚠️ CONFLICT: LSTM predicted +{base_change_pct:.1f}% but sentiment is BEARISH. Prediction dampened to reflect market caution.")
                elif lstm_bearish and sentiment_bullish:
                    summary_points.append(f"⚠️ CONFLICT: LSTM predicted {base_change_pct:.1f}% but sentiment is BULLISH. Decline dampened due to positive sentiment.")
                elif abs(adjustment_pct) > 0.1:
                    direction = "increased" if adjustment_pct > 0 else "decreased"
                    summary_points.append(f"Sentiment analysis {direction} the base prediction by {abs(adjustment_pct):.2f}% (${base_prediction:.2f} → ${tomorrow_prediction:.2f}).")
                
                # Add sentiment insights to summary
                if sentiment_data['rsi'] is not None:
                    rsi = sentiment_data['rsi']
                    if sentiment_data['rsi_signal'] == 'overbought':
                        summary_points.append(f"RSI is {rsi} (overbought) - stock may be overvalued, potential bearish reversal.")
                    elif sentiment_data['rsi_signal'] == 'oversold':
                        summary_points.append(f"RSI is {rsi} (oversold) - stock may be undervalued, potential bullish reversal.")
                    elif sentiment_data['rsi_signal'] == 'bullish':
                        summary_points.append(f"RSI is {rsi} - showing bullish momentum.")
                    else:
                        summary_points.append(f"RSI is {rsi} - showing bearish momentum.")
                
                if sentiment_data['volume_analysis']:
                    vol = sentiment_data['volume_analysis']
                    if vol['signal'] == 'high':
                        summary_points.append(f"Trading volume is {vol['ratio']}x above average - strong market interest.")
                    elif vol['signal'] == 'low':
                        summary_points.append(f"Trading volume is below average - weak market participation.")
                
                if sentiment_data['news_sentiment'] is not None:
                    news_score = sentiment_data['news_sentiment']
                    if news_score > 0.1:
                        summary_points.append(f"News sentiment is positive ({news_score}) - bullish media coverage.")
                    elif news_score < -0.1:
                        summary_points.append(f"News sentiment is negative ({news_score}) - bearish media coverage.")
                    else:
                        summary_points.append(f"News sentiment is neutral ({news_score}).")
                
                if sentiment_data['fear_greed']:
                    fg = sentiment_data['fear_greed']
                    summary_points.append(f"Market Fear & Greed Index: {fg['value']} ({fg['classification']}).")
                
                # Overall sentiment conclusion
                overall = sentiment_data['overall_sentiment']
                score = sentiment_data['sentiment_score']
                summary_points.append(f"Overall market sentiment: {overall.upper()} (score: {score}).")

                return Response({
                    'status': 'success',
                    'plot_img': plot_img,
                    'plot_100_dma': plot_100_dma,
                    'plot_200_dma': plot_200_dma,
                    'plot_prediction': plot_prediction,
                    'mse': round(mse, 4),
                    'rmse': round(rmse, 4),
                    'r2': round(r2, 4),
                    'tomorrow_prediction': round(float(tomorrow_prediction), 2),
                    'base_prediction': round(float(base_prediction), 2),
                    'sentiment_adjustment_pct': round(adjustment_pct, 2),
                    'today_price': round(float(today_price), 2),
                    'prediction_summary': summary_points,
                    'sentiment': sentiment_data
                })
                
            except Exception as e:
                return Response({
                    "error": f"Error processing prediction: {str(e)}",
                    'status': status.HTTP_500_INTERNAL_SERVER_ERROR
                })
