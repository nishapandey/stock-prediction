import React from 'react'
import Button from './Button'
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';


function Header() {
  return (
    <>
    <nav className="navbar container pt-3 pb-3 align-items-start">
       <a className='navbar-brand text-light' href="#home">Stock Prediction Portal</a>       

          <div className='navbar-text'>
          &nbsp;
          <Button text='Login' className="btn-outline-info" url="#" />
          &nbsp;
          <Button text='Register' className="btn-info" url="#" />
          </div>
        </nav>
    </>
  );
};

export default Header;