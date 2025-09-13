import React, { useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

interface TrainerDashboardProps {
  user: firebase.User;
}

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ user }) => {
  const inviteLink = `${window.location.origin}/signup/coach/${user.uid}`;
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            트레이너 대시보드
          </h1>
          <p className="text-lg text-gray-300">
            환영합니다, <span className="font-semibold text-primary">{user.email}</span> 님!
          </p>
        </div>
      </div>
      
      {/* Invite Link Section */}
      <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-white mb-3">회원 초대 링크</h2>
        <p className="text-gray-400 mb-4">
          회원을 등록하려면 아래 초대 링크를 공유하세요. 회원이 이 링크를 통해 가입하면 자동으로 회원 목록에 추가됩니다.
        </p>
        <div className="flex items-center space-x-2 bg-dark p-2 rounded-md">
          <input 
            type="text"
            value={inviteLink}
            readOnly
            className="w-full bg-transparent text-gray-300 border-none focus:ring-0"
          />
          <button 
            onClick={handleCopyLink}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition-colors whitespace-nowrap"
          >
            {copied ? '복사 완료!' : '링크 복사'}
          </button>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-4">내 회원 목록</h2>
        <div className="bg-dark-accent p-6 rounded-lg text-center">
            <p className="text-gray-400">아직 등록된 회원이 없습니다.</p>
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;