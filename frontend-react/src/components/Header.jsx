import React from 'react'
import Button from './Button'
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import { Link } from 'react-router-dom'
import { AuthContext } from './AuthProvider'
import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'  
function Header() {
  const {isLoggedIn, setIsLoggedIn} = useContext(AuthContext)
  const navigate = useNavigate()
  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsLoggedIn(false)
    navigate('/login')
  }
  return (
    <>
    <nav className="navbar container pt-3 pb-3 align-items-start">
       <Link to='/' className='navbar-brand text-light'>Stock Prediction Portal</Link>       
        {isLoggedIn ? (
          <div className='navbar-text'>
            <button className='btn btn-info' onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div className='navbar-text'>
            &nbsp;
            <Link to='/login' className='btn btn-info'>Login</Link>
            &nbsp; &nbsp;
            <Link to='/register' className='btn btn-info'>Register</Link>
          </div>
        )}
        </nav>
    </>
  );
};

export default Header;