import React from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from './AuthProvider'
import { useContext } from 'react'
const PublicRoute = ({ children }) => {
  const { isLoggedIn } = useContext(AuthContext)
  return !isLoggedIn ? children : <Navigate to='/dashboard' />
}
export default PublicRoute