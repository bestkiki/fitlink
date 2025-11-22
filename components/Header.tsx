import React, { useState, useEffect } from 'react';
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

  // 메뉴가 열려있을 때 스크롤 막기
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const handleLogoClick = () => {
    if (user) {
      window.location.href = '/';
    } else {
      navigate('landing');
    }
    setIsMobileMenuOpen(false);
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header className="bg-dark-accent/80 backdrop-blur-sm sticky top-0 z-50 border-b border-white/5 h-[64px]">
        <div className="container mx-auto px-6 h-full flex justify-between items-center">
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
                <button onClick={onLogout} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm sm:text-base">
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
                {/* Mobile Menu Toggle Button (Only visible when menu is closed) */}
                {!isMobileMenuOpen && (
                    <button 
                        className="md:hidden text-gray-300 hover:text-white focus:outline-none p-2"
                        onClick={() => setIsMobileMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        <Bars3Icon className="w-8 h-8" />
                    </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Full Screen Mobile Menu Overlay */}
      {!user && isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-dark flex flex-col animate-in fade-in duration-200">
            {/* Mobile Menu Header */}
            <div className="flex justify-between items-center px-6 h-[64px] border-b border-white/5 shrink-0 bg-dark-accent/50">
                <button onClick={handleLogoClick} className="flex items-center space-x-2">
                    <DumbbellIcon className="w-8 h-8 text-primary" />
                    <span className="text-2xl font-bold text-white">FitLink</span>
                </button>
                <button 
                    onClick={closeMenu}
                    className="p-2 text-gray-300 hover:text-white focus:outline-none"
                    aria-label="Close menu"
                >
                    <XMarkIcon className="w-8 h-8" />
                </button>
            </div>

            {/* Mobile Menu Links (Centered) */}
            <div className="flex-1 flex flex-col justify-center px-8 space-y-8 overflow-y-auto">
                <a 
                    href="#features" 
                    onClick={(e) => { e.preventDefault(); closeMenu(); navigate('landing'); setTimeout(() => document.getElementById('features')?.scrollIntoView(), 100); }} 
                    className="text-3xl font-bold text-white hover:text-primary transition-colors text-center"
                >
                    주요 기능
                </a>
                <button 
                    onClick={() => { closeMenu(); navigate('community'); }} 
                    className="text-3xl font-bold text-white hover:text-primary transition-colors text-center"
                >
                    커뮤니티
                </button>
                <button 
                    onClick={() => { closeMenu(); navigate('qna'); }} 
                    className="text-3xl font-bold text-white hover:text-primary transition-colors text-center"
                >
                    QnA
                </button>
                <button 
                    onClick={() => { closeMenu(); onNavigateToHealthInfo?.(); }} 
                    className="text-3xl font-bold text-white hover:text-primary transition-colors text-center"
                >
                    건강 정보
                </button>
            </div>
            
            {/* Mobile Menu Footer Buttons */}
            <div className="p-6 border-t border-white/5 shrink-0 bg-dark-accent/30 pb-10">
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => { closeMenu(); navigate('login'); }} 
                        className="text-lg font-medium text-gray-300 hover:text-white py-4 text-center border border-gray-600 rounded-xl bg-transparent active:bg-gray-700 transition-colors"
                    >
                        로그인
                    </button>
                    <button 
                        onClick={() => { closeMenu(); navigate('signup'); }} 
                        className="bg-primary hover:bg-primary-dark active:bg-primary-dark text-white font-bold py-4 text-center rounded-xl transition-colors text-lg shadow-lg"
                    >
                        무료로 시작하기
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default Header;