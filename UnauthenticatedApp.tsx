import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

export type Page = 'landing' | 'login' | 'signup';

const UnauthenticatedApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  const handleNavigate = (page: Page) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'signup':
        return <SignupPage onNavigate={handleNavigate} />;
      case 'landing':
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return <>{renderPage()}</>;
};

export default UnauthenticatedApp;
