import React from 'react'
import { useState, useContext } from 'react'
import axios from 'axios'
import { Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from './AuthProvider'

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const API_URL = 'http://127.0.0.1:8000/api/v1/'
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const [error, setError] = useState('')
  const {isLoggedIn, setIsLoggedIn} = useContext(AuthContext)
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try{
      const response = await axios.post(`${API_URL}token/`, formData)
      localStorage.setItem('access_token', response.data.access)
      localStorage.setItem('refresh_token', response.data.refresh)
      setIsLoggedIn(true)
      navigate('/') 
      
    }catch(err){
      setError(err.response.data.detail)
    }finally{
      setLoading(false)
    } 
  }
  return (
    <>
    <div className="container">
        <div className="row justify-content-center">
            <div className="col-md-6 bg-light-dark p-5 rounded">
                <h1 className="text-center mb-4 text-light">Login</h1>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                        <input type="text" className="form-control mb-3" id="username" placeholder="Username" value={formData.username} onChange={handleChange}/>
                  </div>
                  <div className="mb-3">
                        <input type="password" className="form-control mb-3" id="password" placeholder="Password" value={formData.password} onChange={handleChange}/>
                  </div>
                    {error && <div className="alert alert-danger d-block mx-auto">Invalid credentials</div>}
                    <button type="submit" className="btn btn-info d-block mx-auto" disabled={loading}>{loading ? <Spinner animation="border" size="sm" /> : 'Login'}</button>
                </form>
      </div>
    </div>
    </div>
    </>
  )
}

export default Login