import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './pages/Login';
import Studentlogin from './pages/Studentlogin';
import Admin from './pages/Admin';


const Router = () => {
  return (
    <>
      <BrowserRouter>
        <div> {/* Fixed navbar ka space */}
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/student" element={<Studentlogin />} />
             <Route path="/login" element={<Login/>} />  
            <Route path='/admin' element={<Admin/>}/>
          </Routes>
        </div>
      </BrowserRouter>
    </>
  )
}

export default Router