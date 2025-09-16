import React, { useState, useEffect } from 'react';
import { db, auth, firebaseConfig } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { UserProfile } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';
import { UserCircleIcon, IdCardIcon, DumbbellIcon } from '../components/icons';

interface TrainerPublicProfileProps {
    trainerId: string;
    onNavigateToSignup: (trainerId: string) => void;
}

// --- Singleton pattern for the temporary Firebase app ---
let tempApp: firebase.app.App | null = null;
let tempAppPromise: Promise<firebase.app.App> | null = null;

const getTempApp = (): Promise<firebase.app.App> => {
    if (tempApp) {
        return Promise.resolve(tempApp);
    }
    if (tempAppPromise) {
        return tempAppPromise;
    }

    tempAppPromise = new Promise(async (resolve, reject) => {
        try {
            const tempAppName = `public-profile-viewer-${Math.random().toString(36).substring(2, 9)}`;
            const app = firebase.initializeApp(firebaseConfig, tempAppName);
            const tempAuth = app.auth();
            await tempAuth.signInAnonymously();
            tempApp = app;
            resolve(app);
        } catch (error) {
            console.error("Failed to initialize and sign in to temporary app:", error);
            tempAppPromise = null; // Reset promise on failure
            reject(error);
        }
    });

    return tempAppPromise;
};
// --- End of Singleton pattern ---


const TrainerPublicProfile: React.FC<TrainerPublicProfileProps> = ({ trainerId, onNavigateToSignup }) => {
    const [trainerProfile, setTrainerProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchTrainerProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                // First, try with the default instance (for logged-in users).
                const doc = await db.collection('users').doc(trainerId).get();
                if (doc.exists) {
                    const data = doc.data() as UserProfile;
                    if (data.role === 'trainer') {
                        if (isMounted) setTrainerProfile(data);
                    } else {
                        if (isMounted) setError('해당 사용자는 트레이너가 아닙니다.');
                    }
                } else {
                    if (isMounted) setError('트레이너 프로필을 찾을 수 없습니다.');
                }
            } catch (err: any) {
                // If permission is denied and user is not logged in, use the temporary app.
                if ((err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED') && !auth.currentUser) {
                    try {
                        const app = await getTempApp();
                        const tempDb = app.firestore();
                        const doc = await tempDb.collection('users').doc(trainerId).get();

                        if (doc.exists) {
                            const data = doc.data() as UserProfile;
                            if (data.role === 'trainer') {
                                if (isMounted) setTrainerProfile(data);
                            } else {
                                if (isMounted) setError('해당 사용자는 트레이너가 아닙니다.');
                            }
                        } else {
                            if (isMounted) setError('트레이너 프로필을 찾을 수 없습니다.');
                        }
                    } catch (tempErr) {
                        console.error("Error fetching trainer profile with temp auth:", tempErr);
                        if (isMounted) setError('프로필을 불러오는 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.');
                    }
                } else {
                    console.error("Error fetching trainer profile:", err);
                    if (isMounted) setError('프로필을 불러오는 중 오류가 발생했습니다.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchTrainerProfile();

        return () => {
            isMounted = false;
        };
    }, [trainerId]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="container mx-auto px-6 py-12 text-center">
                <h1 className="text-2xl font-bold text-red-400">{error}</h1>
                <p className="text-gray-400 mt-2">URL을 다시 확인해주세요.</p>
            </div>
        );
    }
    
    if (!trainerProfile) return null;

    return (
        <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-dark">
            <div className="max-w-2xl w-full space-y-8 bg-dark-accent p-8 sm:p-10 rounded-xl shadow-lg">
                <div className="text-center">
                    <UserCircleIcon className="w-24 h-24 mx-auto text-gray-500"/>
                    <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white">
                        {trainerProfile.name || '트레이너'}
                    </h2>
                    <p className="mt-2 text-primary font-semibold">{trainerProfile.email}</p>
                </div>
                
                <div className="space-y-6">
                    {trainerProfile.specialization && (
                        <div className="bg-dark p-4 rounded-lg">
                            <h3 className="font-bold text-primary flex items-center mb-2"><DumbbellIcon className="w-5 h-5 mr-2"/>전문 분야</h3>
                            <p className="text-gray-300 whitespace-pre-wrap">{trainerProfile.specialization}</p>
                        </div>
                    )}

                    {trainerProfile.career && (
                         <div className="bg-dark p-4 rounded-lg">
                            <h3 className="font-bold text-primary flex items-center mb-2"><IdCardIcon className="w-5 h-5 mr-2"/>주요 경력</h3>
                            <p className="text-gray-300 whitespace-pre-wrap">{trainerProfile.career}</p>
                        </div>
                    )}
                    
                    {trainerProfile.contact && (
                         <p className="text-center text-gray-400">
                            <strong>연락처:</strong> {trainerProfile.contact}
                         </p>
                    )}
                </div>

                <div>
                    <button
                        onClick={() => onNavigateToSignup(trainerId)}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark focus:ring-primary-dark transition-transform transform hover:scale-105"
                    >
                       {trainerProfile.name || '트레이너'}님과 함께 운동하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrainerPublicProfile;