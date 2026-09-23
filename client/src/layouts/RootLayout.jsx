import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import LoadingSpinner from '../components/common/LoadingSpinner';

const RootLayout = () => {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <div className="container">
          <Suspense fallback={<LoadingSpinner fullScreen text="Loading page..." />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default RootLayout;

