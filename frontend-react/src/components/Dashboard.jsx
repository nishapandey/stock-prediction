import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { axiosInstance } from '../axiosinstance'
const Dashboard = () => {
  const [message, setMessage] = useState('')
  useEffect(() => {
    const fetchData = async () => {
      const response = await axiosInstance.get('/protected/')
      setMessage(response.data.message)
    }
    fetchData()
  }, [])
  return <div className="text-center text-light">{message}</div> 
}
export default Dashboard