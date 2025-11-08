import React from "react";
import HomePage from "./pages/homePage";
import ClassroomPage from "./pages/ClassroomPage";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";


const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/classroom" element={<ClassroomPage />} />
        </Routes>
      </BrowserRouter>

    </div>
  );
};

export default App;
