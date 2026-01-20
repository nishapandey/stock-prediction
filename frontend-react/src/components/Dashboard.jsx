import React from 'react'
import axios from 'axios'
import { useEffect } from 'react'
import { useState } from 'react'

const Dashboard = () => {
  const API_URL = 'http://127.0.0.1:8000/api/v1/'
  const [message, setMessage] = useState('')
  useEffect(() => {
    const fetchData = async () => {
      try {
        const access_token = localStorage.getItem('access_token')
        if (!access_token) {
          throw new Error('No access token found')
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`   
        const response = await axios.get(`${API_URL}protected/`)
        setMessage(response?.data?.message)
      } catch (error) {
        setMessage('Error: ' + error.response.data.detail)
      }
    }
    fetchData()
  }, [])
  return (
    <>
    <div className="text-center text-light">Dashboard</div> 
    <div className="text-center text-light">{message}</div> 
    </>
   
  );
}

export default Dashboard