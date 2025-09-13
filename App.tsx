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

export interface UserProfile {
  role: 'trainer' | 'member' | null;
  email?: string;
  trainerId?: string;
}

function App() {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [trainerIdFromUrl, setTrainerIdFromUrl] = useState<string | null>(null);

  useEffect(() => {
    // Handle routing based on path
    const path = window.location.pathname;
    const signupMatch = path.match(/^\/signup\/coach\/([a-zA-Z0-9]+)/);

    if (signupMatch) {
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
        if (!signupMatch) { // Do not override signup page if on invite link
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
    window.history.pushState({}, '', '/');
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    const path = page === 'landing' ? '/' : `/${page}`;
    window.history.pushState({ page }, '', path);
  };
  
  // Update page on browser back/forward
  useEffect(() => {
    const handlePopState = () => {
        const path = window.location.pathname.substring(1);
        if (['landing', 'login', 'signup'].includes(path) || path === '') {
            setCurrentPage(path === '' ? 'landing' : path as Page);
        }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);


  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-dark text-gray-200 min-h-screen flex flex-col">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        onNavigate={!user ? handleNavigate : undefined}
      />
      <main className="flex-grow">
        {user && userProfile ? (
          <AuthenticatedApp user={user} userProfile={userProfile} />
        ) : (
          <UnauthenticatedApp 
            currentPage={currentPage} 
            onNavigate={handleNavigate} 
            trainerId={trainerIdFromUrl}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;