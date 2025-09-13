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
}

function App() {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (userAuth) => {
      if (userAuth) {
        // User is signed in.
        const userDoc = await db.collection('users').doc(userAuth.uid).get();
        if (userDoc.exists) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          // Handle case where user exists in Auth but not in Firestore
          setUserProfile({ role: null }); 
        }
        setUser(userAuth);
      } else {
        // User is signed out.
        setUser(null);
        setUserProfile(null);
        setCurrentPage('landing');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await auth.signOut();
    // onAuthStateChanged will handle setting user to null and loading to false
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

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
          <UnauthenticatedApp currentPage={currentPage} onNavigate={handleNavigate} />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
