import React from 'react'
import ClassroomDashboard from './pages/ClassroomDashboard';
import HomePage from './pages/homePage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';



const App = () => {
  return (
    <div>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ClassroomDashboard" element={<ClassroomDashboard />} />
      </Routes>
      </BrowserRouter>
      
      
    </div>
  );
};

export default App;
