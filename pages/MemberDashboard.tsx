import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db } from '../firebase';
import { UserProfile, ExerciseLog, BodyMeasurement, PersonalExerciseLog, MealType, DietLog, FoodItem, Feedback, Announcement, Banner } from '../App';
import { UserCircleIcon, CalendarIcon, ChatBubbleIcon, ChartBarIcon, IdCardIcon, ClipboardListIcon, PlusCircleIcon, PencilIcon, TrashIcon, DocumentTextIcon, FireIcon, ChatBubbleLeftRightIcon, MagnifyingGlassIcon, UsersIcon, MegaphoneIcon, TrophyIcon, QuestionMarkCircleIcon } from '../components/icons';
import EditMyProfileModal from '../components/EditMyProfileModal';
import ProgressChart from '../components/ProgressChart';
import BookingCalendar from './BookingCalendar';
import MessageHistory from './MessageHistory';
import AddEditPersonalLogModal from '../components/AddEditPersonalLogModal';
import AddEditDietLogModal from '../components/AddDietLogModal';
import FindTrainersPage from './FindTrainersPage';
import CommunityPage from './CommunityPage';
import MemberChallengesPage from './MemberChallengesPage';
import QnAPage from './QnAPage';
import DietLogHistoryPage from './DietLogHistoryPage';

interface MemberDashboardProps {
  user: firebase.User;
  userProfile: UserProfile;
}

type MemberDashboardView = 'dashboard' | 'booking' | 'messages' | 'find_trainer' | 'community' | 'challenges' | 'qna' | 'diet_history';

// FIX: Encapsulated all logic within the component function to resolve scope-related errors.
const MemberDashboard: React.FC<MemberDashboardProps> = ({ user, userProfile }) => {
  const [profile, setProfile] = useState(userProfile);
  const [trainerProfile, setTrainerProfile] = useState<UserProfile | null>(null);
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [personalExerciseLogs, setPersonalExerciseLogs] = useState<PersonalExerciseLog[]>([]);
  const [dietLog, setDietLog] = useState<DietLog | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState({
    main: true,
    personalLogs: true,
    dietLog: true,
    announcements: true,
  });
  
  const [currentView, setCurrentView] = useState<MemberDashboardView>('dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [isPersonalLogModalOpen, setIsPersonalLogModalOpen] = useState(false);
  const [editingPersonalLog, setEditingPersonalLog] = useState<PersonalExerciseLog | null>(null);

  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [editingMealType, setEditingMealType] = useState<MealType | null>(null);
  const [editingFoodItem, setEditingFoodItem] = useState<FoodItem | null>(null);

  useEffect(() => {
      const unsubProfile = db.collection('users').doc(user.uid).onSnapshot(doc => {
          if(doc.exists) {
              setProfile(doc.data() as UserProfile);
          }
      });
      return () => unsubProfile();
  }, [user.uid]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(prev => ({ ...prev, main: true }));
      // Fetch trainer profile
      if (profile.trainerId) {
        const trainerDoc = await db.collection('users').doc(profile.trainerId).get();
        if (trainerDoc.exists) {
          setTrainerProfile(trainerDoc.data() as UserProfile);
        }
      } else {
        setTrainerProfile(null);
      }

      // Fetch body measurements
      const measurementsUnsub = db.collection('users').doc(user.uid).collection('bodyMeasurements')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BodyMeasurement));
          setBodyMeasurements(data);
        });

      // Fetch trainer-assigned exercise logs
      const logsUnsub = db.collection('users').doc(user.uid).collection('exerciseLogs')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExerciseLog));
          setExerciseLogs(data);
        });
        
      // Fetch Announcements
      if (profile.trainerId) {
          const announcementsUnsub = db.collection('users').doc(profile.trainerId).collection('announcements')
              .orderBy('createdAt', 'desc')
              .limit(5)
              .onSnapshot(snapshot => {
                  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
                  setAnnouncements(data);
                  setLoading(prev => ({ ...prev, announcements: false }));
              }, () => setLoading(prev => ({ ...prev, announcements: false })));
          
          setLoading(prev => ({...prev, main: false}));
          
          return () => {
            measurementsUnsub();
            logsUnsub();
            announcementsUnsub();
        };

      } else {
          setLoading(prev => ({ ...prev, announcements: false, main: false }));
          return () => {
            measurementsUnsub();
            logsUnsub();
          };
      }
    };

    fetchData();
  }, [user.uid, profile.trainerId]);
  
  useEffect(() => {
    const unsubscribeBanners = db.collection('banners')
        .where('isActive', '==', true)
        .onSnapshot(snapshot => {
            const allActiveBanners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
            
            const relevantBanners = allActiveBanners
                .filter(banner => ['all', 'member'].includes(banner.targetAudience))
                .sort((a, b) => {
                    const timeA = a.createdAt?.toMillis() || 0;
                    const timeB = b.createdAt?.toMillis() || 0;
                    return timeB - timeA;
                });

            setBanners(relevantBanners);
            setLoadingBanners(false);
        }, (error) => {
            console.error("Error fetching banners:", error);
            setLoadingBanners(false);
        });

    return () => unsubscribeBanners();
  }, []);

  useEffect(() => {
      if (banners.length > 1) {
          const timer = setTimeout(() => {
              setCurrentBanner(prev => (prev + 1) % banners.length);
          }, 5000);
          return () => clearTimeout(timer);
      }
  }, [currentBanner, banners.length]);

  useEffect(() => {
    const userRef = db.collection('users').doc(user.uid);

    // Fetch personal exercise logs with feedback
    const personalLogsUnsub = userRef.collection('personalExerciseLogs')
        .orderBy('createdAt', 'desc')
        .onSnapshot(async (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PersonalExerciseLog));
            const logsWithFeedback = await Promise.all(logsData.map(async log => {
                const feedbackSnap = await userRef.collection('personalExerciseLogs').doc(log.id).collection('feedback').orderBy('createdAt', 'asc').get();
                const feedback = feedbackSnap.docs.map(fbDoc => ({ id: fbDoc.id, ...fbDoc.data() } as Feedback));
                return { ...log, feedback };
            }));
            setPersonalExerciseLogs(logsWithFeedback);
            setLoading(prev => ({ ...prev, personalLogs: false }));
        });
    
    // Fetch today's diet log with feedback
    const todayStr = new Date().toISOString().split('T')[0];
    const dietLogUnsub = userRef.collection('dietLogs').doc(todayStr)
        .onSnapshot(async (doc) => {
            if(doc.exists) {
                const dietData = { id: doc.id, ...doc.data() } as DietLog;
                const feedbackSnap = await userRef.collection('dietLogs').doc(doc.id).collection('feedback').orderBy('createdAt', 'asc').get();
                const feedback = feedbackSnap.docs.map(fbDoc => ({ id: fbDoc.id, ...fbDoc.data() } as Feedback));
                setDietLog({ ...dietData, feedback });
            } else {
                setDietLog(null);
            }
            setLoading(prev => ({ ...prev, dietLog: false }));
        });

    return () => {
      personalLogsUnsub();
      dietLogUnsub();
    };
  }, [user.uid]);

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

  // --- Personal Exercise Log Handlers ---
  const handleOpenPersonalLogModal = (log: PersonalExerciseLog | null) => {
    setEditingPersonalLog(log);
    setIsPersonalLogModalOpen(true);
  };

  const handleSavePersonalLog = async (logData: Omit<PersonalExerciseLog, 'id' | 'createdAt'>) => {
    const collectionRef = db.collection('users').doc(user.uid).collection('personalExerciseLogs');
    try {
        if (editingPersonalLog) {
            await collectionRef.doc(editingPersonalLog.id).update(logData);
        } else {
            await collectionRef.add({
                ...logData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
        }
        setIsPersonalLogModalOpen(false);
        setEditingPersonalLog(null);
    } catch (error) {
        console.error("Error saving personal log:", error);
        alert("개인 운동 일지 저장에 실패했습니다.");
    }
  };
    
  const handleDeletePersonalLog = async (logId: string) => {
      if(window.confirm('정말로 이 기록을 삭제하시겠습니까?')) {
          await db.collection('users').doc(user.uid).collection('personalExerciseLogs').doc(logId).delete();
      }
  };
  
  // --- Diet Log Handlers ---
  const handleOpenAddDietModal = (mealType: MealType) => {
    setEditingMealType(mealType);
    setEditingFoodItem(null);
    setIsDietModalOpen(true);
  };

  const handleOpenEditDietModal = (mealType: MealType, foodItem: FoodItem) => {
    setEditingMealType(mealType);
    setEditingFoodItem(foodItem);
    setIsDietModalOpen(true);
  };

  const handleSaveFoodItem = async (foodData: { foodName: string; calories: number }, originalFoodItem: FoodItem | null) => {
    if (!editingMealType) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const docRef = db.collection('users').doc(user.uid).collection('dietLogs').doc(todayStr);

    try {
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);

            if (!doc.exists) {
                // If adding the very first item for the day
                const newFoodItem: FoodItem = { id: Date.now().toString(), ...foodData };
                const initialMeals = { breakfast: [], lunch: [], dinner: [], snacks: [] };
                initialMeals[editingMealType] = [newFoodItem];
                transaction.set(docRef, {
                    date: todayStr,
                    meals: initialMeals,
                    totalCalories: foodData.calories,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
            } else {
                const currentData = doc.data() as DietLog;
                const meals = currentData.meals;
                let calorieChange = 0;

                if (originalFoodItem) { // Editing
                    const mealItems = meals[editingMealType];
                    const itemIndex = mealItems.findIndex(item => item.id === originalFoodItem.id);
                    if (itemIndex > -1) {
                        calorieChange = foodData.calories - mealItems[itemIndex].calories;
                        mealItems[itemIndex] = { ...mealItems[itemIndex], ...foodData };
                    }
                } else { // Adding
                    const newFoodItem: FoodItem = { id: Date.now().toString(), ...foodData };
                    meals[editingMealType].push(newFoodItem);
                    calorieChange = foodData.calories;
                }
                
                transaction.update(docRef, {
                    meals,
                    totalCalories: firebase.firestore.FieldValue.increment(calorieChange),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }
        });
    } catch (error) {
        console.error("Error saving food item: ", error);
        alert("식단 저장에 실패했습니다.");
    } finally {
        setIsDietModalOpen(false);
        setEditingMealType(null);
        setEditingFoodItem(null);
    }
  };

  const handleDeleteFoodItem = async (mealType: MealType, foodItem: FoodItem) => {
      if(!dietLog) return;
      const todayStr = new Date().toISOString().split('T')[0];
      const docRef = db.collection('users').doc(user.uid).collection('dietLogs').doc(todayStr);

      try {
          await docRef.update({
              [`meals.${mealType}`]: firebase.firestore.FieldValue.arrayRemove(foodItem),
              totalCalories: firebase.firestore.FieldValue.increment(-foodItem.calories),
          });
      } catch (error) {
          console.error("Error deleting food item: ", error);
          alert("식단 삭제에 실패했습니다.");
      }
  };

  const handleBackToDashboard = () => setCurrentView('dashboard');
  
  if (currentView === 'diet_history') {
    return <DietLogHistoryPage user={user} userProfile={profile} onBack={handleBackToDashboard} />;
  }

  if (currentView === 'booking') {
    return <BookingCalendar user={user} userProfile={profile} onBack={handleBackToDashboard} />;
  }

  if (currentView === 'messages') {
      return <MessageHistory user={user} onBack={handleBackToDashboard} />;
  }
  
  if (currentView === 'find_trainer') {
      return <FindTrainersPage onBack={handleBackToDashboard} />;
  }

  if (currentView === 'community') {
      return <CommunityPage user={user} userProfile={profile} onBack={handleBackToDashboard} />;
  }

  if (currentView === 'challenges') {
      return <MemberChallengesPage user={user} userProfile={profile} onBack={handleBackToDashboard} />;
  }

  if (currentView === 'qna') {
    return <QnAPage user={user} userProfile={profile} onBack={handleBackToDashboard} />;
  }

  const sortedMeasurements = [...bodyMeasurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const mealTypes: { key: MealType, name: string }[] = [
      { key: 'breakfast', name: '아침' },
      { key: 'lunch', name: '점심' },
      { key: 'dinner', name: '저녁' },
      { key: 'snacks', name: '간식' },
  ];
  
  const totalSessions = profile.totalSessions || 0;
  const usedSessions = profile.usedSessions || 0;
  const remainingSessions = totalSessions - usedSessions;
  const progressPercentage = totalSessions > 0 ? (usedSessions / totalSessions) * 100 : 0;

  const nextBanner = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentBanner(prev => (prev + 1) % banners.length);
  };
  const prevBanner = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <>
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          회원 대시보드
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          환영합니다, <span className="font-semibold text-secondary">{profile.name || user.email}</span> 님!
        </p>
        
        {!loadingBanners && banners.length > 0 && banners[currentBanner] && (
            <div className="relative w-full max-w-5xl mx-auto mb-8 group">
                <a href={banners[currentBanner].linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full aspect-video lg:aspect-auto lg:h-64 bg-dark rounded-lg overflow-hidden shadow-lg">
                    <img 
                        src={banners[currentBanner].imageUrl} 
                        alt={banners[currentBanner].title} 
                        className="w-full h-full object-contain transition-transform duration-500 ease-in-out"
                        key={banners[currentBanner].id}
                    />
                </a>
                {banners.length > 1 && (
                <>
                    <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                        <button onClick={prevBanner} className="bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button onClick={nextBanner} className="bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                        {banners.map((_, index) => (
                            <button key={index} onClick={(e) => { e.stopPropagation(); setCurrentBanner(index); }} className={`w-2 h-2 rounded-full transition-colors ${currentBanner === index ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`}></button>
                        ))}
                    </div>
                </>
                )}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-8">
            <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col xl:col-span-1">
                <div className="flex items-center mb-4">
                    <UserCircleIcon className="w-10 h-10 text-secondary mr-4"/>
                    <h2 className="text-xl font-bold text-white">내 정보</h2>
                </div>
                <div className="flex-grow">
                    <p className="text-gray-400"><strong>이름:</strong> {profile.name || '미지정'}</p>
                    <p className="text-gray-400"><strong>운동 목표:</strong> {profile.goal || '미지정'}</p>
                </div>
                <button onClick={() => setIsProfileModalOpen(true)} className="mt-4 bg-secondary hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors w-full">
                    내 정보 수정
                </button>
            </div>

            <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col xl:col-span-1">
                <div className="flex items-center mb-4">
                    <IdCardIcon className="w-10 h-10 text-secondary mr-4"/>
                    <h2 className="text-xl font-bold text-white">담당 트레이너</h2>
                </div>
                {trainerProfile ? (
                    <div className="flex-grow">
                        <p className="text-gray-400"><strong>이름:</strong> {trainerProfile.name}</p>
                        <p className="text-gray-400"><strong>전문 분야:</strong> {trainerProfile.specialization}</p>
                        <p className="text-gray-400"><strong>연락처:</strong> {trainerProfile.contact}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center flex-grow text-center">
                        <p className="text-gray-400 mb-4">담당 트레이너가 없습니다.</p>
                        <button onClick={() => setCurrentView('find_trainer')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                            <MagnifyingGlassIcon className="w-6 h-6 text-secondary" />
                            <span>트레이너 찾기</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-dark-accent p-6 rounded-lg shadow-lg xl:col-span-2">
                 <h2 className="text-xl font-bold text-white flex items-center mb-4"><MegaphoneIcon className="w-6 h-6 mr-3 text-secondary"/>트레이너 공지사항</h2>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {loading.announcements ? (
                       <p className="text-gray-400">공지사항을 불러오는 중...</p>
                    ) : announcements.length > 0 ? (
                       announcements.map(ann => (
                           <div key={ann.id} className="bg-dark p-3 rounded-md">
                               <p className="font-bold text-white">{ann.title}</p>
                               <p className="text-xs text-gray-500 mb-1">{ann.createdAt ? ann.createdAt.toDate().toLocaleDateString('ko-KR') : '방금 전'}</p>
                               <p className="text-sm text-gray-300 whitespace-pre-wrap">{ann.content}</p>
                           </div>
                       ))
                    ) : (
                       <p className="text-gray-500 text-center py-4">등록된 공지사항이 없습니다.</p>
                    )}
                </div>
            </div>
        </div>

        {/* Navigation Buttons Section */}
        <div className="bg-dark-accent p-4 rounded-lg shadow-lg mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                 <button onClick={() => setCurrentView('booking')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                    <CalendarIcon className="w-6 h-6 text-secondary" />
                    <span>수업 예약</span>
                </button>
                 <button onClick={() => setCurrentView('messages')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                    <ChatBubbleIcon className="w-6 h-6 text-secondary" />
                    <span>메시지</span>
                </button>
                <button onClick={() => setCurrentView('community')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-secondary" />
                    <span>커뮤니티</span>
                </button>
                <button onClick={() => setCurrentView('challenges')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                    <TrophyIcon className="w-6 h-6 text-secondary" />
                    <span>챌린지</span>
                </button>
                <button onClick={() => setCurrentView('qna')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                    <QuestionMarkCircleIcon className="w-6 h-6 text-secondary" />
                    <span>Q&A</span>
                </button>
                 {trainerProfile ? (
                     <button onClick={() => setCurrentView('find_trainer')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                        <MagnifyingGlassIcon className="w-6 h-6 text-secondary" />
                        <span>다른 트레이너</span>
                    </button>
                 ) : (
                     <div className="hidden md:block"></div> // Placeholder for grid alignment
                 )}
            </div>
        </div>

        {/* New Session Status Card */}
        {totalSessions > 0 && (
            <div className="bg-dark-accent p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-xl font-bold text-white flex items-center mb-4"><UsersIcon className="w-6 h-6 mr-3 text-secondary"/>PT 세션 현황</h2>
                <div className="space-y-2">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-gray-400">진행률</span>
                        <span className="font-bold text-white">
                            <span className="text-3xl text-secondary">{remainingSessions}</span>
                            <span className="text-gray-400"> / {totalSessions}회 남음</span>
                        </span>
                    </div>
                    <div className="w-full bg-dark rounded-full h-2.5">
                        <div className="bg-secondary h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-dark-accent p-6 rounded-lg shadow-lg lg:col-span-2">
                <div className="flex items-center mb-4">
                    <ChartBarIcon className="w-8 h-8 text-secondary mr-3" />
                    <h2 className="text-xl font-bold text-white">나의 성장 기록</h2>
                </div>
                <ProgressChart measurements={sortedMeasurements} />
            </div>
            
            <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center"><FireIcon className="w-6 h-6 mr-2 text-secondary"/>오늘의 식단</h2>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-2xl font-bold text-secondary">{dietLog?.totalCalories || 0}</p>
                            <p className="text-sm text-gray-400">kcal</p>
                        </div>
                        <button 
                            onClick={() => setCurrentView('diet_history')} 
                            className="p-2 text-gray-400 hover:text-secondary transition-colors"
                            title="전체 기록 보기"
                        >
                            <ClipboardListIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>
                <div className="space-y-4 max-h-[22rem] overflow-y-auto pr-2">
                    {loading.dietLog ? (
                        <p className="text-gray-400">식단 기록을 불러오는 중...</p>
                    ) : (
                        <>
                            {mealTypes.map(meal => (
                                <div key={meal.key}>
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-semibold text-gray-300">{meal.name}</h3>
                                        <button onClick={() => handleOpenAddDietModal(meal.key)} className="p-1 text-secondary hover:text-orange-400">
                                            <PlusCircleIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        {dietLog?.meals[meal.key] && dietLog.meals[meal.key].length > 0 ? (
                                            dietLog.meals[meal.key].map(food => (
                                                <div key={food.id} className="flex justify-between items-center bg-dark p-2 rounded">
                                                    <span className="text-gray-300">{food.foodName}</span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-gray-400">{food.calories} kcal</span>
                                                        <button onClick={() => handleOpenEditDietModal(meal.key, food)} className="p-0.5"><PencilIcon className="w-4 h-4 text-gray-500 hover:text-primary"/></button>
                                                        <button onClick={() => handleDeleteFoodItem(meal.key, food)} className="p-0.5"><TrashIcon className="w-4 h-4 text-gray-500 hover:text-red-400"/></button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-500 px-2">기록된 {meal.name} 식단이 없습니다.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {dietLog?.feedback && dietLog.feedback.length > 0 && (
                                <div className="pt-2 border-t border-gray-700">
                                    <h3 className="font-semibold text-gray-300 mb-1 flex items-center text-sm"><ChatBubbleLeftRightIcon className="w-4 h-4 mr-2 text-secondary"/>트레이너 피드백</h3>
                                    {dietLog.feedback.map(fb => (
                                        <div key={fb.id} className="text-xs bg-dark p-2 rounded">
                                            <p className="text-gray-300">{fb.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="mt-8 space-y-8 lg:col-span-3 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
                <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center"><DocumentTextIcon className="w-6 h-6 mr-3 text-secondary"/>트레이너 할당 운동</h2>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {loading.main ? (
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
                            <p className="text-gray-400">트레이너가 할당한 운동 일지가 없습니다.</p>
                        )}
                    </div>
                </div>

                <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center"><ClipboardListIcon className="w-6 h-6 mr-3 text-secondary"/>개인 운동 일지</h2>
                        <button onClick={() => handleOpenPersonalLogModal(null)} className="flex items-center space-x-2 bg-secondary/80 hover:bg-secondary text-white font-bold py-1 px-3 rounded-lg transition-colors text-sm">
                            <PlusCircleIcon className="w-5 h-5"/>
                            <span>기록 추가</span>
                        </button>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                         {loading.personalLogs ? (
                            <p className="text-gray-400">개인 운동 일지를 불러오는 중...</p>
                        ) : personalExerciseLogs.length > 0 ? (
                            personalExerciseLogs.map(log => (
                                <div key={log.id} className="bg-dark p-3 rounded-md">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-secondary">{log.date}</p>
                                            <p className="font-bold text-white mt-1">{log.exerciseName}</p>
                                        </div>
                                        <div className="flex space-x-1 flex-shrink-0">
                                            <button onClick={() => handleOpenPersonalLogModal(log)} className="p-1 hover:bg-primary/20 rounded-full"><PencilIcon className="w-4 h-4 text-primary"/></button>
                                            <button onClick={() => handleDeletePersonalLog(log.id)} className="p-1 hover:bg-red-500/20 rounded-full"><TrashIcon className="w-4 h-4 text-red-400"/></button>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-400 mt-1">
                                        {log.sets.map((set, index) => (
                                            <span key={index} className="mr-3">{set.weight}kg x {set.reps}회</span>
                                        ))}
                                    </div>
                                    {log.feedback && log.feedback.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-700/50">
                                            {log.feedback.map(fb => (
                                                <div key={fb.id} className="text-xs flex items-start mt-1">
                                                    <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2 mt-0.5 text-secondary flex-shrink-0"/>
                                                    <p className="text-gray-300"><span className="font-semibold text-secondary">{fb.trainerName}:</span> {fb.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400">스스로 기록한 운동 일지가 없습니다. '기록 추가' 버튼으로 첫 운동을 기록해보세요!</p>
                        )}
                    </div>
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
      <AddEditPersonalLogModal
        isOpen={isPersonalLogModalOpen}
        onClose={() => {setIsPersonalLogModalOpen(false); setEditingPersonalLog(null);}}
        onSave={handleSavePersonalLog}
        log={editingPersonalLog}
      />
      <AddEditDietLogModal
        isOpen={isDietModalOpen}
        onClose={() => {
            setIsDietModalOpen(false);
            setEditingMealType(null);
            setEditingFoodItem(null);
        }}
        onSave={handleSaveFoodItem}
        mealType={editingMealType}
        foodItemToEdit={editingFoodItem}
      />
    </>
  );
};

export default MemberDashboard;