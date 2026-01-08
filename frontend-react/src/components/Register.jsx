import React from 'react'
import { useState } from 'react'
import axios from 'axios'
import { Spinner } from 'react-bootstrap'
const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: ''
  })
  const API_URL = 'http://127.0.0.1:8000/api/v1/'
  const [error, setError] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: ''
  })
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try{
      const response = await axios.post(`${API_URL}register/`, formData)
      setError({
        username: '',
        email: '',
        password: '',
        password_confirm: ''
      })
      setSuccess(true)
    }catch(err){
      const data = err.response?.data || {}
      setError({
        username: data.username?.[0] || '',
        email: data.email?.[0] || '',
        password: data.password?.[0] || '',
        password_confirm: data.password_confirm?.[0] || ''
      })
    }finally{
      setLoading(false)
    }
  }
  return (
    <>
    <div className="container">
        <div className="row justify-content-center">
            <div className="col-md-6 bg-light-dark p-5 rounded">
                <h1 className="text-center mb-4 text-light">Create an Account</h1>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                        <input type="text" className="form-control mb-3" id="username" placeholder="Username" value={formData.username} onChange={handleChange}/>
                        {error.username && <small className="text-danger d-block mb-2">{error.username}</small>}
                  </div>
                  <div className="mb-3">
                        <input type="email" className="form-control mb-3" id="email" placeholder="Email" value={formData.email} onChange={handleChange}/>
                        {error.email && <small className="text-danger d-block mb-2">{error.email}</small>}
                  </div>
                  <div className="mb-3">
                        <input type="password" className="form-control mb-3" id="password" placeholder="Password" value={formData.password} onChange={handleChange}/>
                        {error.password && <small className="text-danger d-block mb-2">{error.password}</small>}
                  </div>
                  <div className="mb-3">
                        <input type="password" className="form-control mb-3" id="password_confirm" placeholder="Confirm password" value={formData.password_confirm} onChange={handleChange}/>
                        {error.password_confirm && <small className="text-danger d-block mb-2">{error.password_confirm}</small>}
                  </div>
                  {success && <div className="alert alert-success d-block mx-auto">Registration successfull</div>}
                  <button type="submit" className="btn btn-info d-block mx-auto" disabled={loading}>{loading ? <Spinner animation="border" size="sm" /> : 'Register'}</button>
                </form>
      </div>
    </div>
    </div>
    </>
  )
}

export default Register