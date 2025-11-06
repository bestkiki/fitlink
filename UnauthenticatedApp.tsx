import React from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

export type Page = 'landing' | 'login' | 'signup';

interface UnauthenticatedAppProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  trainerId?: string | null;
  onNavigateToHealthInfo: () => void;
}

const UnauthenticatedApp: React.FC<UnauthenticatedAppProps> = ({ currentPage, onNavigate, trainerId, onNavigateToHealthInfo }) => {
  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onNavigate={onNavigate} />;
      case 'signup':
        return <SignupPage onNavigate={onNavigate} trainerId={trainerId} />;
      case 'landing':
      default:
        return <LandingPage onNavigate={onNavigate} onNavigateToHealthInfo={onNavigateToHealthInfo} />;
    }
  };

  return <>{renderPage()}</>;
};

export default UnauthenticatedApp;