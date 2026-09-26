import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import LoadingSpinner from '../components/common/LoadingSpinner';

const RootLayout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <>
      <Navbar />
      <main className={`main-content ${isHomePage ? 'main-content-home' : ''}`}>
        {isHomePage ? (
          <Suspense fallback={<LoadingSpinner fullScreen text="Loading page..." />}>
            <Outlet />
          </Suspense>
        ) : (
          <div className="container">
            <Suspense fallback={<LoadingSpinner fullScreen text="Loading page..." />}>
              <Outlet />
            </Suspense>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default RootLayout;
