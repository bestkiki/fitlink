
import React, { useState } from 'react';
import { DumbbellIcon, Bars3Icon, XMarkIcon } from './icons';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    setIsMobileMenuOpen(false);
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="bg-dark-accent/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <button onClick={handleLogoClick} className="flex items-center space-x-2 z-50 relative">
          <DumbbellIcon className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold text-white">FitLink</span>
        </button>
        
        {!user && (
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" onClick={(e) => { e.preventDefault(); navigate('landing'); setTimeout(() => document.getElementById('features')?.scrollIntoView(), 100); }} className="text-gray-300 hover:text-primary transition-colors">주요 기능</a>
            <button onClick={() => navigate('community')} className="text-gray-300 hover:text-primary transition-colors">커뮤니티</button>
            <button onClick={() => navigate('qna')} className="text-gray-300 hover:text-primary transition-colors">QnA</button>
            <button onClick={onNavigateToHealthInfo} className="text-gray-300 hover:text-primary transition-colors">건강 정보</button>
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
              <div className="hidden md:flex items-center space-x-4">
                <button onClick={() => navigate('login')} className="text-gray-300 hover:text-white transition-colors">로그인</button>
                <button onClick={() => navigate('signup')} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    무료로 시작하기
                </button>
              </div>
              {/* Mobile Menu Toggle Button */}
              <button 
                className="md:hidden text-gray-300 hover:text-white focus:outline-none z-50 relative p-1"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                    <XMarkIcon className="w-8 h-8" />
                ) : (
                    <Bars3Icon className="w-8 h-8" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {!user && isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-[72px] bottom-0 bg-dark-accent/95 backdrop-blur-md z-40 flex flex-col p-6 md:hidden overflow-y-auto animate-fade-in">
            <nav className="flex flex-col space-y-2">
                <a 
                    href="#features" 
                    onClick={(e) => { e.preventDefault(); closeMenu(); navigate('landing'); setTimeout(() => document.getElementById('features')?.scrollIntoView(), 100); }} 
                    className="text-lg font-medium text-gray-200 hover:text-primary py-3 border-b border-gray-700"
                >
                    주요 기능
                </a>
                <button 
                    onClick={() => { closeMenu(); navigate('community'); }} 
                    className="text-lg font-medium text-gray-200 hover:text-primary py-3 text-left border-b border-gray-700"
                >
                    커뮤니티
                </button>
                <button 
                    onClick={() => { closeMenu(); navigate('qna'); }} 
                    className="text-lg font-medium text-gray-200 hover:text-primary py-3 text-left border-b border-gray-700"
                >
                    QnA
                </button>
                <button 
                    onClick={() => { closeMenu(); onNavigateToHealthInfo?.(); }} 
                    className="text-lg font-medium text-gray-200 hover:text-primary py-3 text-left border-b border-gray-700"
                >
                    건강 정보
                </button>
            </nav>
            <div className="flex flex-col space-y-3 mt-6 pb-20">
                <button 
                    onClick={() => { closeMenu(); navigate('login'); }} 
                    className="text-lg font-medium text-gray-300 hover:text-white py-2 text-center border border-gray-600 rounded-lg"
                >
                    로그인
                </button>
                <button 
                    onClick={() => { closeMenu(); navigate('signup'); }} 
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-colors w-full text-center text-lg shadow-lg"
                >
                    무료로 시작하기
                </button>
            </div>
        </div>
      )}
    </header>
  );
};

export default Header;
