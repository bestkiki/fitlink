import React from 'react';
import { ArrowLeftIcon, MagnifyingGlassIcon } from '../components/icons';

interface CalorieSearchPageProps {
    onBack: () => void;
}

const CalorieSearchPage: React.FC<CalorieSearchPageProps> = ({ onBack }) => {
    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center space-x-2 text-secondary mb-6 hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>식단 기록 관리로 돌아가기</span>
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center">
                        <MagnifyingGlassIcon className="w-8 h-8 mr-3 text-secondary"/>
                        칼로리 정보 검색
                    </h1>
                    <p className="text-gray-400">음식 이름을 검색하여 칼로리 정보를 찾아보세요.</p>
                </div>
            </div>

            <div className="bg-dark-accent p-8 rounded-lg shadow-lg text-center">
                <p className="text-gray-400">칼로리 검색 기능이 곧 추가될 예정입니다.</p>
            </div>
        </div>
    );
};

export default CalorieSearchPage;
