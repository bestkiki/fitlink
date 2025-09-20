import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { db } from '../firebase';
import { UserProfile, Challenge, ChallengeParticipant } from '../App';
import { ArrowLeftIcon, CalendarIcon, PlusCircleIcon, TrophyIcon, UserCircleIcon, UsersIcon, TrashIcon } from '../components/icons';

// --- Sub-components defined in the same file for simplicity ---

interface ChallengeDetailProps {
    challenge: Challenge;
    user: firebase.User;
    onLeave: (challengeId: string) => Promise<void>;
    onLogProgress: (challengeId: string) => Promise<void>;
    onBackToList: () => void;
}

const ChallengeDetail: React.FC<ChallengeDetailProps> = ({ challenge, user, onLeave, onLogProgress, onBackToList }) => {
    const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = db.collection('challenges').doc(challenge.id).collection('participants')
            .orderBy('progress', 'desc')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChallengeParticipant));
                setParticipants(data);
                setLoading(false);
            });
        return () => unsubscribe();
    }, [challenge.id]);

    const formatDate = (ts: firebase.firestore.Timestamp) => ts.toDate().toLocaleDateString('ko-KR');

    return (
        <div>
            <button onClick={onBackToList} className="flex items-center space-x-2 text-secondary mb-6 hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>전체 챌린지 목록으로</span>
            </button>
             <div className="bg-dark-accent p-6 rounded-lg shadow-lg mb-8">
                <h1 className="text-3xl font-bold text-white">{challenge.title}</h1>
                <div className="text-sm text-gray-400 mt-2 flex items-center space-x-4">
                    <span className="flex items-center"><CalendarIcon className="w-4 h-4 mr-1.5"/>{formatDate(challenge.startDate)} ~ {formatDate(challenge.endDate)}</span>
                    <span className="flex items-center"><UsersIcon className="w-4 h-4 mr-1.5"/>{challenge.participantCount || 0}명 참여</span>
                </div>
                <p className="mt-4 text-gray-300 whitespace-pre-wrap">{challenge.description}</p>
            </div>
            
             <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-8">
                <button 
                    onClick={() => onLogProgress(challenge.id)} 
                    className="w-full flex items-center justify-center space-x-2 bg-secondary hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                    <PlusCircleIcon className="w-6 h-6"/>
                    <span>오늘 진행도 +1 기록</span>
                </button>
                 <button 
                    onClick={() => onLeave(challenge.id)} 
                    className="w-full flex items-center justify-center space-x-2 bg-dark hover:bg-red-600/20 text-red-400 font-bold py-3 px-4 rounded-lg transition-colors border border-red-500/50">
                     <TrashIcon className="w-5 h-5"/>
                     <span>챌린지 나가기</span>
                </button>
            </div>

            <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">리더보드</h2>
                {loading ? <p>로딩 중...</p> : (
                    <div className="space-y-3">
                        {participants.map((p, index) => (
                             <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg ${p.id === user.uid ? 'bg-secondary/10 border border-secondary' : 'bg-dark'}`}>
                                <div className="flex items-center space-x-4">
                                    <span className="font-bold text-lg text-white w-8 text-center">{index + 1}</span>
                                    {p.userProfileImageUrl ? (
                                        <img src={p.userProfileImageUrl} alt={p.userName} className="w-10 h-10 rounded-full object-cover"/>
                                    ) : (
                                        <UserCircleIcon className="w-10 h-10 text-gray-500"/>
                                    )}
                                    <span className={`font-medium ${p.id === user.uid ? 'text-secondary' : 'text-white'}`}>{p.userName}</span>
                                </div>
                                <span className="font-semibold text-secondary">{p.progress} 회</span>
                            </div>
                        ))}
                    </div>
                )}
                 {!loading && participants.length === 0 && <p className="text-gray-500 text-center py-4">아직 참여자가 없습니다.</p>}
            </div>
        </div>
    );
};

// --- Main Page Component ---

interface MemberChallengesPageProps {
    user: firebase.User;
    userProfile: UserProfile;
    onBack: () => void;
}

const MemberChallengesPage: React.FC<MemberChallengesPageProps> = ({ user, userProfile, onBack }) => {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

    // Get participation info directly from user profile for simplicity and performance
    const myParticipationIds = new Set(userProfile.joinedChallenges || []);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = db.collection('challenges').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
            setChallenges(data);
            setLoading(false);
        }, error => {
            console.error("Error fetching challenges:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);
    
    const handleJoinChallenge = async (challengeId: string) => {
        const challengeRef = db.collection('challenges').doc(challengeId);
        const participantRef = challengeRef.collection('participants').doc(user.uid);
        const userRef = db.collection('users').doc(user.uid);

        try {
            await db.runTransaction(async (transaction) => {
                const participantDoc = await transaction.get(participantRef);
                if (participantDoc.exists) {
                    throw new Error("이미 참여 중인 챌린지입니다.");
                }
                // Add to participants subcollection
                transaction.set(participantRef, {
                    userName: userProfile.name || user.email,
                    userProfileImageUrl: userProfile.profileImageUrl || null,
                    progress: 0,
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                // Increment participant count on challenge
                transaction.update(challengeRef, {
                    participantCount: firebase.firestore.FieldValue.increment(1)
                });
                // Add challenge ID to user's profile
                transaction.update(userRef, {
                    joinedChallenges: firebase.firestore.FieldValue.arrayUnion(challengeId)
                });
            });
            // No need for state update, userProfile snapshot will trigger re-render
        } catch (error) {
            console.error("Error joining challenge:", error);
            alert((error as Error).message || "챌린지 참여에 실패했습니다.");
        }
    };
    
    const handleLeaveChallenge = async (challengeId: string) => {
        if (!window.confirm("정말로 이 챌린지를 나가시겠습니까? 모든 진행 기록이 삭제됩니다.")) return;

        const challengeRef = db.collection('challenges').doc(challengeId);
        const participantRef = challengeRef.collection('participants').doc(user.uid);
        const userRef = db.collection('users').doc(user.uid);

        try {
            await db.runTransaction(async (transaction) => {
                transaction.delete(participantRef);
                transaction.update(challengeRef, {
                    participantCount: firebase.firestore.FieldValue.increment(-1)
                });
                 // Remove challenge ID from user's profile
                transaction.update(userRef, {
                    joinedChallenges: firebase.firestore.FieldValue.arrayRemove(challengeId)
                });
            });
            setSelectedChallenge(null); // Go back to list view
        } catch (error) {
            console.error("Error leaving challenge:", error);
            alert("챌린지 나가기에 실패했습니다.");
        }
    };
    
    const handleLogProgress = async (challengeId: string) => {
        const participantRef = db.collection('challenges').doc(challengeId).collection('participants').doc(user.uid);
        try {
            await participantRef.update({
                progress: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error("Error logging progress:", error);
            alert("진행도 기록에 실패했습니다.");
        }
    };
    
    const formatDate = (ts: firebase.firestore.Timestamp) => ts.toDate().toLocaleDateString('ko-KR');

    if (selectedChallenge) {
        return (
            <div className="container mx-auto px-6 py-12">
                <ChallengeDetail 
                    challenge={selectedChallenge}
                    user={user}
                    onLeave={handleLeaveChallenge}
                    onLogProgress={handleLogProgress}
                    onBackToList={() => setSelectedChallenge(null)}
                />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center space-x-2 text-secondary mb-6 hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>대시보드로 돌아가기</span>
            </button>
            <h1 className="text-3xl font-bold mb-2 flex items-center"><TrophyIcon className="w-8 h-8 mr-3 text-secondary"/>챌린지</h1>
            <p className="text-gray-400 mb-8">다른 회원들과 함께 목표를 달성하며 동기부여를 얻어보세요!</p>

            {loading && <p className="text-center text-gray-400">챌린지 목록을 불러오는 중...</p>}
            
            {!loading && challenges.length === 0 && (
                <div className="text-center text-gray-500 bg-dark-accent p-12 rounded-lg">
                    <TrophyIcon className="w-16 h-16 mx-auto text-gray-600"/>
                    <p className="mt-4">현재 참여 가능한 챌린지가 없습니다.</p>
                </div>
            )}
            
            {!loading && challenges.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {challenges.map(c => {
                        const isJoined = myParticipationIds.has(c.id);
                        return (
                            <div key={c.id} className="bg-dark-accent p-5 rounded-lg shadow-lg flex flex-col justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-2">{c.title}</h2>
                                    <div className="text-sm text-gray-400 space-y-2 mb-4">
                                        <p className="flex items-center"><CalendarIcon className="w-4 h-4 mr-2"/>기간: {formatDate(c.startDate)} ~ {formatDate(c.endDate)}</p>
                                        <p className="flex items-center"><UsersIcon className="w-4 h-4 mr-2"/>참여자: {c.participantCount || 0}명</p>
                                    </div>
                                    <p className="text-gray-300 text-sm line-clamp-3 h-16">{c.description}</p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-700/50">
                                    {isJoined ? (
                                        <button onClick={() => setSelectedChallenge(c)} className="w-full bg-dark hover:bg-dark/70 text-secondary font-bold py-2 px-4 rounded-lg transition-colors">
                                            진행 현황 보기
                                        </button>
                                    ) : (
                                        <button onClick={() => handleJoinChallenge(c.id)} className="w-full bg-secondary hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                            참여하기
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default MemberChallengesPage;