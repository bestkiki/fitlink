
import React from 'react';
// FIX: Replaced non-existent v9 'User' import with v8 compatible type.
import firebase from 'firebase/app';
import { UserProfile } from './App';
import TrainerDashboard from './pages/TrainerDashboard';
import MemberDashboard from './pages/MemberDashboard';

interface AuthenticatedAppProps {
  // FIX: Used firebase.User type.
  user: firebase.User;
  userProfile: UserProfile;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ user, userProfile }) => {
  if (userProfile.role === 'trainer') {
    return <TrainerDashboard user={user} />;
  }

  if (userProfile.role === 'member') {
    return <MemberDashboard user={user} />;
  }

  return (
    <div className="container mx-auto px-6 py-12 text-center">
      <h1 className="text-2xl font-bold">오류: 사용자 역할을 확인할 수 없습니다.</h1>
    </div>
  );
};

export default AuthenticatedApp;
