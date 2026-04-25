import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { ProjectDetail } from './pages/ProjectDetail';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#f1f2f4] py-4 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-gray-200">
        <div className="max-w-[1280px] mx-auto bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-14 lg:p-16 shadow-sm overflow-hidden border border-gray-100">
          
          <Navigation />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/project/:slug" element={<ProjectDetail />} />
          </Routes>
          
          <Footer />

        </div>
      </div>
    </Router>
  );
}
