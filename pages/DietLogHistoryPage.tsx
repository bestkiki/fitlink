import React from 'react';
import { ArrowLeftIcon, ClipboardListIcon } from '../components/icons';
import { UserProfile } from '../App';
import firebase from 'firebase/compat/app';

interface DietLogHistoryPageProps {
    user: firebase.User;
    userProfile: UserProfile;
    onBack: () => void;
}

const DietLogHistoryPage: React.FC<DietLogHistoryPageProps> = ({ user, userProfile, onBack }) => {
    // State for diet logs will be added later based on user's request.

    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center space-x-2 text-secondary mb-6 hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>대시보드로 돌아가기</span>
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center">
                        <ClipboardListIcon className="w-8 h-8 mr-3 text-secondary"/>
                        식단 기록 관리
                    </h1>
                    <p className="text-gray-400">지난 식단 기록을 확인하고 관리할 수 있습니다.</p>
                </div>
            </div>

            <div className="bg-dark-accent p-8 rounded-lg shadow-lg text-center">
                <p className="text-gray-400">식단 기록 관리 기능이 곧 추가될 예정입니다.</p>
            </div>
        </div>
    );
};

export default DietLogHistoryPage;
