import React from 'react'
import Button from './Button'
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import { Link } from 'react-router-dom'


function Header() {
  return (
    <>
    <nav className="navbar container pt-3 pb-3 align-items-start">
       <Link to='/' className='navbar-brand text-light'>Stock Prediction Portal</Link>       

          <div className='navbar-text'>
          &nbsp;
          <Link to='/login' className='btn btn-info'>Login</Link>
          &nbsp;
          <Link to='/register' className='btn btn-info'>Register</Link>
          </div>
        </nav>
    </>
  );
};

export default Header;