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
  const [mse, setMSE] = useState()
  const [rmse, setRMSE] = useState()
  const [r2, setR2] = useState()
  const [tomorrowPrice, setTomorrowPrice] = useState()
  const [todayPrice, setTodayPrice] = useState()
  const [summary, setSummary] = useState([])

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
          setMSE(response.data.mse)
          setRMSE(response.data.rmse)
          setR2(response.data.r2)
          setTomorrowPrice(response.data.tomorrow_prediction)
          setTodayPrice(response.data.today_price)
          setSummary(response.data.prediction_summary || [])
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
                          <h1 className={`display-4 ${tomorrowPrice > todayPrice ? 'text-success' : 'text-danger'}`}>
                              ${tomorrowPrice}
                          </h1>
                          <p className="mb-0">
                              Today's Price: <strong>${todayPrice}</strong>
                              <span className={`ms-2 ${tomorrowPrice > todayPrice ? 'text-success' : 'text-danger'}`}>
                                  ({tomorrowPrice > todayPrice ? '▲' : '▼'} 
                                  {Math.abs(((tomorrowPrice - todayPrice) / todayPrice) * 100).toFixed(2)}%)
                              </span>
                          </p>
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
                                      {point.includes('bullish') || point.includes('increase') || point.includes('Golden') ? (
                                          <span className="text-success">{point}</span>
                                      ) : point.includes('bearish') || point.includes('decrease') || point.includes('Death') ? (
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

              <div className="text-light p-3">
                  <h4>Model Evalulation</h4>
                  <p>Mean Squared Error (MSE): {mse}</p>
                  <p>Root Mean Squared Error (RMSE): {rmse}</p>
                  <p>R-Squared: {r2}</p>
              </div>

          </div>
          )}
          

      </div>
  </div>
)
}
export default Dashboard