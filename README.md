# Stock Price Prediction

A full-stack web application that predicts tomorrow's stock price using deep learning and real-time market sentiment analysis.

## Overview

This application combines an **LSTM neural network** trained on 10 years of historical data with **market sentiment signals** to generate more informed stock price predictions. Rather than relying solely on historical patterns, the system adjusts predictions based on current market conditions.

## Features

- **LSTM-Based Predictions** - Uses the previous 100 days of prices to predict the next day's closing price
- **Sentiment-Adjusted Forecasts** - Integrates RSI indicators, trading volume, news sentiment, and Fear & Greed Index
- **Interactive Dashboard** - Visualize price history, moving averages (100/200 DMA), and prediction charts
- **User Authentication** - Secure JWT-based login with automatic token refresh
- **Model Evaluation** - Comprehensive metrics including MAPE, directional accuracy, and skill score

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React, Vite, Bootstrap, Axios |
| **Backend** | Django REST Framework, SimpleJWT |
| **ML/Data** | Keras/TensorFlow, pandas, scikit-learn |
| **APIs** | yfinance, VADER Sentiment, Alternative.me |

## How It Works

1. **Data Collection** - Fetches 10 years of historical stock data via yfinance API
2. **LSTM Prediction** - Model uses 100-day sequences to predict next-day price
3. **Sentiment Analysis** - Analyzes RSI, volume trends, news headlines, and market sentiment
4. **Conflict Resolution** - When LSTM and sentiment signals conflict, predictions are adjusted conservatively
5. **Evaluation** - Compares model performance against a naive baseline (yesterday's price)

## Model Details

- **Architecture**: LSTM Neural Network
- **Input**: 100-day price sequences (normalized with MinMaxScaler)
- **Training Split**: 70% training / 30% testing (chronological)
- **Evaluation**: Walk-forward 1-day-ahead predictions

## Getting Started

### Backend Setup
```bash
cd backend-drf
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend-react
npm install
npm run dev
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/register/` | POST | User registration |
| `/api/v1/token/` | POST | Obtain JWT tokens |
| `/api/v1/token/refresh/` | POST | Refresh access token |
| `/api/v1/predict/` | POST | Get stock prediction |
| `/api/v1/protected/` | GET | Auth verification |

## Disclaimer

This application is for educational purposes only. Stock predictions are inherently uncertain and should not be used as the sole basis for investment decisions.
