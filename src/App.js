import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SiteNavbar from './components/Navbar';
import Home from './pages/Home';
import Menu from './pages/Menu';

function App() {
  return (
    <Router>
      <SiteNavbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
      </Routes>
    </Router>
  );
}

export default App;