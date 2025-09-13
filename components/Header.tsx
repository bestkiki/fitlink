
import React from 'react';
import { DumbbellIcon } from './icons';
import { Page } from '../UnauthenticatedApp';
// FIX: Updated Firebase imports to use the v9 compat libraries to fix type errors.
import firebase from 'firebase/compat/app';
// FIX: Replaced non-existent v9 'User' import with v8 compatible type.
// FIX: Import for side effects and type augmentation for firebase.auth.User
import 'firebase/compat/auth';

interface HeaderProps {
    // FIX: Used firebase.auth.User type.
    user: firebase.auth.User | null;
    onNavigate?: (page: Page) => void;
    onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onNavigate, onLogout }) => {
  // Use a dummy navigate function if not provided (for AuthenticatedApp)
  const navigate = onNavigate || (() => {});

  return (
    <header className="bg-dark-accent/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <button onClick={() => navigate('landing')} className="flex items-center space-x-2 disabled:cursor-default" disabled={!!user}>
          <DumbbellIcon className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold text-white">FitLink</span>
        </button>
        {!user && (
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-300 hover:text-primary transition-colors">주요 기능</a>
            <a href="#testimonials" className="text-gray-300 hover:text-primary transition-colors">사용 후기</a>
            <a href="#cta" className="text-gray-300 hover:text-primary transition-colors">시작하기</a>
          </nav>
        )}
        <div className="flex items-center space-x-4">
          {user ? (
            <button onClick={onLogout} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
              로그아웃
            </button>
          ) : (
            <>
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