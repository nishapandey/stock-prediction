import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { axiosInstance } from '../axiosinstance'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
// const Dashboard = () => {
//   const [message, setMessage] = useState('')
//   useEffect(() => {
//     const fetchData = async () => {
//       const response = await axiosInstance.get('/protected/')
//       setMessage(response.data.message)
//     }
//     fetchData()
//   }, [])
//   return <div className="text-center text-light">{message}</div> 
// }
// export default Dashboard

  const Dashboard = () => {
  const [ticker, setTicker] = useState('')
  const [error, setError] = useState()
  const [loading, setLoading] = useState(false)
  const [plot, setPlot] = useState()
  const [ma100, setMA100] = useState()
  const [ma200, setMA200] = useState()
  const [prediction, setPrediction] = useState()
  const [evaluation, setEvaluation] = useState(null)
  const [tomorrowPrice, setTomorrowPrice] = useState()
  const [basePrediction, setBasePrediction] = useState()
  const [sentimentAdjustment, setSentimentAdjustment] = useState(0)
  const [todayPrice, setTodayPrice] = useState()
  const [summary, setSummary] = useState([])
  const [sentiment, setSentiment] = useState(null)

  useEffect(()=>{
      const fetchProtectedData = async () =>{
          try{
              const response = await axiosInstance.get('/protected/');
          }catch(error){
              console.error('Error fetching data:', error)
          }
      }
      fetchProtectedData();
  }, [])

  const handleSubmit = async (e) =>{
      e.preventDefault();
      setLoading(true)
      try{
          const response = await axiosInstance.post('/predict/', {
              ticker: ticker
          });
          console.log(response.data);
          // Backend returns base64 data URLs directly
          setPlot(response.data.plot_img)
          setMA100(response.data.plot_100_dma)
          setMA200(response.data.plot_200_dma)
          setPrediction(response.data.plot_prediction)
          setEvaluation(response.data.evaluation)
          setTomorrowPrice(response.data.tomorrow_prediction)
          setBasePrediction(response.data.base_prediction)
          setSentimentAdjustment(response.data.sentiment_adjustment_pct || 0)
          setTodayPrice(response.data.today_price)
          setSummary(response.data.prediction_summary || [])
          setSentiment(response.data.sentiment || null)
          // Set plots
          if(response.data.error){
              setError(response.data.error)
          }
      }catch(error){
          console.error('There was an error making the API request', error)
      }finally{
          setLoading(false);
      }
  }

return (
  <div className='container'>
      <div className="row">
          <div className="col-md-6 mx-auto">
              <form onSubmit={handleSubmit}>
                  <input type="text" className='form-control' placeholder='Enter Stock Ticker' 
                  onChange={(e) => setTicker(e.target.value)} required
                  />
                  <small>{error && <div className='text-danger'>{error}</div>}</small>
                  <button type='submit' className='btn btn-info mt-3'>
                      {loading ? <span><FontAwesomeIcon icon={faSpinner} spin /> Please wait...</span>: 'See Prediction'}
                  </button>
              </form>
          </div>

          {/* Print prediction plots */}
          {prediction && (
              <div className="prediction mt-5">
              
              {/* Tomorrow's Price Prediction Card */}
              {tomorrowPrice && (
                  <div className="card bg-dark text-light mb-4">
                      <div className="card-body text-center">
                          <h3 className="card-title">Tomorrow's Predicted Price</h3>
                          <p className="text-muted small mb-1">Sentiment-Adjusted Prediction</p>
                          <h1 className={`display-4 ${tomorrowPrice > todayPrice ? 'text-success' : 'text-danger'}`}>
                              ${tomorrowPrice}
                          </h1>
                          <p className="mb-2">
                              Today's Price: <strong>${todayPrice}</strong>
                              <span className={`ms-2 ${tomorrowPrice > todayPrice ? 'text-success' : 'text-danger'}`}>
                                  ({tomorrowPrice > todayPrice ? '▲' : '▼'} 
                                  {Math.abs(((tomorrowPrice - todayPrice) / todayPrice) * 100).toFixed(2)}%)
                              </span>
                          </p>
                          
                          {/* Sentiment Adjustment Breakdown */}
                          {basePrediction && (
                              <div className="mt-3 pt-3 border-top border-secondary">
                                  <div className="row align-items-center">
                                      <div className="col-4">
                                          <small className="text-muted">LSTM Model</small>
                                          <p className="mb-0 fs-5">${basePrediction}</p>
                                      </div>
                                      <div className="col-4">
                                          <small className="text-muted">Sentiment Adj.</small>
                                          <p className={`mb-0 fs-5 ${sentimentAdjustment > 0 ? 'text-success' : sentimentAdjustment < 0 ? 'text-danger' : ''}`}>
                                              {sentimentAdjustment > 0 ? '+' : ''}{sentimentAdjustment}%
                                          </p>
                                      </div>
                                      <div className="col-4">
                                          <small className="text-muted">Final Price</small>
                                          <p className={`mb-0 fs-5 fw-bold ${tomorrowPrice > todayPrice ? 'text-success' : 'text-danger'}`}>
                                              ${tomorrowPrice}
                                          </p>
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              )}

              {/* Sentiment Overview Card */}
              {sentiment && (
                  <div className="card bg-dark text-light mb-4">
                      <div className="card-body">
                          <h5 className="card-title mb-3">Market Sentiment Analysis</h5>
                          <div className="row">
                              {/* Overall Sentiment */}
                              <div className="col-md-4 text-center mb-3">
                                  <h6>Overall Sentiment</h6>
                                  <span className={`badge fs-5 ${
                                      sentiment.overall_sentiment === 'bullish' ? 'bg-success' : 
                                      sentiment.overall_sentiment === 'bearish' ? 'bg-danger' : 'bg-warning'
                                  }`}>
                                      {sentiment.overall_sentiment?.toUpperCase()}
                                  </span>
                                  <p className="mt-2 mb-0">Score: {sentiment.sentiment_score}</p>
                              </div>
                              
                              {/* RSI */}
                              <div className="col-md-4 text-center mb-3">
                                  <h6>RSI (14)</h6>
                                  <span className={`fs-4 ${
                                      sentiment.rsi > 70 ? 'text-danger' : 
                                      sentiment.rsi < 30 ? 'text-success' : 'text-warning'
                                  }`}>
                                      {sentiment.rsi || 'N/A'}
                                  </span>
                                  <p className="mt-2 mb-0 small">
                                      {sentiment.rsi_signal === 'overbought' ? '⚠️ Overbought' :
                                       sentiment.rsi_signal === 'oversold' ? '📈 Oversold' :
                                       sentiment.rsi_signal === 'bullish' ? '↑ Bullish' : '↓ Bearish'}
                                  </p>
                              </div>
                              
                              {/* Fear & Greed */}
                              {sentiment.fear_greed && (
                                  <div className="col-md-4 text-center mb-3">
                                      <h6>Fear & Greed Index</h6>
                                      <span className={`fs-4 ${
                                          sentiment.fear_greed.value > 60 ? 'text-success' : 
                                          sentiment.fear_greed.value < 40 ? 'text-danger' : 'text-warning'
                                      }`}>
                                          {sentiment.fear_greed.value}
                                      </span>
                                      <p className="mt-2 mb-0 small">{sentiment.fear_greed.classification}</p>
                                  </div>
                              )}
                          </div>
                          
                          {/* Volume Analysis */}
                          {sentiment.volume_analysis && (
                              <div className="mt-3 pt-3 border-top border-secondary">
                                  <h6>Volume Analysis</h6>
                                  <p className="mb-0">
                                      Recent volume is <strong>{sentiment.volume_analysis.ratio}x</strong> the 20-day average
                                      <span className={`ms-2 badge ${
                                          sentiment.volume_analysis.signal === 'high' ? 'bg-info' : 
                                          sentiment.volume_analysis.signal === 'low' ? 'bg-secondary' : 'bg-warning'
                                      }`}>
                                          {sentiment.volume_analysis.signal}
                                      </span>
                                  </p>
                              </div>
                          )}
                          
                          {/* News Headlines */}
                          {sentiment.news_headlines && sentiment.news_headlines.length > 0 && (
                              <div className="mt-3 pt-3 border-top border-secondary">
                                  <h6>Recent News Sentiment 
                                      {sentiment.news_sentiment !== null && (
                                          <span className={`ms-2 badge ${
                                              sentiment.news_sentiment > 0.1 ? 'bg-success' : 
                                              sentiment.news_sentiment < -0.1 ? 'bg-danger' : 'bg-warning'
                                          }`}>
                                              {sentiment.news_sentiment > 0 ? '+' : ''}{sentiment.news_sentiment}
                                          </span>
                                      )}
                                  </h6>
                                  <ul className="list-unstyled mb-0 small">
                                      {sentiment.news_headlines.slice(0, 3).map((news, idx) => (
                                          <li key={idx} className="mb-1">
                                              <span className={
                                                  news.sentiment === 'positive' ? 'text-success' :
                                                  news.sentiment === 'negative' ? 'text-danger' : 'text-muted'
                                              }>
                                                  {news.sentiment === 'positive' ? '📈' : 
                                                   news.sentiment === 'negative' ? '📉' : '•'}
                                              </span>
                                              {' '}{news.title}
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                      </div>
                  </div>
              )}

              {/* Prediction Summary */}
              {summary.length > 0 && (
                  <div className="card text-light mb-4" style={{ backgroundColor: 'transparent' }}>
                      <div className="card-body">
                          <h5 className="card-title mb-3">Why this prediction?</h5>
                          <ul className="mb-0">
                              {summary.map((point, index) => (
                                  <li key={index} className="mb-2">
                                      {point.includes('bullish') || point.includes('increase') || point.includes('Golden') || point.includes('positive') || point.includes('BULLISH') ? (
                                          <span className="text-success">{point}</span>
                                      ) : point.includes('bearish') || point.includes('decrease') || point.includes('Death') || point.includes('negative') || point.includes('BEARISH') || point.includes('overbought') ? (
                                          <span className="text-danger">{point}</span>
                                      ) : (
                                          <span className="text-warning">{point}</span>
                                      )}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>
              )}

              <div className="p-3">
                  {plot && (
                      <img src={plot} style={{ maxWidth: '100%' }} />
                  )}
              </div>

              <div className="p-3">
                  {ma100 && (
                      <img src={ma100} style={{ maxWidth: '100%' }} />
                  )}
              </div>

              <div className="p-3">
                  {ma200 && (
                      <img src={ma200} style={{ maxWidth: '100%' }} />
                  )}
              </div>

              <div className="p-3">
                  {prediction && (
                      <img src={prediction} style={{ maxWidth: '100%' }} />
                  )}
              </div>

              {/* Model Evaluation Section */}
              {evaluation && (
                  <div className="card bg-dark text-light p-3 mt-4">
                      <h4 className="mb-4">Model Evaluation</h4>
                      
                      {/* Key Metrics Row */}
                      <div className="row mb-4">
                          <div className="col-md-3 text-center mb-3">
                              <div className="card bg-secondary p-3">
                                  <h6 className="text-muted">MAPE</h6>
                                  <h3 className={evaluation.mape < 5 ? 'text-success' : evaluation.mape < 10 ? 'text-warning' : 'text-danger'}>
                                      {evaluation.mape}%
                                  </h3>
                                  <small>Mean Absolute % Error</small>
                              </div>
                          </div>
                          <div className="col-md-3 text-center mb-3">
                              <div className="card bg-secondary p-3">
                                  <h6 className="text-muted">Direction Accuracy</h6>
                                  <h3 className={evaluation.directional_accuracy > 55 ? 'text-success' : evaluation.directional_accuracy > 50 ? 'text-warning' : 'text-danger'}>
                                      {evaluation.directional_accuracy}%
                                  </h3>
                                  <small>Correct Up/Down Prediction</small>
                              </div>
                          </div>
                          <div className="col-md-3 text-center mb-3">
                              <div className="card bg-secondary p-3">
                                  <h6 className="text-muted">Skill Score</h6>
                                  <h3 className={evaluation.skill_score > 0 ? 'text-success' : 'text-danger'}>
                                      {evaluation.skill_score > 0 ? '+' : ''}{(evaluation.skill_score * 100).toFixed(1)}%
                                  </h3>
                                  <small>vs Naive Baseline</small>
                              </div>
                          </div>
                          <div className="col-md-3 text-center mb-3">
                              <div className="card bg-secondary p-3">
                                  <h6 className="text-muted">R² Score</h6>
                                  <h3 className={evaluation.r2 > 0.5 ? 'text-success' : evaluation.r2 > 0 ? 'text-warning' : 'text-danger'}>
                                      {evaluation.r2}
                                  </h3>
                                  <small>Variance Explained</small>
                              </div>
                          </div>
                      </div>
                      
                      {/* Detailed Metrics */}
                      <div className="row">
                          <div className="col-md-6">
                              <h6 className="border-bottom pb-2 mb-3">Model Performance</h6>
                              <table className="table table-dark table-sm">
                                  <tbody>
                                      <tr>
                                          <td>Root Mean Squared Error (RMSE)</td>
                                          <td className="text-end">${evaluation.rmse}</td>
                                      </tr>
                                      <tr>
                                          <td>Mean Absolute Error (MAE)</td>
                                          <td className="text-end">${evaluation.mae}</td>
                                      </tr>
                                      <tr>
                                          <td>Mean Squared Error (MSE)</td>
                                          <td className="text-end">{evaluation.mse}</td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                          <div className="col-md-6">
                              <h6 className="border-bottom pb-2 mb-3">Baseline Comparison (Naive Forecast)</h6>
                              <table className="table table-dark table-sm">
                                  <tbody>
                                      <tr>
                                          <td>Baseline RMSE</td>
                                          <td className="text-end">${evaluation.baseline_rmse}</td>
                                      </tr>
                                      <tr>
                                          <td>Baseline MAPE</td>
                                          <td className="text-end">{evaluation.baseline_mape}%</td>
                                      </tr>
                                      <tr>
                                          <td>Evaluation Period</td>
                                          <td className="text-end">{evaluation.eval_period_days} days</td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                      </div>
                      
                      {/* Interpretation */}
                      <div className="alert alert-secondary mt-3 mb-0">
                          <strong>Interpretation:</strong>
                          {evaluation.skill_score > 0 ? (
                              <span className="text-success"> Model outperforms naive baseline by {(evaluation.skill_score * 100).toFixed(1)}%.</span>
                          ) : (
                              <span className="text-warning"> Model performs similarly to naive baseline (predicting yesterday's price).</span>
                          )}
                          {' '}Directional accuracy of {evaluation.directional_accuracy}% means the model correctly predicts 
                          price direction {evaluation.directional_accuracy > 50 ? 'better than random chance' : 'at random chance level'}.
                      </div>
                  </div>
              )}

          </div>
          )}
          

      </div>
  </div>
)
}
export default Dashboard