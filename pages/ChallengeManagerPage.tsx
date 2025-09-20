import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { db } from '../firebase';
import { Challenge } from '../App';
import { ArrowLeftIcon, CalendarIcon, PencilIcon, PlusCircleIcon, TrashIcon, TrophyIcon, UsersIcon } from '../components/icons';
import AddEditChallengeModal from '../components/AddEditChallengeModal';
import ChallengeDetailView from './ChallengeDetailView';

interface ChallengeManagerPageProps {
    user: firebase.User;
    onBack: () => void;
}

const ChallengeManagerPage: React.FC<ChallengeManagerPageProps> = ({ user, onBack }) => {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = db.collection('challenges')
            .where('trainerId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge));
                setChallenges(data);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching challenges:", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [user.uid]);

    const handleOpenModal = (challenge: Challenge | null) => {
        setEditingChallenge(challenge);
        setIsModalOpen(true);
    };

    const handleSaveChallenge = async (data: Omit<Challenge, 'id' | 'createdAt' | 'participantCount'>) => {
        try {
            if (editingChallenge) {
                await db.collection('challenges').doc(editingChallenge.id).update(data);
            } else {
                await db.collection('challenges').add({
                    ...data,
                    participantCount: 0,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }
            setIsModalOpen(false);
            setEditingChallenge(null);
        } catch (error) {
            console.error("Error saving challenge:", error);
            throw new Error("챌린지 저장에 실패했습니다.");
        }
    };
    
    const handleDeleteChallenge = async (challengeId: string) => {
        if (window.confirm("정말로 이 챌린지를 삭제하시겠습니까? 참여자 정보도 함께 삭제됩니다.")) {
            try {
                await db.collection('challenges').doc(challengeId).delete();
            } catch (error) {
                console.error("Error deleting challenge:", error);
                alert("챌린지 삭제에 실패했습니다.");
            }
        }
    };
    
    const formatDate = (timestamp: firebase.firestore.Timestamp) => {
        return timestamp.toDate().toLocaleDateString('ko-KR');
    };

    if (selectedChallenge) {
        return <ChallengeDetailView challenge={selectedChallenge} onBack={() => setSelectedChallenge(null)} />;
    }

    return (
        <>
            <div className="container mx-auto px-6 py-12">
                <button onClick={onBack} className="flex items-center space-x-2 text-primary mb-6 hover:underline">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>대시보드로 돌아가기</span>
                </button>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center"><TrophyIcon className="w-8 h-8 mr-3 text-primary"/>챌린지 관리</h1>
                        <p className="text-gray-400">회원들의 동기부여를 위한 챌린지를 만들고 관리하세요.</p>
                    </div>
                    <button onClick={() => handleOpenModal(null)} className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors mt-4 sm:mt-0">
                        <PlusCircleIcon className="w-5 h-5" />
                        <span>새 챌린지 만들기</span>
                    </button>
                </div>

                {loading && <p className="text-center text-gray-400">챌린지 목록을 불러오는 중...</p>}
                
                {!loading && challenges.length === 0 && (
                     <div className="text-center text-gray-500 bg-dark-accent p-12 rounded-lg">
                        <TrophyIcon className="w-16 h-16 mx-auto text-gray-600"/>
                        <p className="mt-4">아직 생성된 챌린지가 없습니다.</p>
                        <p>첫 번째 챌린지를 만들어 회원들의 참여를 유도해보세요!</p>
                    </div>
                )}
                
                {!loading && challenges.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {challenges.map(challenge => (
                            <div key={challenge.id} className="bg-dark-accent p-5 rounded-lg shadow-lg flex flex-col justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-2">{challenge.title}</h2>
                                    <div className="text-sm text-gray-400 space-y-2 mb-4">
                                        <p className="flex items-center"><CalendarIcon className="w-4 h-4 mr-2"/>기간: {formatDate(challenge.startDate)} ~ {formatDate(challenge.endDate)}</p>
                                        <p className="flex items-center"><UsersIcon className="w-4 h-4 mr-2"/>참여자: {challenge.participantCount || 0}명</p>
                                    </div>
                                    <p className="text-gray-300 text-sm line-clamp-3">{challenge.description}</p>
                                </div>
                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700/50">
                                    <button onClick={() => setSelectedChallenge(challenge)} className="text-primary font-semibold text-sm hover:underline">
                                        상세보기 및 랭킹
                                    </button>
                                    <div className="flex space-x-2">
                                        <button onClick={() => handleOpenModal(challenge)} className="p-2 hover:bg-primary/10 rounded-full"><PencilIcon className="w-5 h-5 text-gray-400 hover:text-primary"/></button>
                                        <button onClick={() => handleDeleteChallenge(challenge.id)} className="p-2 hover:bg-red-500/10 rounded-full"><TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-400"/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <AddEditChallengeModal 
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingChallenge(null); }}
                onSave={handleSaveChallenge}
                challenge={editingChallenge}
                trainerId={user.uid}
            />
        </>
    );
};

export default ChallengeManagerPage;