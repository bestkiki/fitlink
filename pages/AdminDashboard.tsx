import React from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { UserProfile } from '../App';
import { SparklesIcon } from '../components/icons';

interface AdminDashboardProps {
  user: firebase.User;
  userProfile: UserProfile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, userProfile }) => {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex items-center space-x-4 mb-8">
        <SparklesIcon className="w-10 h-10 text-primary" />
        <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">관리자 대시보드</h1>
            <p className="text-lg text-gray-300">
                환영합니다, <span className="font-semibold text-primary">{userProfile.name || user.email}</span> 님!
            </p>
        </div>
      </div>
      
      <div className="bg-dark-accent p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-white">배너 관리 시스템</h2>
        <p className="mt-2 text-gray-400">
          이곳에서 트레이너 및 회원 대시보드에 표시될 광고 배너를 관리할 수 있습니다.
          <br/>
          (기능 개발 예정)
        </p>
      </div>

    </div>
  );
};

export default AdminDashboard;
