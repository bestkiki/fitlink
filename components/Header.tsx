import React from 'react';
import { DumbbellIcon } from './icons';
import { Page } from '../UnauthenticatedApp';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import NotificationsBell from './NotificationsBell';

interface HeaderProps {
    user: firebase.User | null;
    onNavigate?: (page: Page) => void;
    onLogout?: () => void;
    onNavigateToHealthInfo?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onNavigate, onLogout, onNavigateToHealthInfo }) => {
  const navigate = onNavigate || (() => {});

  const handleLogoClick = () => {
    if (user) {
      // For logged-in users, clicking the logo should take them to their dashboard.
      // A simple way to reset the state of the dashboard is to navigate to the root.
      window.location.href = '/';
    } else {
      // For logged-out users, it navigates to the landing page.
      navigate('landing');
    }
  };

  return (
    <header className="bg-dark-accent/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <button onClick={handleLogoClick} className="flex items-center space-x-2">
          <DumbbellIcon className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold text-white">FitLink</span>
        </button>
        {!user && (
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-300 hover:text-primary transition-colors">주요 기능</a>
            <a href="#testimonials" className="text-gray-300 hover:text-primary transition-colors">사용 후기</a>
            <button onClick={onNavigateToHealthInfo} className="text-gray-300 hover:text-primary transition-colors">건강 정보</button>
            <a href="#cta" className="text-gray-300 hover:text-primary transition-colors">시작하기</a>
          </nav>
        )}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <NotificationsBell user={user} />
              <button onClick={onLogout} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button onClick={onNavigateToHealthInfo} className="text-gray-300 hover:text-primary transition-colors md:hidden">건강 정보</button>
              <button onClick={() => navigate('login')} className="text-gray-300 hover:text-white transition-colors">로그인</button>
              <button onClick={() => navigate('signup')} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  무료로 시작하기
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;