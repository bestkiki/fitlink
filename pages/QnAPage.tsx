import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { db } from '../firebase';
import { UserProfile, Question } from '../App';
import { ArrowLeftIcon, PlusCircleIcon, QuestionMarkCircleIcon, ChatBubbleBottomCenterTextIcon, ClockIcon } from '../components/icons';
import AskQuestionModal from '../components/AskQuestionModal';
import QuestionDetailView from './QuestionDetailView';

interface QnAPageProps {
    user: firebase.User;
    userProfile: UserProfile;
    onBack: () => void;
}

const QnAPage: React.FC<QnAPageProps> = ({ user, userProfile, onBack }) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = db.collection('qna_posts')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
                setQuestions(data);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching questions:", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);
    
    const handleSaveQuestion = async (data: { title: string, content: string }) => {
        try {
            await db.collection('qna_posts').add({
                ...data,
                authorId: user.uid,
                authorName: userProfile.name || user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                answerCount: 0,
            });
            setIsModalOpen(false);
        } catch (error) {
             console.error("Error saving question:", error);
            throw new Error("질문 등록에 실패했습니다.");
        }
    };
    
    const timeSince = (date: firebase.firestore.Timestamp | null): string => {
        if (!date) return '방금 전';
        const seconds = Math.floor((new Date().getTime() - date.toDate().getTime()) / 1000);
        if (seconds < 5) return "방금 전";
        let interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "일 전";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "시간 전";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "분 전";
        return "방금 전";
    };

    if (selectedQuestion) {
        return <QuestionDetailView question={selectedQuestion} user={user} userProfile={userProfile} onBack={() => setSelectedQuestion(null)} />;
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
                        <h1 className="text-3xl font-bold mb-2 flex items-center"><QuestionMarkCircleIcon className="w-8 h-8 mr-3 text-primary"/>질의응답 (Q&A)</h1>
                        <p className="text-gray-400">운동에 대해 궁금한 점을 질문하고 전문가 트레이너의 답변을 받아보세요.</p>
                    </div>
                     <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors mt-4 sm:mt-0">
                        <PlusCircleIcon className="w-5 h-5" />
                        <span>질문하기</span>
                    </button>
                </div>
                
                <div className="bg-dark-accent rounded-lg shadow-lg">
                    <div className="space-y-2">
                         {loading && <p className="text-center text-gray-400 p-8">질문 목록을 불러오는 중...</p>}
                         {!loading && questions.length === 0 && (
                            <div className="text-center text-gray-500 p-12">
                                <QuestionMarkCircleIcon className="w-16 h-16 mx-auto text-gray-600"/>
                                <p className="mt-4">아직 등록된 질문이 없습니다.</p>
                                <p>가장 먼저 질문을 남겨보세요!</p>
                            </div>
                         )}
                         {!loading && questions.map(q => (
                            <div key={q.id} onClick={() => setSelectedQuestion(q)} className="p-4 sm:p-6 border-b border-gray-700/50 hover:bg-dark cursor-pointer transition-colors">
                                <h2 className="font-bold text-lg text-white">{q.title}</h2>
                                <p className="text-sm text-gray-300 mt-1 line-clamp-2">{q.content}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500 mt-3">
                                    <span>{q.authorName}</span>
                                    <span className="flex items-center"><ClockIcon className="w-3 h-3 mr-1" />{timeSince(q.createdAt)}</span>
                                    <span className="flex items-center"><ChatBubbleBottomCenterTextIcon className="w-3 h-3 mr-1" />답변 {q.answerCount}</span>
                                </div>
                            </div>
                         ))}
                    </div>
                </div>
            </div>
            <AskQuestionModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveQuestion}
            />
        </>
    );
};

export default QnAPage;