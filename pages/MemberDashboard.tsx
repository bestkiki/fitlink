import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db } from '../firebase';
import { UserProfile, BodyMeasurement, ExerciseLog } from '../App';
import { UserCircleIcon, IdCardIcon, CalendarIcon, ChartBarIcon, DocumentTextIcon } from '../components/icons';
import EditMyProfileModal from '../components/EditMyProfileModal';
import ProgressChart from '../components/ProgressChart';
import BookingCalendar from './BookingCalendar';

interface MemberDashboardProps {
  user: firebase.User;
  userProfile: UserProfile;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ user, userProfile }) => {
  const [profile, setProfile] = useState(userProfile);
  const [trainerProfile, setTrainerProfile] = useState<UserProfile | null>(null);
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'booking'>('dashboard');

  useEffect(() => {
    const fetchTrainer = async () => {
      if (profile.trainerId) {
        try {
          const trainerDoc = await db.collection('users').doc(profile.trainerId).get();
          if (trainerDoc.exists) {
            setTrainerProfile(trainerDoc.data() as UserProfile);
          }
        } catch (err) {
            console.error("Error fetching trainer profile:", err);
            setError('트레이너 정보를 불러오는 데 실패했습니다.');
        }
      }
    };

    setLoading(true);
    fetchTrainer();
    
    const measurementsUnsub = db.collection('users').doc(user.uid).collection('bodyMeasurements').orderBy('date', 'desc')
      .onSnapshot(snapshot => {
        setBodyMeasurements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BodyMeasurement)));
        setLoading(false); // Set loading to false after first data fetch
      }, err => {
        console.error("Error fetching measurements:", err);
        setError('신체 정보를 불러오는 데 실패했습니다.');
        setLoading(false);
      });
    
    const logsUnsub = db.collection('users').doc(user.uid).collection('exerciseLogs').orderBy('createdAt', 'desc').limit(5)
      .onSnapshot(snapshot => {
        setExerciseLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExerciseLog)));
      }, err => {
        console.error("Error fetching exercise logs:", err);
        // Do not set main error for this, maybe just log it.
      });

    return () => {
      measurementsUnsub();
      logsUnsub();
    }
  }, [user.uid, profile.trainerId]);


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

  if (currentView === 'booking') {
    return <BookingCalendar user={user} userProfile={profile} onBack={() => setCurrentView('dashboard')} />;
  }

  return (
    <>
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          회원 대시보드
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          환영합니다, <span className="font-semibold text-secondary">{profile.name || user.email}</span> 님!
        </p>

        {loading && <p>데이터를 불러오는 중...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center">
                  <CalendarIcon className="w-12 h-12 text-secondary mb-4" />
                  <h2 className="text-xl font-bold text-white mb-2">수업 예약</h2>
                  <p className="text-gray-400">트레이너와 수업 일정을 조율합니다.</p>
                  <button onClick={() => setCurrentView('booking')} className="mt-4 bg-secondary hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                      예약 캘린더 보기
                  </button>
                </div>
                <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center">
                  <IdCardIcon className="w-12 h-12 text-secondary mb-4" />
                  <h2 className="text-xl font-bold text-white mb-2">내 정보 관리</h2>
                  <p className="text-gray-400">내 프로필과 운동 목표를 관리합니다.</p>
                  <button onClick={() => setIsProfileModalOpen(true)} className="mt-4 bg-secondary hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                      내 정보 수정
                  </button>
                </div>
              </div>
              
              <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center"><ChartBarIcon className="w-6 h-6 mr-2 text-secondary"/>나의 성장 기록</h2>
                <ProgressChart measurements={bodyMeasurements} />
              </div>
              
              <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center"><DocumentTextIcon className="w-6 h-6 mr-2 text-secondary"/>최근 운동 일지</h2>
                {exerciseLogs.length > 0 ? (
                  <div className="space-y-4">
                    {exerciseLogs.map(log => (
                      <div key={log.id} className="bg-dark p-3 rounded-md">
                         <p className="font-semibold text-gray-300">{log.date} - <span className="text-secondary">{log.exerciseName}</span></p>
                         <ul className="list-disc list-inside mt-1 text-sm text-gray-300">
                           {log.sets.map((s, i) => (
                               <li key={i}>{s.weight} kg x {s.reps} 회</li>
                           ))}
                         </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">아직 기록된 운동 일지가 없습니다.</p>
                )}
              </div>
            </div>

            {/* Side content */}
            <div className="lg:col-span-1 space-y-8">
              {trainerProfile ? (
                <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center"><UserCircleIcon className="w-6 h-6 mr-2 text-secondary"/>담당 트레이너</h2>
                  <div className="text-center">
                      <p className="text-lg font-bold text-white">{trainerProfile.name || trainerProfile.email}</p>
                      {trainerProfile.name && <p className="text-sm text-gray-400">{trainerProfile.email}</p>}
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-gray-300">
                      {trainerProfile.specialization && <p><strong className="text-gray-400 font-semibold">전문 분야:</strong> {trainerProfile.specialization}</p>}
                      {trainerProfile.career && <p><strong className="text-gray-400 font-semibold">경력:</strong> {trainerProfile.career}</p>}
                      {trainerProfile.contact && <p><strong className="text-gray-400 font-semibold">연락처:</strong> {trainerProfile.contact}</p>}
                  </div>
                </div>
              ) : (
                <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                  <h2 className="text-xl font-bold text-white mb-2">담당 트레이너</h2>
                  <p className="text-gray-400">아직 담당 트레이너가 배정되지 않았습니다.</p>
                </div>
              )}
            </div>
          </div>
        )}
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
