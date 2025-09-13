
import React from 'react';
// FIX: Updated Firebase imports to use the v9 compat libraries to fix type errors.
import firebase from 'firebase/compat/app';
// FIX: Replaced non-existent v9 'User' import with v8 compatible type.
// FIX: Import for side effects and type augmentation for firebase.auth.User
import 'firebase/compat/auth';

interface MemberDashboardProps {
  // FIX: Used firebase.User type.
  user: firebase.User;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ user }) => {
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
        회원 대시보드
      </h1>
      <p className="text-lg text-gray-300">
        환영합니다, <span className="font-semibold text-secondary">{user.email}</span> 님!
      </p>
      <p className="mt-4 text-gray-400">
        여기에서 운동 기록을 확인하고 수업을 예약하세요.
      </p>
    </div>
  );
};

export default MemberDashboard;