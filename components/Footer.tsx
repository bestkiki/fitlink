
import React from 'react';
import { DumbbellIcon } from './icons';

const Footer: React.FC = () => {
    return (
        <footer className="bg-dark-accent border-t border-gray-700">
            <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-2 mb-4 md:mb-0">
                        <DumbbellIcon className="w-7 h-7 text-primary" />
                        <span className="text-xl font-bold text-white">FitLink</span>
                    </div>
                    <div className="text-gray-400 text-sm">
                        &copy; {new Date().getFullYear()} FitLink. All rights reserved.
                    </div>
                    <div className="flex space-x-4 mt-4 md:mt-0">
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">이용약관</a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">개인정보처리방침</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
