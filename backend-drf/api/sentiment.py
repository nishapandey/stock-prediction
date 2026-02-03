"""
Market Sentiment Analysis Module

This module provides sentiment analysis from multiple sources:
1. RSI (Relative Strength Index) - Technical indicator
2. Volume Analysis - Trading activity
3. News Sentiment - Using VADER sentiment analysis on stock news
"""

import numpy as np
import requests
from datetime import datetime, timedelta


def calculate_rsi(prices, period=14):
    """
    Calculate the Relative Strength Index (RSI).
    RSI > 70 = Overbought (bearish signal)
    RSI < 30 = Oversold (bullish signal)
    RSI 30-70 = Neutral
    """
    prices = np.array(prices)
    deltas = np.diff(prices)
    
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    
    avg_gain = np.mean(gains[:period])
    avg_loss = np.mean(losses[:period])
    
    if avg_loss == 0:
        return 100
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    return round(rsi, 2)


def analyze_volume(volume_data):
    """
    Analyze trading volume trends.
    Compares recent volume to average volume.
    """
    if len(volume_data) < 20:
        return None, "Insufficient volume data"
    
    recent_volume = np.mean(volume_data[-5:])  # Last 5 days
    avg_volume = np.mean(volume_data[-20:])    # Last 20 days average
    
    volume_ratio = recent_volume / avg_volume if avg_volume > 0 else 1
    
    return round(volume_ratio, 2), recent_volume, avg_volume


def get_news_sentiment(ticker):
    """
    Get news sentiment using yfinance news data.
    Returns sentiment score and headlines.
    """
    try:
        import yfinance as yf
        stock = yf.Ticker(ticker)
        news = stock.news
        
        if not news:
            return None, []
        
        # Try to use VADER for sentiment analysis
        try:
            from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
            analyzer = SentimentIntensityAnalyzer()
            
            sentiments = []
            headlines = []
            
            for article in news[:10]:  # Analyze up to 10 recent articles
                title = article.get('title', '')
                if title:
                    sentiment = analyzer.polarity_scores(title)
                    sentiments.append(sentiment['compound'])
                    headlines.append({
                        'title': title,
                        'sentiment': 'positive' if sentiment['compound'] > 0.05 else 'negative' if sentiment['compound'] < -0.05 else 'neutral',
                        'score': round(sentiment['compound'], 3)
                    })
            
            avg_sentiment = np.mean(sentiments) if sentiments else 0
            return round(avg_sentiment, 3), headlines
            
        except ImportError:
            # VADER not installed, return basic info
            headlines = [{'title': article.get('title', ''), 'sentiment': 'unknown', 'score': 0} 
                        for article in news[:5]]
            return None, headlines
            
    except Exception as e:
        return None, []


def get_fear_greed_index():
    """
    Get the Fear & Greed Index from Alternative.me API (crypto-based but indicative of market sentiment).
    This is a free API that provides general market sentiment.
    """
    try:
        response = requests.get('https://api.alternative.me/fng/?limit=1', timeout=5)
        if response.status_code == 200:
            data = response.json()
            if 'data' in data and len(data['data']) > 0:
                return {
                    'value': int(data['data'][0]['value']),
                    'classification': data['data'][0]['value_classification'],
                    'timestamp': data['data'][0]['timestamp']
                }
    except Exception:
        pass
    return None


def get_sentiment_summary(ticker, close_prices, volume_data=None):
    """
    Generate a comprehensive sentiment analysis summary.
    """
    sentiment_data = {
        'rsi': None,
        'rsi_signal': None,
        'volume_analysis': None,
        'news_sentiment': None,
        'news_headlines': [],
        'fear_greed': None,
        'overall_sentiment': 'neutral',
        'sentiment_score': 0
    }
    
    bullish_signals = 0
    bearish_signals = 0
    
    # 1. RSI Analysis
    if len(close_prices) >= 15:
        rsi = calculate_rsi(close_prices)
        sentiment_data['rsi'] = rsi
        
        if rsi > 70:
            sentiment_data['rsi_signal'] = 'overbought'
            bearish_signals += 1
        elif rsi < 30:
            sentiment_data['rsi_signal'] = 'oversold'
            bullish_signals += 1
        elif rsi > 50:
            sentiment_data['rsi_signal'] = 'bullish'
            bullish_signals += 0.5
        else:
            sentiment_data['rsi_signal'] = 'bearish'
            bearish_signals += 0.5
    
    # 2. Volume Analysis
    if volume_data is not None and len(volume_data) >= 20:
        volume_ratio, recent_vol, avg_vol = analyze_volume(volume_data)
        sentiment_data['volume_analysis'] = {
            'ratio': volume_ratio,
            'recent_avg': int(recent_vol),
            'period_avg': int(avg_vol),
            'signal': 'high' if volume_ratio > 1.5 else 'low' if volume_ratio < 0.5 else 'normal'
        }
        
        # High volume with price increase = bullish confirmation
        # High volume with price decrease = bearish confirmation
        if volume_ratio > 1.2:
            price_change = (close_prices[-1] - close_prices[-5]) / close_prices[-5]
            if price_change > 0:
                bullish_signals += 1
            else:
                bearish_signals += 1
    
    # 3. News Sentiment
    news_score, headlines = get_news_sentiment(ticker)
    if news_score is not None:
        sentiment_data['news_sentiment'] = news_score
        sentiment_data['news_headlines'] = headlines[:5]  # Top 5 headlines
        
        if news_score > 0.1:
            bullish_signals += 1
        elif news_score < -0.1:
            bearish_signals += 1
    
    # 4. Fear & Greed Index
    fear_greed = get_fear_greed_index()
    if fear_greed:
        sentiment_data['fear_greed'] = fear_greed
        if fear_greed['value'] > 60:
            bullish_signals += 0.5  # Greed
        elif fear_greed['value'] < 40:
            bearish_signals += 0.5  # Fear
    
    # Calculate overall sentiment
    total_signals = bullish_signals + bearish_signals
    if total_signals > 0:
        sentiment_score = (bullish_signals - bearish_signals) / total_signals
        sentiment_data['sentiment_score'] = round(sentiment_score, 2)
        
        if sentiment_score > 0.3:
            sentiment_data['overall_sentiment'] = 'bullish'
        elif sentiment_score < -0.3:
            sentiment_data['overall_sentiment'] = 'bearish'
        else:
            sentiment_data['overall_sentiment'] = 'neutral'
    
    return sentiment_data
