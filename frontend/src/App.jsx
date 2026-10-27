import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from './pages/landing.jsx';
import AuthenticationPage from './pages/authentication.jsx';
import AuthProvider from './contexts/AuthContext.jsx';
import AppTheme from './shared-theme/AppTheme.jsx';
import VideoMeetComponent from './pages/VideoMeet.jsx';
import HomeComponent from './pages/home.jsx';
import History from './pages/history.jsx';
import { SpeedInsights } from "@vercel/speed-insights/react"


function App() {

  return (
   <>
   <SpeedInsights />
   <AppTheme>
   <Router>
    <AuthProvider>
    <Routes>
      <Route path="/" element={<LandingPage/>}/>
      <Route path="/auth" element={<AuthenticationPage/>}/>
      <Route path="/home" element={<HomeComponent/>}/>
      <Route path="/history" element={<History/>}/> 
      <Route path="/:url" element={<VideoMeetComponent/>}/>

      <Route path="*" element={<Navigate to="/" />} />

    </Routes>
    </AuthProvider>
   </Router>
   </AppTheme>
   </> 
  )
}

export default App;
