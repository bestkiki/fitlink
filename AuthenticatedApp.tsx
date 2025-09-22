import React from 'react';
// FIX: Updated Firebase imports to use the v9 compat libraries to fix type errors.
import firebase from 'firebase/compat/app';
// FIX: Replaced non-existent v9 'User' import with v8 compatible type.
// FIX: Import for side effects and type augmentation for firebase.auth.User
import 'firebase/compat/auth';
import { UserProfile } from './App';
import TrainerDashboard from './pages/TrainerDashboard';
import MemberDashboard from './pages/MemberDashboard';
import AdminDashboard from './pages/AdminDashboard';

interface AuthenticatedAppProps {
  // FIX: Used firebase.User type.
  user: firebase.User;
  userProfile: UserProfile;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ user, userProfile }) => {
  // 1. Check for Admin role first
  if (userProfile.isAdmin) {
    return <AdminDashboard user={user} userProfile={userProfile} />;
  }

  // 2. Check for Trainer role
  if (userProfile.role === 'trainer') {
    return <TrainerDashboard user={user} userProfile={userProfile} />;
  }

  // 3. Check for Member role
  if (userProfile.role === 'member') {
    return <MemberDashboard user={user} userProfile={userProfile} />;
  }

  return (
    <div className="container mx-auto px-6 py-12 text-center">
      <h1 className="text-2xl font-bold">오류: 사용자 역할을 확인할 수 없습니다.</h1>
    </div>
  );
};

export default AuthenticatedApp;