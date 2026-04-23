import React from 'react';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { FeaturedProjects } from './components/FeaturedProjects';
import { AboutSection } from './components/AboutSection';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-[#f1f2f4] py-4 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-gray-200">
      <div className="max-w-[1280px] mx-auto bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-14 lg:p-16 shadow-sm overflow-hidden border border-gray-100">
        
        <Navigation />

        <main className="space-y-32">
          <Hero />
          <FeaturedProjects />
          <AboutSection />
        </main>
        
        <Footer />

      </div>
    </div>
  );
}

