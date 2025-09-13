import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import UnauthenticatedApp from './UnauthenticatedApp';
import AuthenticatedApp from './AuthenticatedApp';

export interface UserProfile {
  email: string;
  role: 'trainer' | 'member';
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user role from Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          console.error("User profile not found in Firestore!");
          setUserProfile(null); // Or handle this case appropriately
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).catch(error => console.error('Logout Error:', error));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-dark min-h-screen text-light font-sans flex flex-col">
      <Header user={user} onLogout={handleLogout} />
      <main className="flex-grow">
        {user && userProfile ? (
          <AuthenticatedApp user={user} userProfile={userProfile} />
        ) : (
          <UnauthenticatedApp />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
