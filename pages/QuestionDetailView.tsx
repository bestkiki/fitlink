import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { db } from '../firebase';
import { UserProfile, Question, Answer } from '../App';
import { ArrowLeftIcon, UserCircleIcon, TrashIcon } from '../components/icons';

interface QuestionDetailViewProps {
    question: Question;
    user: firebase.User;
    userProfile: UserProfile;
    onBack: () => void;
}

const QuestionDetailView: React.FC<QuestionDetailViewProps> = ({ question, user, userProfile, onBack }) => {
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [newAnswer, setNewAnswer] = useState('');
    const [isAnswering, setIsAnswering] = useState(false);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = db.collection('qna_posts').doc(question.id).collection('answers')
            .orderBy('createdAt', 'asc')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Answer));
                setAnswers(data);
                setLoading(false);
            }, error => {
                console.error("Error fetching answers:", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [question.id]);

    const handleAnswerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAnswer.trim() || isAnswering) return;

        setIsAnswering(true);
        const qnaRef = db.collection('qna_posts').doc(question.id);
        const answerRef = qnaRef.collection('answers').doc();

        try {
            await db.runTransaction(async (transaction) => {
                transaction.set(answerRef, {
                    content: newAnswer.trim(),
                    authorId: user.uid,
                    authorName: userProfile.name || user.email,
                    authorProfileImageUrl: userProfile.profileImageUrl || null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
                transaction.update(qnaRef, { answerCount: firebase.firestore.FieldValue.increment(1) });
            });
            setNewAnswer('');
        } catch (error) {
            console.error("Error submitting answer:", error);
            alert("답변 등록에 실패했습니다.");
        } finally {
            setIsAnswering(false);
        }
    };
    
    const handleDeleteAnswer = async (answerId: string) => {
        if(window.confirm("정말로 이 답변을 삭제하시겠습니까?")) {
            const qnaRef = db.collection('qna_posts').doc(question.id);
            const answerRef = qnaRef.collection('answers').doc(answerId);
            try {
                await db.runTransaction(async (transaction) => {
                    transaction.delete(answerRef);
                    transaction.update(qnaRef, { answerCount: firebase.firestore.FieldValue.increment(-1) });
                });
            } catch (error) {
                console.error("Error deleting answer:", error);
                alert("답변 삭제에 실패했습니다.");
            }
        }
    };

    const timeSince = (date: firebase.firestore.Timestamp | null): string => {
        if (!date) return '방금 전';
        const seconds = Math.floor((new Date().getTime() - date.toDate().getTime()) / 1000);
        if (seconds < 5) return "방금 전";
        let interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "일 전";
        return "오늘";
    };

    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center space-x-2 text-primary mb-6 hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Q&A 목록으로 돌아가기</span>
            </button>

            <div className="max-w-3xl mx-auto">
                {/* Question Section */}
                <div className="bg-dark-accent p-6 rounded-lg shadow-lg mb-8">
                    <p className="text-xs text-primary font-bold">질문</p>
                    <h1 className="text-2xl font-bold text-white mt-1">{question.title}</h1>
                    <div className="text-sm text-gray-500 mt-2 border-b border-gray-700/50 pb-4 mb-4">
                        <span>작성자: {question.authorName}</span>
                        <span className="mx-2">·</span>
                        <span>{timeSince(question.createdAt)}</span>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{question.content}</p>
                </div>

                {/* Answers Section */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white">{answers.length}개의 답변</h2>
                    {loading && <p className="text-gray-400">답변을 불러오는 중...</p>}
                    {!loading && answers.length === 0 && (
                        <p className="text-gray-500 text-center py-8">아직 등록된 답변이 없습니다.</p>
                    )}
                    {answers.map(answer => (
                        <div key={answer.id} className="bg-dark-accent p-5 rounded-lg shadow-lg flex items-start space-x-4">
                             <a href={`/coach/${answer.authorId}`} target="_blank" rel="noopener noreferrer">
                                {answer.authorProfileImageUrl ? (
                                    <img src={answer.authorProfileImageUrl} alt={answer.authorName} className="w-11 h-11 rounded-full object-cover"/>
                                ) : (
                                    <UserCircleIcon className="w-11 h-11 text-gray-500"/>
                                )}
                             </a>
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <a href={`/coach/${answer.authorId}`} target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:underline">{answer.authorName}</a>
                                        <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">트레이너</span>
                                        <p className="text-xs text-gray-500 mt-0.5">{timeSince(answer.createdAt)}</p>
                                    </div>
                                    {answer.authorId === user.uid && (
                                         <button onClick={() => handleDeleteAnswer(answer.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full">
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    )}
                                </div>
                                <p className="text-gray-300 mt-2 whitespace-pre-wrap leading-relaxed">{answer.content}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Answer Form (for trainers only) */}
                {userProfile.role === 'trainer' && (
                    <div className="mt-12 pt-8 border-t border-gray-700">
                         <h2 className="text-xl font-bold text-white mb-4">답변 작성하기</h2>
                         <form onSubmit={handleAnswerSubmit} className="bg-dark-accent p-5 rounded-lg flex items-start space-x-4">
                            {userProfile.profileImageUrl ? (
                                <img src={userProfile.profileImageUrl} alt="My Profile" className="w-11 h-11 rounded-full object-cover"/>
                            ) : (
                                <UserCircleIcon className="w-11 h-11 text-gray-500"/>
                            )}
                            <div className="flex-grow">
                                <textarea
                                    value={newAnswer}
                                    onChange={(e) => setNewAnswer(e.target.value)}
                                    placeholder="전문가로서의 지식을 공유해주세요."
                                    className="w-full bg-dark p-3 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                    rows={5}
                                />
                                <div className="text-right mt-3">
                                    <button type="submit" disabled={!newAnswer.trim() || isAnswering} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600">
                                        {isAnswering ? '등록 중...' : '답변 등록'}
                                    </button>
                                </div>
                            </div>
                         </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionDetailView;