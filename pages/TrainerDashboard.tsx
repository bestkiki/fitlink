import React, { useState, useEffect, useMemo } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db, storage } from '../firebase';
import { UserProfile, ConsultationRequest } from '../App';
// FIX: Imported TrashIcon to resolve reference error.
import { UserCircleIcon, UsersIcon, CalendarIcon, PlusCircleIcon, PencilIcon, ShareIcon, EnvelopeIcon, DocumentTextIcon, ChatBubbleBottomCenterTextIcon, ArrowTopRightOnSquareIcon, InboxArrowDownIcon, TrashIcon } from '../components/icons';
import EditTrainerProfileModal from '../components/EditTrainerProfileModal';
import AddEditMemberModal from '../components/AddEditMemberModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import MemberDetailView from './MemberDetailView';
import ScheduleManager from './ScheduleManager';
import ShareProfileModal from '../components/InviteMemberModal';
import ConsultationRequestsModal from '../components/ConsultationRequestsModal';

export interface Member extends UserProfile {
    id: string;
}

interface TrainerDashboardProps {
  user: firebase.User;
  userProfile: UserProfile;
}

type TrainerView = 'dashboard' | 'memberDetail' | 'schedule';

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ user, userProfile }) => {
    const [profile, setProfile] = useState(userProfile);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [consultationRequests, setConsultationRequests] = useState<ConsultationRequest[]>([]);
    
    // View and modal states
    const [currentView, setCurrentView] = useState<TrainerView>('dashboard');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isAddEditMemberModalOpen, setIsAddEditMemberModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingMember, setDeletingMember] = useState<Member | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        const unsubscribeMembers = db.collection('users')
            .where('trainerId', '==', user.uid)
            .onSnapshot(snapshot => {
                const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
                setMembers(membersData);
                setLoading(false);
            });
            
        const unsubscribeConsultations = db.collection('users').doc(user.uid).collection('consultationRequests')
            .where('status', '==', 'pending')
            .onSnapshot(snapshot => {
                const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConsultationRequest));
                setConsultationRequests(requestsData);
            });

        return () => {
            unsubscribeMembers();
            unsubscribeConsultations();
        };
    }, [user.uid]);
    
    const handleSaveProfile = async (
        profileData: Partial<UserProfile>, 
        profileImageFile?: File | null, 
        promoImageFile?: File | null
    ) => {
        try {
            const uploadImage = async (file: File, path: string): Promise<string> => {
                const storageRef = storage.ref(path);
                const snapshot = await storageRef.put(file);
                return snapshot.ref.getDownloadURL();
            };

            const dataToUpdate = { ...profileData };

            if (profileImageFile) {
                const imageUrl = await uploadImage(profileImageFile, `profile_images/${user.uid}`);
                dataToUpdate.profileImageUrl = imageUrl;
            }
            if (promoImageFile) {
                const imageUrl = await uploadImage(promoImageFile, `promo_images/${user.uid}`);
                dataToUpdate.promoImageUrl = imageUrl;
            }

            await db.collection('users').doc(user.uid).update(dataToUpdate);
            setProfile(prevProfile => ({ ...prevProfile, ...dataToUpdate }));
            setIsProfileModalOpen(false);
        } catch (err: any) {
            console.error("Error updating profile:", err);
            throw new Error('프로필 저장에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const handleOpenAddEditModal = (member: Member | null) => {
        setEditingMember(member);
        setIsAddEditMemberModalOpen(true);
    };

    const handleSaveMember = async (memberData: Omit<Member, 'id' | 'email'>) => {
        if (!editingMember) return;
        try {
            await db.collection('users').doc(editingMember.id).update(memberData);
            setIsAddEditMemberModalOpen(false);
            setEditingMember(null);
        } catch (err: any) {
            console.error("Error saving member:", err);
            throw new Error('회원 정보 저장에 실패했습니다.');
        }
    };
    
    const handleOpenDeleteModal = (member: Member) => {
        setDeletingMember(member);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteMember = async () => {
        if (!deletingMember) return;
        try {
            // This just unlinks the member, doesn't delete their user account
            await db.collection('users').doc(deletingMember.id).update({
                trainerId: firebase.firestore.FieldValue.delete()
            });
            setIsDeleteModalOpen(false);
            setDeletingMember(null);
        } catch (err) {
            console.error("Error deleting member:", err);
            alert('회원 삭제에 실패했습니다.');
        }
    };

    const handleSelectMember = (member: Member) => {
        setSelectedMember(member);
        setCurrentView('memberDetail');
    };
    
    const handleBackToDashboard = () => {
        setSelectedMember(null);
        setCurrentView('dashboard');
    };

    const filteredMembers = useMemo(() => {
        return members.filter(member =>
            (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [members, searchTerm]);
    
    if (currentView === 'memberDetail' && selectedMember) {
        return <MemberDetailView 
            member={selectedMember} 
            onBack={handleBackToDashboard} 
            onEditProfile={() => handleOpenAddEditModal(selectedMember)} 
        />;
    }

    if (currentView === 'schedule') {
        return <ScheduleManager user={user} onBack={handleBackToDashboard} />;
    }

    return (
        <>
            <div className="container mx-auto px-6 py-12">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">트레이너 대시보드</h1>
                <p className="text-lg text-gray-300 mb-8">
                    환영합니다, <span className="font-semibold text-primary">{profile.name || user.email}</span> 님!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col">
                        <div className="flex items-center mb-4">
                            {profile.profileImageUrl ? (
                                <img src={profile.profileImageUrl} alt="Profile" className="w-16 h-16 rounded-full mr-4 object-cover"/>
                            ) : (
                                <UserCircleIcon className="w-16 h-16 text-primary mr-4"/>
                            )}
                            <h2 className="text-xl font-bold text-white">내 프로필</h2>
                        </div>
                        <div className="flex-grow">
                            <p className="text-gray-400"><strong>이름:</strong> {profile.name || '미지정'}</p>
                            <p className="text-gray-400"><strong>전문 분야:</strong> {profile.specialization || '미지정'}</p>
                            <p className="text-gray-400"><strong>연락처:</strong> {profile.contact || '미지정'}</p>
                        </div>
                        <div className="space-y-2 mt-4">
                            <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center justify-center space-x-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors w-full">
                                <PencilIcon className="w-5 h-5"/>
                                <span>내 프로필 수정</span>
                            </button>
                             <a href={`/coach/${user.uid}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2 bg-dark hover:bg-dark/70 text-white font-bold py-2 px-4 rounded-lg transition-colors w-full border border-gray-600">
                                <ArrowTopRightOnSquareIcon className="w-5 h-5"/>
                                <span>공개 프로필 보기</span>
                            </a>
                        </div>
                    </div>
                    
                    <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col justify-center space-y-4">
                        <button onClick={() => setIsShareModalOpen(true)} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                            <ShareIcon className="w-6 h-6 text-primary" />
                            <span>초대 및 공유</span>
                        </button>
                        <button onClick={() => setCurrentView('schedule')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                            <CalendarIcon className="w-6 h-6 text-primary" />
                            <span>스케줄 관리</span>
                        </button>
                    </div>

                    <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col">
                        <div className="flex items-center mb-4">
                            <InboxArrowDownIcon className="w-10 h-10 text-primary mr-4"/>
                            <h2 className="text-xl font-bold text-white">PT 상담 요청</h2>
                        </div>
                        <div className="flex-grow flex flex-col items-center justify-center text-center">
                            {consultationRequests.length > 0 ? (
                                <>
                                    <p className="text-5xl font-bold text-primary">{consultationRequests.length}</p>
                                    <p className="text-gray-400 mt-2">개의 새로운 상담 요청이 있습니다.</p>
                                </>
                            ) : (
                                <p className="text-gray-500">새로운 상담 요청이 없습니다.</p>
                            )}
                        </div>
                        <button onClick={() => setIsConsultationModalOpen(true)} className="mt-4 bg-dark hover:bg-dark/70 text-gray-200 font-bold py-2 px-4 rounded-lg transition-colors w-full border border-gray-600">
                            상담 내역 관리
                        </button>
                    </div>
                </div>

                <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white flex items-center mb-4 sm:mb-0"><UsersIcon className="w-8 h-8 mr-3"/>담당 회원 목록</h2>
                        <input
                            type="text"
                            placeholder="회원 이름 또는 이메일로 검색"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="p-3 text-sm font-semibold text-gray-400">이름</th>
                                    <th className="p-3 text-sm font-semibold text-gray-400 hidden md:table-cell">이메일</th>
                                    <th className="p-3 text-sm font-semibold text-gray-400 hidden lg:table-cell">운동 목표</th>
                                    <th className="p-3 text-sm font-semibold text-gray-400 text-right">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="text-center p-4">회원 목록을 불러오는 중...</td></tr>
                                ) : filteredMembers.length > 0 ? (
                                    filteredMembers.map(member => (
                                        <tr key={member.id} className="border-b border-gray-800 hover:bg-dark">
                                            <td className="p-3 font-medium text-white">{member.name || '이름 미지정'}</td>
                                            <td className="p-3 text-gray-400 hidden md:table-cell">{member.email}</td>
                                            <td className="p-3 text-gray-400 hidden lg:table-cell truncate max-w-xs">{member.goal || '-'}</td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => handleSelectMember(member)} className="text-primary hover:underline mr-4 text-sm font-semibold">기록 관리</button>
                                                <button onClick={() => handleOpenAddEditModal(member)} className="text-gray-400 hover:text-white mr-2 p-1" title="프로필 수정"><PencilIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleOpenDeleteModal(member)} className="text-gray-400 hover:text-red-400 p-1" title="회원 삭제"><TrashIcon className="w-5 h-5"/></button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={4} className="text-center p-4 text-gray-500">담당 회원이 없습니다. '초대 및 공유' 버튼으로 회원을 초대해보세요.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <EditTrainerProfileModal 
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSave={handleSaveProfile}
                userProfile={profile}
            />
            <AddEditMemberModal
                isOpen={isAddEditMemberModalOpen}
                onClose={() => setIsAddEditMemberModalOpen(false)}
                onSave={handleSaveMember}
                member={editingMember}
            />
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteMember}
                isDeleting={false}
                memberName={deletingMember?.name || ''}
            />
            <ShareProfileModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                trainerId={user.uid}
            />
            <ConsultationRequestsModal
                isOpen={isConsultationModalOpen}
                onClose={() => setIsConsultationModalOpen(false)}
                trainerId={user.uid}
            />
        </>
    );
};

export default TrainerDashboard;