import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db } from '../firebase';
import { UserProfile } from '../App';
import { ChartBarIcon, CalendarIcon, ChatBubbleIcon, UserCircleIcon, PencilIcon } from '../components/icons';
import LoadingSpinner from '../components/LoadingSpinner';
import EditMyProfileModal from '../components/EditMyProfileModal';

interface MemberDashboardProps {
  user: firebase.User;
  userProfile: UserProfile;
}

const InfoField: React.FC<{ label: string; value: string | undefined }> = ({ label, value }) => (
  <div>
    <h4 className="text-sm font-semibold text-gray-400">{label}</h4>
    <p className="text-white whitespace-pre-wrap">{value || '아직 등록된 내용이 없습니다.'}</p>
  </div>
);

const MemberDashboard: React.FC<MemberDashboardProps> = ({ user, userProfile }) => {
  const [currentProfile, setCurrentProfile] = useState(userProfile);
  const [trainer, setTrainer] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!currentProfile.trainerId) {
      setLoading(false);
      return;
    }

    const fetchTrainer = async () => {
      try {
        const trainerDoc = await db.collection('users').doc(currentProfile.trainerId).get();
        if (trainerDoc.exists) {
          setTrainer(trainerDoc.data() as UserProfile);
        }
      } catch (error) {
        console.error("Error fetching trainer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainer();
  }, [currentProfile.trainerId]);

  const handleSaveProfile = async (profileData: Partial<UserProfile>) => {
    try {
      await db.collection('users').doc(user.uid).update(profileData);
      setCurrentProfile(prevProfile => ({ ...prevProfile, ...profileData }));
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      throw new Error('프로필 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };


  if (loading) {
    return <div className="min-h-[calc(100vh-160px)] flex items-center justify-center"><LoadingSpinner/></div>;
  }

  const memberName = currentProfile.name || user.email;

  return (
    <>
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          회원 대시보드
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          환영합니다, <span className="font-semibold text-secondary">{memberName}</span> 님!
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: My Info & Trainer Info */}
          <div className="lg:col-span-1 space-y-8">
            {/* My Trainer Card */}
            <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-3 flex items-center">
                <UserCircleIcon className="w-6 h-6 mr-2 text-secondary"/>
                나의 트레이너
              </h2>
              {trainer ? (
                <div className="space-y-4">
                  <InfoField label="이름" value={trainer.name} />
                  <InfoField label="이메일" value={trainer.email} />
                  <InfoField label="전문 분야" value={trainer.specialization} />
                  <InfoField label="주요 경력" value={trainer.career} />
                </div>
              ) : (
                <p className="text-gray-400">담당 트레이너 정보가 없습니다.</p>
              )}
            </div>

            {/* My Profile Card */}
            <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
                <h2 className="text-xl font-bold text-white">내 정보</h2>
                <button onClick={() => setIsEditModalOpen(true)} className="p-2 text-gray-400 hover:text-white transition-colors" title="내 정보 수정">
                  <PencilIcon className="w-5 h-5"/>
                </button>
              </div>
              <div className="space-y-4">
                <InfoField label="이름" value={currentProfile.name} />
                <InfoField label="연락처" value={currentProfile.contact} />
                <InfoField label="운동 목표" value={currentProfile.goal} />
              </div>
            </div>
          </div>
          
          {/* Right Column: Feature Cards */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center opacity-50">
                <ChartBarIcon className="w-12 h-12 text-secondary mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">운동 기록</h2>
                <p className="text-gray-400 flex-grow">나의 운동 일지와 신체 변화를 기록하고 확인합니다.</p>
                <button className="mt-4 bg-gray-600 text-gray-300 font-bold py-2 px-4 rounded-lg cursor-not-allowed">
                  곧 제공될 예정입니다
                </button>
              </div>
              <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center opacity-50">
                <CalendarIcon className="w-12 h-12 text-secondary mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">수업 예약</h2>
                <p className="text-gray-400 flex-grow">PT 및 그룹 수업 스케줄을 확인하고 예약합니다.</p>
                <button className="mt-4 bg-gray-600 text-gray-300 font-bold py-2 px-4 rounded-lg cursor-not-allowed">
                  곧 제공될 예정입니다
                </button>
              </div>
               <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center md:col-span-2 opacity-50">
                <ChatBubbleIcon className="w-12 h-12 text-secondary mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">메시지</h2>
                <p className="text-gray-400 flex-grow">트레이너와 메시지를 주고 받으며 피드백을 받습니다.</p>
                <button className="mt-4 bg-gray-600 text-gray-300 font-bold py-2 px-4 rounded-lg cursor-not-allowed">
                  곧 제공될 예정입니다
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <EditMyProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
        userProfile={currentProfile}
      />
    </>
  );
};

export default MemberDashboard;