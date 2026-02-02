# stock-prediction
The code trains an LSTM to predict the next day’s stock price using the previous 100 days of prices.

It splits historical data into training (70%) and testing (30%) in time order.

During testing, it makes walk-forward 1-day-ahead predictions across the test period.

The output compares actual vs predicted prices for model evaluation, not future forecasting.
