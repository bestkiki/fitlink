
import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db } from '../firebase';
import { UserProfile, ExerciseLog, BodyMeasurement } from '../App';
import { UserCircleIcon, CalendarIcon, ChatBubbleIcon, ChartBarIcon, IdCardIcon } from '../components/icons';
import EditMyProfileModal from '../components/EditMyProfileModal';
import ProgressChart from '../components/ProgressChart';
import BookingCalendar from './BookingCalendar';
import MessageHistory from './MessageHistory';

interface MemberDashboardProps {
  user: firebase.User;
  userProfile: UserProfile;
}

type MemberDashboardView = 'dashboard' | 'booking' | 'messages';

const MemberDashboard: React.FC<MemberDashboardProps> = ({ user, userProfile }) => {
  const [profile, setProfile] = useState(userProfile);
  const [trainerProfile, setTrainerProfile] = useState<UserProfile | null>(null);
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentView, setCurrentView] = useState<MemberDashboardView>('dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch trainer profile
      if (userProfile.trainerId) {
        const trainerDoc = await db.collection('users').doc(userProfile.trainerId).get();
        if (trainerDoc.exists) {
          setTrainerProfile(trainerDoc.data() as UserProfile);
        }
      }

      // Fetch body measurements
      const measurementsUnsub = db.collection('users').doc(user.uid).collection('bodyMeasurements')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BodyMeasurement));
          setBodyMeasurements(data);
        });

      // Fetch exercise logs
      const logsUnsub = db.collection('users').doc(user.uid).collection('exerciseLogs')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExerciseLog));
          setExerciseLogs(data);
        });

      setLoading(false);

      return () => {
        measurementsUnsub();
        logsUnsub();
      };
    };

    fetchData();
  }, [user.uid, userProfile.trainerId]);

  const handleSaveProfile = async (profileData: Partial<UserProfile>) => {
    try {
      await db.collection('users').doc(user.uid).update(profileData);
      setProfile(prevProfile => ({ ...prevProfile, ...profileData }));
      setIsProfileModalOpen(false);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      throw new Error('프로필 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleBackToDashboard = () => setCurrentView('dashboard');
  
  if (currentView === 'booking') {
    return <BookingCalendar user={user} userProfile={profile} onBack={handleBackToDashboard} />;
  }

  if (currentView === 'messages') {
      return <MessageHistory user={user} onBack={handleBackToDashboard} />;
  }

  const sortedMeasurements = [...bodyMeasurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <>
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          회원 대시보드
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          환영합니다, <span className="font-semibold text-secondary">{profile.name || user.email}</span> 님!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col">
                <div className="flex items-center mb-4">
                    <UserCircleIcon className="w-10 h-10 text-secondary mr-4"/>
                    <h2 className="text-xl font-bold text-white">내 정보</h2>
                </div>
                <p className="text-gray-400"><strong>이름:</strong> {profile.name || '미지정'}</p>
                <p className="text-gray-400"><strong>운동 목표:</strong> {profile.goal || '미지정'}</p>
                <button onClick={() => setIsProfileModalOpen(true)} className="mt-auto bg-secondary hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors w-full">
                    내 정보 수정
                </button>
            </div>

            <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                <div className="flex items-center mb-4">
                    <IdCardIcon className="w-10 h-10 text-secondary mr-4"/>
                    <h2 className="text-xl font-bold text-white">담당 트레이너</h2>
                </div>
                {trainerProfile ? (
                    <>
                        <p className="text-gray-400"><strong>이름:</strong> {trainerProfile.name}</p>
                        <p className="text-gray-400"><strong>전문 분야:</strong> {trainerProfile.specialization}</p>
                        <p className="text-gray-400"><strong>연락처:</strong> {trainerProfile.contact}</p>
                    </>
                ) : (
                    <p className="text-gray-400">담당 트레이너가 아직 배정되지 않았습니다.</p>
                )}
            </div>

            <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col space-y-4">
                 <button onClick={() => setCurrentView('booking')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                    <CalendarIcon className="w-6 h-6 text-secondary" />
                    <span>수업 예약하기</span>
                </button>
                 <button onClick={() => setCurrentView('messages')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                    <ChatBubbleIcon className="w-6 h-6 text-secondary" />
                    <span>메시지 내역 보기</span>
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                <div className="flex items-center mb-4">
                    <ChartBarIcon className="w-8 h-8 text-secondary mr-3" />
                    <h2 className="text-xl font-bold text-white">나의 성장 기록</h2>
                </div>
                <ProgressChart measurements={sortedMeasurements} />
            </div>

            <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4">최근 운동 일지</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {loading ? (
                        <p className="text-gray-400">운동 일지를 불러오는 중...</p>
                    ) : exerciseLogs.length > 0 ? (
                        exerciseLogs.map(log => (
                            <div key={log.id} className="bg-dark p-3 rounded-md">
                                <p className="font-semibold text-secondary">{log.date}</p>
                                <p className="font-bold text-white mt-1">{log.exerciseName}</p>
                                <div className="text-sm text-gray-400 mt-1">
                                    {log.sets.map((set, index) => (
                                        <span key={index} className="mr-3">{set.weight}kg x {set.reps}회</span>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400">기록된 운동 일지가 없습니다.</p>
                    )}
                </div>
            </div>
        </div>

      </div>
      <EditMyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        userProfile={profile}
      />
    </>
  );
};

export default MemberDashboard;
