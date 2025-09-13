
import React from 'react';
import { DumbbellIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-dark-accent/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <a href="#" className="flex items-center space-x-2">
          <DumbbellIcon className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold text-white">FitLink</span>
        </a>
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#features" className="text-gray-300 hover:text-primary transition-colors">주요 기능</a>
          <a href="#testimonials" className="text-gray-300 hover:text-primary transition-colors">사용 후기</a>
          <a href="#cta" className="text-gray-300 hover:text-primary transition-colors">시작하기</a>
        </nav>
        <div className="flex items-center space-x-4">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">로그인</a>
            <a href="#" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
                무료로 시작하기
            </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
