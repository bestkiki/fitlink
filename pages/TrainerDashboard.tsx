import React, { useState, useEffect } from 'react';
// FIX: Updated Firebase imports to use the v9 compat libraries to fix type errors.
import firebase from 'firebase/compat/app';
// FIX: Import for side effects and type augmentation for firebase.auth.User
import 'firebase/compat/auth';
import { db } from '../firebase';
import { UsersIcon, CalendarIcon, ChatBubbleIcon } from '../components/icons';

interface TrainerDashboardProps {
  // FIX: Used firebase.User type.
  user: firebase.User;
}

interface Member {
    id: string;
    email: string;
}

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ user }) => {
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const querySnapshot = await db.collection('users').where('trainerId', '==', user.uid).get();
        const memberData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          email: doc.data().email,
        }));
        setMembers(memberData);
      } catch (err) {
        console.error("Error fetching members:", err);
        setError('회원 목록을 불러오는 데 실패했습니다.');
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [user.uid]);

  const generateInviteLink = () => {
    const link = `${window.location.origin}/signup/coach/${user.uid}`;
    setInviteLink(link);
  };

  const copyToClipboard = () => {
    if (inviteLink) {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
        트레이너 대시보드
      </h1>
      <p className="text-lg text-gray-300 mb-8">
        환영합니다, <span className="font-semibold text-primary">{user.email}</span> 님!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Invite Member Card */}
        <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-white mb-4">회원 초대하기</h2>
          <p className="text-gray-400 mb-4">
            회원을 초대하여 FitLink에서 함께 운동 계획을 관리하세요. 아래 버튼을 눌러 초대 링크를 생성하세요.
          </p>
          {!inviteLink ? (
            <button
              onClick={generateInviteLink}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              초대 링크 생성
            </button>
          ) : (
            <div className="flex flex-col space-y-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="w-full bg-dark p-2 rounded-md text-gray-300 border border-gray-600 focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="w-full bg-secondary hover:bg-secondary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                {copied ? '복사 완료!' : '링크 복사'}
              </button>
            </div>
          )}
        </div>

        {/* Other feature cards */}
        <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center">
            <UsersIcon className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">회원 관리</h2>
            <p className="text-gray-400">등록된 회원 목록을 확인하고 관리합니다.</p>
            <button className="mt-4 bg-gray-600 text-gray-300 font-bold py-2 px-4 rounded-lg cursor-not-allowed">
                곧 제공될 예정입니다
            </button>
        </div>
        <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center">
            <CalendarIcon className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">스케줄 관리</h2>
            <p className="text-gray-400">수업 스케줄을 확인하고 예약합니다.</p>
             <button className="mt-4 bg-gray-600 text-gray-300 font-bold py-2 px-4 rounded-lg cursor-not-allowed">
                곧 제공될 예정입니다
            </button>
        </div>
        <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center">
            <ChatBubbleIcon className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">메시지</h2>
            <p className="text-gray-400">회원과 메시지를 주고 받습니다.</p>
             <button className="mt-4 bg-gray-600 text-gray-300 font-bold py-2 px-4 rounded-lg cursor-not-allowed">
                곧 제공될 예정입니다
            </button>
        </div>
      </div>

      {/* Member List Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-6">내 회원 목록</h2>
        <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
            {loadingMembers ? (
                <p className="text-gray-400">회원 목록을 불러오는 중...</p>
            ) : error ? (
                <p className="text-red-400">{error}</p>
            ) : members.length > 0 ? (
                <ul className="space-y-4">
                    {members.map(member => (
                        <li key={member.id} className="p-4 bg-dark rounded-md flex justify-between items-center border border-gray-700">
                           <span className="text-gray-300">{member.email}</span>
                           {/* Future actions can go here, e.g., <button>View Details</button> */}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-400">아직 등록된 회원이 없습니다. 초대 링크를 통해 첫 회원을 등록해보세요!</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;