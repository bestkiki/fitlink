import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { db } from '../firebase';
import { Challenge, ChallengeParticipant } from '../App';
import { ArrowLeftIcon, CalendarIcon, UserCircleIcon, UsersIcon } from '../components/icons';

interface ChallengeDetailViewProps {
    challenge: Challenge;
    onBack: () => void;
}

const ChallengeDetailView: React.FC<ChallengeDetailViewProps> = ({ challenge, onBack }) => {
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
            }, error => {
                console.error("Error fetching participants:", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [challenge.id]);
    
     const formatDate = (timestamp: firebase.firestore.Timestamp) => {
        return timestamp.toDate().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center space-x-2 text-primary mb-6 hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>챌린지 목록으로 돌아가기</span>
            </button>

            <div className="bg-dark-accent p-6 rounded-lg shadow-lg mb-8">
                <h1 className="text-3xl font-bold text-white">{challenge.title}</h1>
                <div className="text-sm text-gray-400 mt-2 flex items-center space-x-4">
                    <span className="flex items-center"><CalendarIcon className="w-4 h-4 mr-1.5"/>{formatDate(challenge.startDate)} ~ {formatDate(challenge.endDate)}</span>
                    <span className="flex items-center"><UsersIcon className="w-4 h-4 mr-1.5"/>{challenge.participantCount || 0}명 참여</span>
                </div>
                <p className="mt-4 text-gray-300 whitespace-pre-wrap">{challenge.description}</p>
            </div>

            <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">리더보드</h2>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="p-3 text-sm font-semibold text-gray-400 w-16 text-center">순위</th>
                                <th className="p-3 text-sm font-semibold text-gray-400">참여자</th>
                                <th className="p-3 text-sm font-semibold text-gray-400 text-right">진행도</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan={3} className="text-center p-4">참여자 순위를 불러오는 중...</td></tr>}
                            {!loading && participants.length === 0 && <tr><td colSpan={3} className="text-center p-8 text-gray-500">아직 참여자가 없습니다.</td></tr>}
                            {!loading && participants.map((p, index) => (
                                <tr key={p.id} className="border-b border-gray-800 hover:bg-dark">
                                    <td className="p-3 font-bold text-lg text-white text-center">{index + 1}</td>
                                    <td className="p-3">
                                        <div className="flex items-center space-x-3">
                                            {p.userProfileImageUrl ? (
                                                <img src={p.userProfileImageUrl} alt={p.userName} className="w-10 h-10 rounded-full object-cover"/>
                                            ) : (
                                                <UserCircleIcon className="w-10 h-10 text-gray-500"/>
                                            )}
                                            <span className="font-medium text-white">{p.userName}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-right font-semibold text-primary">{p.progress} 회</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>

        </div>
    );
};

export default ChallengeDetailView;