import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black font-sans">
      <div className="relative w-full max-w-[450px] aspect-[9/16] overflow-hidden shadow-2xl flex flex-col border border-gray-800 rounded-lg">
        {/* Content */}
        <main className="flex-1 flex flex-col w-full h-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
