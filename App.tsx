
import React, { useState, useEffect } from 'react';
// FIX: Switched to Firebase v8 compatible imports and types.
import firebase from 'firebase/app';
// FIX: Import for side effects and type augmentation for firebase.auth.User
import 'firebase/auth';
import { auth, db } from './firebase';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import UnauthenticatedApp, { Page } from './UnauthenticatedApp';
import AuthenticatedApp from './AuthenticatedApp';

export interface UserProfile {
  email: string;
  role: 'trainer' | 'member';
}

const App: React.FC = () => {
  // FIX: Used firebase.auth.User type from v8 SDK.
  const [user, setUser] = useState<firebase.auth.User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  useEffect(() => {
    // FIX: Used v8's onAuthStateChanged method on the auth instance.
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user role from Firestore
        // FIX: Switched to v8 syntax for Firestore document fetching.
        const userDocRef = db.collection('users').doc(currentUser.uid);
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          console.error("User profile not found in Firestore!");
          setUserProfile(null); // Or handle this case appropriately
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setCurrentPage('landing'); // Reset to landing page on logout
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNavigate = (page: Page) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };

  const handleLogout = () => {
    // FIX: Used v8's signOut method on the auth instance.
    auth.signOut().catch(error => console.error('Logout Error:', error));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-dark min-h-screen text-light font-sans flex flex-col">
      <Header user={user} onLogout={handleLogout} onNavigate={handleNavigate} />
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
};

export default App;
