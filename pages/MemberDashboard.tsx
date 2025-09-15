import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db } from '../firebase';
import { UserProfile, BodyMeasurement, ExerciseLog } from '../App';
import { ChartBarIcon, CalendarIcon, ChatBubbleIcon, UserCircleIcon, PencilIcon, PlusCircleIcon } from '../components/icons';
import LoadingSpinner from '../components/LoadingSpinner';
import EditMyProfileModal from '../components/EditMyProfileModal';
import ProgressChart from '../components/ProgressChart';

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
  const [view, setView] = useState<'dashboard' | 'progress'>('dashboard');

  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  
  const [showAddMeasurement, setShowAddMeasurement] = useState(false);
  const [newWeight, setNewWeight] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
        if (!currentProfile.trainerId) {
            setLoading(false);
            return;
        }

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
    
    fetchInitialData();
  }, [currentProfile.trainerId]);

  useEffect(() => {
    if (view !== 'progress') return;

    const unsubMeasurements = db.collection('users').doc(user.uid).collection('bodyMeasurements')
      .orderBy('date', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BodyMeasurement));
        setBodyMeasurements(data);
      });

    const unsubLogs = db.collection('users').doc(user.uid).collection('exerciseLogs')
      .orderBy('date', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExerciseLog));
        setExerciseLogs(data);
      });
      
    return () => {
      unsubMeasurements();
      unsubLogs();
    };
  }, [view, user.uid]);

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
  
  const handleAddMeasurement = async (e: React.FormEvent) => {
      e.preventDefault();
      const weight = parseFloat(newWeight);
      if (!weight || weight <= 0) return;

      const newMeasurement = {
          date: new Date().toISOString().split('T')[0],
          weight: weight,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };
      
      try {
          await db.collection('users').doc(user.uid).collection('bodyMeasurements').add(newMeasurement);
          setNewWeight('');
          setShowAddMeasurement(false);
      } catch (error) {
          console.error("Error adding body measurement:", error);
          alert("저장에 실패했습니다.");
      }
  };

  if (loading) {
    return <div className="min-h-[calc(100vh-160px)] flex items-center justify-center"><LoadingSpinner/></div>;
  }
  
  if (view === 'progress') {
    return (
      <div className="container mx-auto px-6 py-12">
          <button onClick={() => setView('dashboard')} className="flex items-center space-x-2 text-primary mb-6 hover:underline">
              <ChartBarIcon className="w-5 h-5" />
              <span>대시보드로 돌아가기</span>
          </button>
          <h1 className="text-3xl font-bold mb-8">나의 성장 기록</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-dark-accent p-6 rounded-lg">
                  <h2 className="text-xl font-bold mb-4">체중 변화 그래프</h2>
                  <ProgressChart measurements={bodyMeasurements} />
              </div>
              <div className="lg:col-span-1 bg-dark-accent p-6 rounded-lg">
                  <h2 className="text-xl font-bold mb-4">신체 정보 기록</h2>
                  <button onClick={() => setShowAddMeasurement(!showAddMeasurement)} className="w-full flex items-center justify-center space-x-2 bg-secondary/80 hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg transition-colors mb-4">
                      <PlusCircleIcon className="w-5 h-5"/>
                      <span>오늘 체중 기록하기</span>
                  </button>

                  {showAddMeasurement && (
                      <form onSubmit={handleAddMeasurement} className="bg-dark p-4 rounded-md mb-4 flex items-center space-x-2">
                          <input 
                              type="number" 
                              step="0.1"
                              value={newWeight}
                              onChange={(e) => setNewWeight(e.target.value)}
                              placeholder="체중 (kg)"
                              className="w-full bg-dark-accent p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-secondary"
                          />
                          <button type="submit" className="bg-secondary text-white p-2 rounded-md font-semibold">저장</button>
                      </form>
                  )}
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {bodyMeasurements.map(m => (
                          <div key={m.id} className="bg-dark p-2 rounded-md text-sm flex justify-between">
                              <span>{m.date}</span>
                              <span className="font-semibold">{m.weight} kg</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          <div className="mt-8 bg-dark-accent p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">운동 일지</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {exerciseLogs.length > 0 ? exerciseLogs.map(log => (
                      <div key={log.id} className="bg-dark p-4 rounded-md">
                          <p className="font-bold text-lg text-secondary">{log.exerciseName} <span className="text-sm font-normal text-gray-400 ml-2">{log.date}</span></p>
                          <ul className="list-disc list-inside mt-2 text-gray-300">
                              {log.sets.map((s, i) => (
                                  <li key={i}>{s.weight} kg x {s.reps} 회</li>
                              ))}
                          </ul>
                      </div>
                  )) : <p className="text-gray-400">아직 기록된 운동이 없습니다.</p>}
              </div>
          </div>
      </div>
    );
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
          <div className="lg:col-span-1 space-y-8">
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
          
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center">
                <ChartBarIcon className="w-12 h-12 text-secondary mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">운동 기록</h2>
                <p className="text-gray-400 flex-grow">나의 운동 일지와 신체 변화를 기록하고 확인합니다.</p>
                <button onClick={() => setView('progress')} className="mt-4 bg-secondary hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  내 성장 기록 보기
                </button>
              </div>
              <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center opacity-50">
                <CalendarIcon className="w-12 h-12 text-secondary mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">수업 예약</h2>
                <p className="text-gray-400 flex-grow">PT 및 그룹 수업 스케줄을 확인하고 예약합니다.</p>
                <button disabled className="mt-4 bg-gray-600 text-gray-300 font-bold py-2 px-4 rounded-lg cursor-not-allowed">
                  곧 제공될 예정입니다
                </button>
              </div>
               <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center md:col-span-2 opacity-50">
                <ChatBubbleIcon className="w-12 h-12 text-secondary mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">메시지</h2>
                <p className="text-gray-400 flex-grow">트레이너와 메시지를 주고 받으며 피드백을 받습니다.</p>
                <button disabled className="mt-4 bg-gray-600 text-gray-300 font-bold py-2 px-4 rounded-lg cursor-not-allowed">
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