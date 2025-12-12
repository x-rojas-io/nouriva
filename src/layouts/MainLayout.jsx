import React from 'react';
import Navbar from '../components/Navbar';

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;