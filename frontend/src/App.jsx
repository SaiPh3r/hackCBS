import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/homePage';
import ClassroomDashboard from './pages/ClassroomDashboard';



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
