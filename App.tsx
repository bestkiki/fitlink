import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

import Header from './components/Header';
import Footer from './components/Footer';
import AuthenticatedApp from './AuthenticatedApp';
import UnauthenticatedApp, { Page } from './UnauthenticatedApp';
import LoadingSpinner from './components/LoadingSpinner';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TrainerPublicProfile from './pages/TrainerPublicProfile';

export interface UserProfile {
  role: 'trainer' | 'member' | null;
  email?: string;
  trainerId?: string;
  name?: string;
  contact?: string;
  goal?: string;
  notes?: string;
  specialization?: string; // e.g., "Weight loss, Bodybuilding"
  career?: string; // e.g., "10+ years of experience, Certified..."
}

export interface ExerciseSet {
  reps: number;
  weight: number;
}

export interface ExerciseLog {
  id: string;
  date: string; // ISO String for date
  exerciseName: string;
  sets: ExerciseSet[];
  createdAt: firebase.firestore.Timestamp;
}

export interface Feedback {
  id: string;
  text: string;
  trainerId: string;
  trainerName: string;
  createdAt: firebase.firestore.Timestamp;
}

export interface PersonalExerciseLog {
  id: string;
  date: string; // ISO String for date
  exerciseName: string;
  sets: ExerciseSet[];
  createdAt: firebase.firestore.Timestamp;
  feedback?: Feedback[];
}

export interface BodyMeasurement {
  id: string;
  date: string; // ISO String for date
  weight?: number;
  bodyFat?: number;
  createdAt: firebase.firestore.Timestamp;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface FoodItem {
  id: string;
  foodName: string;
  calories: number;
}

export interface DietLog {
  id: string; // YYYY-MM-DD
  date: string;
  meals: {
    breakfast: FoodItem[];
    lunch: FoodItem[];
    dinner: FoodItem[];
    snacks: FoodItem[];
  };
  totalCalories: number;
  updatedAt: firebase.firestore.Timestamp;
  feedback?: Feedback[];
}

export interface Availability {
  id: string;
  startTime: firebase.firestore.Timestamp;
  endTime: firebase.firestore.Timestamp;
}

export interface Appointment {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  startTime: firebase.firestore.Timestamp;
  endTime: firebase.firestore.Timestamp;
  status: 'confirmed' | 'cancelled_by_member' | 'cancelled_by_trainer';
  createdAt: firebase.firestore.Timestamp;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: firebase.firestore.Timestamp;
}

export interface ConsultationRequest {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: firebase.firestore.Timestamp;
}


function App() {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [trainerIdFromUrl, setTrainerIdFromUrl] = useState<string | null>(null);
  const [publicTrainerId, setPublicTrainerId] = useState<string | null>(null);
  const [legalPageView, setLegalPageView] = useState<'none' | 'terms' | 'privacy'>('none');

  useEffect(() => {
    // Handle routing based on path
    const path = window.location.pathname;
    const signupMatch = path.match(/^\/signup\/coach\/([a-zA-Z0-9]+)/);
    const profileMatch = path.match(/^\/coach\/([a-zA-Z0-9]+)/);

    if (profileMatch) {
      setPublicTrainerId(profileMatch[1]);
    } else if (signupMatch) {
      const trainerId = signupMatch[1];
      setTrainerIdFromUrl(trainerId);
      setCurrentPage('signup');
    }
    
    const unsubscribe = auth.onAuthStateChanged(async (userAuth) => {
      setLoading(true);
      if (userAuth) {
        // User is signed in.
        try {
          const userDoc = await db.collection('users').doc(userAuth.uid).get();
          if (userDoc.exists) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            setUserProfile({ role: null }); 
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile({ role: null });
        } finally {
          setUser(userAuth);
        }
      } else {
        // User is signed out.
        setUser(null);
        setUserProfile(null);
        if (!signupMatch && !profileMatch) { // Do not override signup/profile page if on specific link
            setCurrentPage('landing');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await auth.signOut();
    setLegalPageView('none');
    setPublicTrainerId(null);
    window.history.pushState({}, '', '/');
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setLegalPageView('none');
    setPublicTrainerId(null);
    const path = page === 'landing' ? '/' : `/${page}`;
    window.history.pushState({ page }, '', path);
  };
  
  const handleLegalNavigate = (page: 'terms' | 'privacy') => {
    setLegalPageView(page);
  };
  
  const handleNavigateToSignupFromProfile = (trainerId: string) => {
    setPublicTrainerId(null);
    setTrainerIdFromUrl(trainerId);
    setCurrentPage('signup');
    window.history.pushState({ page: 'signup' }, '', `/signup/coach/${trainerId}`);
  };

  const handleBackFromLegal = () => {
    setLegalPageView('none');
  };
  
  // Update page on browser back/forward
  useEffect(() => {
    const handlePopState = () => {
        const path = window.location.pathname;
        const signupMatch = path.match(/^\/signup\/coach\/([a-zA-Z0-9]+)/);
        const profileMatch = path.match(/^\/coach\/([a-zA-Z0-9]+)/);

        if(profileMatch) {
            setPublicTrainerId(profileMatch[1]);
            setCurrentPage('landing'); // Reset other pages
        } else if (signupMatch) {
            setTrainerIdFromUrl(signupMatch[1]);
            setCurrentPage('signup');
            setPublicTrainerId(null);
        } else {
            const page = path.substring(1);
            if (['landing', 'login', 'signup'].includes(page) || page === '') {
                setCurrentPage(page === '' ? 'landing' : page as Page);
            }
            setPublicTrainerId(null);
        }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);


  if (loading) {
    return <LoadingSpinner />;
  }

  const renderContent = () => {
    if (legalPageView === 'terms') return <TermsOfService onBack={handleBackFromLegal} />;
    if (legalPageView === 'privacy') return <PrivacyPolicy onBack={handleBackFromLegal} />;
    if (publicTrainerId) return <TrainerPublicProfile 
        trainerId={publicTrainerId} 
        onNavigateToSignup={handleNavigateToSignupFromProfile}
        currentUserProfile={userProfile}
        currentUser={user}
    />;

    return user && userProfile ? (
        <AuthenticatedApp user={user} userProfile={userProfile} />
    ) : (
        <UnauthenticatedApp 
            currentPage={currentPage} 
            onNavigate={handleNavigate} 
            trainerId={trainerIdFromUrl}
        />
    );
  }

  return (
    <div className="bg-dark text-gray-200 min-h-screen flex flex-col">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        onNavigate={!user ? handleNavigate : undefined}
      />
      <main className="flex-grow">
        {renderContent()}
      </main>
      <Footer onNavigate={handleLegalNavigate} />
    </div>
  );
}

export default App;