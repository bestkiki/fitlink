import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { db } from '../firebase';
import { UserProfile } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';
import { UserCircleIcon, IdCardIcon, DumbbellIcon, ChatBubbleIcon, CameraIcon } from '../components/icons';
import ConsultationRequestModal from '../components/ConsultationRequestModal';

interface TrainerPublicProfileProps {
    trainerId: string;
    onNavigateToSignup: (trainerId: string) => void;
    currentUserProfile: UserProfile | null;
    currentUser: firebase.User | null;
}

const TrainerPublicProfile: React.FC<TrainerPublicProfileProps> = ({ trainerId, onNavigateToSignup, currentUserProfile, currentUser }) => {
    const [trainerProfile, setTrainerProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchTrainerProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const doc = await db.collection('users').doc(trainerId).get();
                
                if (doc.exists) {
                    const data = doc.data() as UserProfile;
                    if (data.role === 'trainer') {
                        setTrainerProfile(data);
                    } else {
                        setError('해당 사용자는 트레이너가 아닙니다.');
                    }
                } else {
                    setError('트레이너 프로필을 찾을 수 없습니다.');
                }
            } catch (err) {
                console.error("Error fetching trainer profile:", err);
                setError('프로필을 불러오는 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.');
            } finally {
                setLoading(false);
            }
        };

        fetchTrainerProfile();
    }, [trainerId]);

    const handleSendRequest = async (message: string, contact?: string, time?: string) => {
        if (!currentUser || !currentUserProfile || !trainerProfile) return;

        try {
            const requestData: any = {
                memberId: currentUser.uid,
                memberName: currentUserProfile.name || currentUser.email,
                memberEmail: currentUser.email,
                message: message,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (contact) requestData.memberContact = contact;
            if (time) requestData.preferredTime = time;

            await db.collection('users').doc(trainerId).collection('consultationRequests').add(requestData);

            await db.collection('notifications').add({
                userId: trainerId,
                message: `${currentUserProfile.name || currentUser.email}님이 상담 문의를 보냈습니다.`,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('상담 요청이 성공적으로 전송되었습니다.');
            setIsModalOpen(false);

        } catch (err) {
            console.error("Error sending consultation request:", err);
            throw new Error("요청 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    };


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

    const renderActionButtons = () => {
        // Case 1: Logged-in Member
        if (currentUserProfile?.role === 'member') {
            return (
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-secondary hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark focus:ring-secondary transition-transform transform hover:scale-105"
                >
                   <ChatBubbleIcon className="w-6 h-6 mr-3" />
                   PT 체험 / 상담 신청하기
                </button>
            );
        }
        // Case 2: Logged-out User
        if (!currentUser) {
            return (
                <button
                    onClick={() => onNavigateToSignup(trainerId)}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark focus:ring-primary-dark transition-transform transform hover:scale-105"
                >
                   {trainerProfile.name || '트레이너'}님과 함께 운동하기
                </button>
            );
        }
        // Case 3: Logged-in Trainer - show nothing
        return null;
    };

    return (
        <>
            <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-dark">
                <div className="max-w-md w-full space-y-8 bg-dark-accent rounded-xl shadow-lg overflow-hidden">
                    
                    <div className="px-8 pt-8 pb-8 space-y-8">
                        <div className="text-center">
                            <div className="relative inline-block">
                                {trainerProfile.profileImageUrl ? (
                                    <img src={trainerProfile.profileImageUrl} alt="Trainer" className="w-28 h-28 mx-auto rounded-full object-cover border-4 border-dark-accent"/>
                                ) : (
                                    <UserCircleIcon className="w-28 h-28 mx-auto text-gray-500"/>
                                )}
                            </div>
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

                            {trainerProfile.promoImageUrl && (
                                <div className="bg-dark p-4 rounded-lg">
                                    <h3 className="font-bold text-primary flex items-center mb-2"><CameraIcon className="w-5 h-5 mr-2"/>소개 이미지</h3>
                                    <img src={trainerProfile.promoImageUrl} alt="소개 이미지" className="w-full rounded-md object-cover mt-2" />
                                </div>
                            )}
                            
                            {trainerProfile.contact && (
                                <p className="text-center text-gray-400">
                                    <strong>연락처:</strong> {trainerProfile.contact}
                                </p>
                            )}
                        </div>

                        <div className="pt-4">
                            {renderActionButtons()}
                        </div>
                    </div>
                </div>
            </div>
            <ConsultationRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSend={handleSendRequest}
                trainerName={trainerProfile.name || '트레이너'}
                currentUserProfile={currentUserProfile}
            />
        </>
    );
};

export default TrainerPublicProfile;