import React, { useState, useEffect } from 'react';
// FIX: Using compat imports for firebase v8 APIs
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth, db } from './firebase';
import AuthenticatedApp from './AuthenticatedApp';
import UnauthenticatedApp, { Page } from './UnauthenticatedApp';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TrainerPublicProfile from './pages/TrainerPublicProfile';

// --- TYPE DEFINITIONS ---
// These types are used across the application.

export interface UserProfile {
  role: 'trainer' | 'member';
  email: string;
  name?: string;
  contact?: string;
  profileImageUrl?: string;
  promoImageUrl?: string;
  // Member specific
  goal?: string;
  trainerId?: string;
  totalSessions?: number;
  usedSessions?: number;
  joinedChallenges?: string[]; // Array of challenge IDs
  // Trainer specific
  specialization?: string;
  career?: string;
  notes?: string; // Trainer's private notes about a member
  gymName?: string;
  gymAddress?: string;
  offersFreeTrial?: boolean;
}

export interface ExerciseSet {
  reps: number;
  weight: number;
}

export interface ExerciseLog {
  id: string;
  date: string;
  exerciseName: string;
  sets: ExerciseSet[];
  createdAt: firebase.firestore.Timestamp;
}

export interface PersonalExerciseLog extends Omit<ExerciseLog, 'createdAt'>{
    createdAt: firebase.firestore.Timestamp | firebase.firestore.FieldValue;
    feedback?: Feedback[];
}

export interface BodyMeasurement {
  id: string;
  date: string;
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
    id: string;
    date: string;
    meals: Record<MealType, FoodItem[]>;
    totalCalories: number;
    updatedAt: firebase.firestore.Timestamp;
    feedback?: Feedback[];
}

export interface Notification {
    id: string;
    userId: string;
    message: string;
    read: boolean;
    createdAt: firebase.firestore.Timestamp;
}

export interface Feedback {
    id: string;
    text: string;
    trainerId: string;
    trainerName: string;
    createdAt: firebase.firestore.Timestamp | firebase.firestore.FieldValue;
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

export interface ConsultationRequest {
    id: string;
    memberId: string;
    memberName: string;
    memberEmail: string;
    message: string;
    status: 'pending' | 'confirmed';
    createdAt: firebase.firestore.Timestamp;
    memberContact?: string;
    preferredTime?: string;
}

export interface Announcement {
  id: string;
  trainerId: string;
  title: string;
  content: string;
  createdAt: firebase.firestore.Timestamp;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorProfileImageUrl?: string;
  authorRole: 'trainer' | 'member';
  content: string;
  createdAt: firebase.firestore.Timestamp;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorProfileImageUrl?: string;
  authorRole: 'trainer' | 'member';
  content: string;
  createdAt: firebase.firestore.Timestamp;
  likes: string[]; // array of user uids
  commentCount: number;
  comments?: Comment[]; // Loaded on-demand
}

export interface Challenge {
  id: string;
  trainerId: string;
  title: string;
  description: string;
  startDate: firebase.firestore.Timestamp;
  endDate: firebase.firestore.Timestamp;
  createdAt: firebase.firestore.Timestamp;
  participantCount: number;
}

export interface ChallengeParticipant {
    id: string; // This will be the user's UID
    userName: string;
    userProfileImageUrl?: string;
    progress: number; // e.g., number of workouts completed
    joinedAt: firebase.firestore.Timestamp;
}


const App: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page | 'terms' | 'privacy'>('landing');
  const [trainerId, setTrainerId] = useState<string | null>(null);

  useEffect(() => {
    // Handle routing for public trainer profiles and signup links
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);

    if (parts[0] === 'coach' && parts[1]) {
      // It's a public trainer profile URL, we'll handle this in the render logic
    } else if (parts[0] === 'signup' && parts[1]) {
      setTrainerId(parts[1]);
      setCurrentPage('signup');
    }

    const unsubscribe = auth.onAuthStateChanged(async (userAuth) => {
      if (userAuth) {
        const userDoc = await db.collection('users').doc(userAuth.uid).get();
        if (userDoc.exists) {
          setUserProfile(userDoc.data() as UserProfile);
        }
        setUser(userAuth);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut();
    setCurrentPage('landing');
  };

  const handleNavigate = (page: Page) => {
    // Reset path when navigating within unauthenticated app
    if (page === 'landing' || page === 'login' || page === 'signup') {
        window.history.pushState({}, '', '/');
        setTrainerId(null);
    }
    setCurrentPage(page);
  };
  
  const handleNavigatePolicy = (page: 'terms' | 'privacy') => {
    window.history.pushState({}, '', `/${page}`);
    setCurrentPage(page);
  }
  
  const handleBackToLanding = () => {
    window.history.pushState({}, '', '/');
    setCurrentPage('landing');
  }
  
  const handleNavigateToSignupWithTrainer = (trainerIdValue: string) => {
      window.history.pushState({}, '', `/signup/${trainerIdValue}`);
      setTrainerId(trainerIdValue);
      setCurrentPage('signup');
  };


  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);

    if (parts[0] === 'coach' && parts[1]) {
        return <TrainerPublicProfile trainerId={parts[1]} onNavigateToSignup={handleNavigateToSignupWithTrainer} currentUserProfile={userProfile} currentUser={user} />;
    }
    
    if (currentPage === 'terms') {
        return <TermsOfService onBack={handleBackToLanding} />;
    }

    if (currentPage === 'privacy') {
        return <PrivacyPolicy onBack={handleBackToLanding} />;
    }

    if (user && userProfile) {
      return <AuthenticatedApp user={user} userProfile={userProfile} />;
    }
    
    // Check for signup with trainerId again in case user is logged out
    if(parts[0] === 'signup' && parts[1]){
      return <UnauthenticatedApp currentPage={'signup'} onNavigate={handleNavigate} trainerId={parts[1]}/>;
    }

    return <UnauthenticatedApp currentPage={currentPage} onNavigate={handleNavigate} trainerId={trainerId}/>;
  };

  return (
    <div className="bg-dark text-white min-h-screen">
      <Header user={user} onLogout={handleLogout} onNavigate={handleNavigate} />
      <main>
        {renderContent()}
      </main>
      <Footer onNavigate={handleNavigatePolicy} />
    </div>
  );
};

export default App;