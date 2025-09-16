import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db } from '../firebase';
import { UserProfile, ConsultationRequest } from '../App';
import { UserCircleIcon, UsersIcon, CalendarIcon, PlusCircleIcon, PencilIcon, ShareIcon, TrashIcon, InboxIcon, CheckCircleIcon, PhoneIcon, ClockIcon } from '../components/icons';
import AddEditMemberModal from '../components/AddEditMemberModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import EditTrainerProfileModal from '../components/EditTrainerProfileModal';
import MemberDetailView from './MemberDetailView';
import ScheduleManager from './ScheduleManager';

export interface Member extends UserProfile {
  id: string;
}

interface ConsultationRequestWithId extends ConsultationRequest {
    id: string;
}

interface TrainerDashboardProps {
  user: firebase.User;
  userProfile: UserProfile;
}

type TrainerView = 'dashboard' | 'member_detail' | 'schedule';

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ user, userProfile }) => {
    const [profile, setProfile] = useState(userProfile);
    const [members, setMembers] = useState<Member[]>([]);
    const [consultationRequests, setConsultationRequests] = useState<ConsultationRequestWithId[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [view, setView] = useState<TrainerView>('dashboard');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    // Modal states
    const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
    const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const unsubscribe = db.collection('users')
            .where('trainerId', '==', user.uid)
            .onSnapshot(snapshot => {
                const memberData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Member));
                setMembers(memberData);
                setLoadingMembers(false);
            });

        return () => unsubscribe();
    }, [user.uid]);
    
    useEffect(() => {
        const unsubscribe = db.collection('users').doc(user.uid).collection('consultationRequests')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const requests = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as ConsultationRequestWithId));
                setConsultationRequests(requests);
                setLoadingRequests(false);
            });
        return () => unsubscribe();
    }, [user.uid]);

    const handleSaveProfile = async (profileData: Partial<UserProfile>) => {
        try {
            await db.collection('users').doc(user.uid).update(profileData);
            setProfile(prev => ({...prev, ...profileData}));
            setIsProfileModalOpen(false);
        } catch (err) {
            console.error(err);
            throw new Error('프로필 업데이트에 실패했습니다.');
        }
    };
    
    const handleViewMember = (member: Member) => {
        setSelectedMember(member);
        setView('member_detail');
    };

    const handleOpenEditMemberModal = (member: Member) => {
        setMemberToEdit(member);
        setIsEditMemberModalOpen(true);
    };

    const handleOpenDeleteModal = (member: Member) => {
        setMemberToDelete(member);
        setIsDeleteModalOpen(true);
    };

    const handleSaveMember = async (memberData: Omit<Member, 'id' | 'email'>) => {
        if (!memberToEdit) return;
        try {
            await db.collection('users').doc(memberToEdit.id).update(memberData);
            setIsEditMemberModalOpen(false);
            setMemberToEdit(null);
            if (selectedMember && selectedMember.id === memberToEdit.id) {
                setSelectedMember(prev => ({...prev!, ...memberData}));
            }
        } catch (error) {
            console.error("Error updating member:", error);
            throw new Error('회원 정보 저장에 실패했습니다.');
        }
    };

    const handleDeleteMember = async () => {
        if (!memberToDelete) return;
        setIsDeleting(true);
        await db.collection('users').doc(memberToDelete.id).update({
            trainerId: firebase.firestore.FieldValue.delete()
        });
        setIsDeleteModalOpen(false);
        setMemberToDelete(null);
        setIsDeleting(false);
    };

    const handleUpdateRequestStatus = async (requestId: string, status: 'confirmed') => {
        await db.collection('users').doc(user.uid).collection('consultationRequests').doc(requestId).update({ status });
    };

    const handleDeleteRequest = async (requestId: string) => {
        if (window.confirm('정말로 이 문의를 삭제하시겠습니까?')) {
            await db.collection('users').doc(user.uid).collection('consultationRequests').doc(requestId).delete();
        }
    };

    const publicProfileLink = `${window.location.origin}/coach/${user.uid}`;

    if (view === 'member_detail' && selectedMember) {
        return <MemberDetailView member={selectedMember} onBack={() => setView('dashboard')} onEditProfile={() => handleOpenEditMemberModal(selectedMember)} />;
    }

    if (view === 'schedule') {
        return <ScheduleManager user={user} onBack={() => setView('dashboard')} />;
    }

    return (
        <>
            <div className="container mx-auto px-6 py-12">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">트레이너 대시보드</h1>
                <p className="text-lg text-gray-300 mb-8">환영합니다, <span className="font-semibold text-primary">{profile.name || user.email}</span> 님!</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                         <div className="flex items-center mb-4">
                            <UserCircleIcon className="w-10 h-10 text-primary mr-4"/>
                            <h2 className="text-xl font-bold text-white">내 프로필</h2>
                        </div>
                        <p className="text-gray-400"><strong>이름:</strong> {profile.name || '미지정'}</p>
                        <p className="text-gray-400"><strong>전문 분야:</strong> {profile.specialization || '미지정'}</p>
                        <button onClick={() => setIsProfileModalOpen(true)} className="mt-4 w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">프로필 수정</button>
                    </div>
                     <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col justify-between">
                         <div>
                            <h2 className="text-xl font-bold text-white mb-2">회원 초대 및 공개 프로필</h2>
                            <p className="text-gray-400 text-sm mb-4">아래 링크를 공유하여 회원을 초대하거나, PT 문의를 받아보세요.</p>
                             <input type="text" readOnly value={publicProfileLink} className="w-full bg-dark p-2 rounded-md text-gray-300 border border-gray-600"/>
                         </div>
                        <button onClick={() => navigator.clipboard.writeText(publicProfileLink).then(() => alert('링크가 복사되었습니다!'))} className="mt-4 w-full flex items-center justify-center space-x-2 bg-dark hover:bg-gray-700/50 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <ShareIcon className="w-5 h-5"/>
                            <span>링크 복사</span>
                        </button>
                    </div>
                    <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-4">바로가기</h2>
                        <div className="space-y-3">
                            <button onClick={() => setView('schedule')} className="w-full flex items-center space-x-3 bg-dark hover:bg-gray-700/50 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                                <CalendarIcon className="w-6 h-6 text-primary" />
                                <span>스케줄 관리</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-dark-accent p-6 rounded-lg shadow-lg mb-12">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <InboxIcon className="w-8 h-8 mr-3 text-primary"/>상담 문의 내역
                    </h2>
                    {loadingRequests ? (
                        <p className="text-gray-400">문의 내역을 불러오는 중...</p>
                    ) : consultationRequests.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {consultationRequests.map(request => (
                                <div key={request.id} className={`bg-dark p-4 rounded-lg border-l-4 ${request.status === 'pending' ? 'border-primary' : 'border-gray-600 opacity-70'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-white">{request.memberName}</p>
                                            <p className="text-sm text-gray-400">{request.createdAt.toDate().toLocaleDateString('ko-KR')}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {request.status === 'pending' && (
                                                <button onClick={() => handleUpdateRequestStatus(request.id, 'confirmed')} className="p-1 hover:bg-green-500/20 rounded-full" title="확인 완료로 표시">
                                                    <CheckCircleIcon className="w-6 h-6 text-green-400 hover:text-green-300"/>
                                                </button>
                                            )}
                                            <button onClick={() => handleDeleteRequest(request.id)} className="p-1 hover:bg-red-500/20 rounded-full" title="삭제">
                                                <TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-400"/>
                                            </button>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-gray-300 text-sm whitespace-pre-wrap">{request.message}</p>
                                    {(request.memberContact || request.preferredTime) && (
                                        <div className="mt-3 pt-3 border-t border-gray-700/50 text-sm space-y-1">
                                            {request.memberContact && (
                                                <p className="flex items-center text-gray-400"><PhoneIcon className="w-4 h-4 mr-2 text-primary"/> {request.memberContact}</p>
                                            )}
                                            {request.preferredTime && (
                                                <p className="flex items-center text-gray-400"><ClockIcon className="w-4 h-4 mr-2 text-primary"/> {request.preferredTime}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-400 py-4">아직 받은 상담 문의가 없습니다.</p>
                    )}
                </div>

                <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center"><UsersIcon className="w-8 h-8 mr-3 text-primary"/>나의 회원 목록</h2>
                        <button onClick={() => {}} className="flex items-center space-x-2 bg-primary/80 hover:bg-primary text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm opacity-50 cursor-not-allowed" title="회원 초대 기능은 링크 공유로 대체됩니다.">
                            <PlusCircleIcon className="w-5 h-5"/>
                            <span>회원 추가</span>
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        {loadingMembers ? <p>회원 목록을 불러오는 중...</p> : members.length > 0 ? (
                             <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="p-3">이름</th>
                                        <th className="p-3 hidden md:table-cell">이메일</th>
                                        <th className="p-3 hidden sm:table-cell">운동 목표</th>
                                        <th className="p-3 text-right">관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map(member => (
                                        <tr key={member.id} className="border-b border-gray-700/50 hover:bg-dark">
                                            <td className="p-3 font-semibold cursor-pointer" onClick={() => handleViewMember(member)}>{member.name || '이름 미지정'}</td>
                                            <td className="p-3 text-gray-400 hidden md:table-cell cursor-pointer" onClick={() => handleViewMember(member)}>{member.email}</td>
                                            <td className="p-3 text-gray-400 hidden sm:table-cell cursor-pointer truncate max-w-xs" onClick={() => handleViewMember(member)}>{member.goal || '-'}</td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => handleOpenEditMemberModal(member)} className="p-2 hover:bg-primary/20 rounded-full"><PencilIcon className="w-5 h-5 text-primary"/></button>
                                                <button onClick={() => handleOpenDeleteModal(member)} className="p-2 hover:bg-red-500/20 rounded-full"><TrashIcon className="w-5 h-5 text-red-400"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-gray-400 py-8">아직 등록된 회원이 없습니다. 초대 링크를 공유하여 회원을 추가하세요.</p>
                        )}
                    </div>
                </div>
            </div>

            <AddEditMemberModal isOpen={isEditMemberModalOpen} onClose={() => setIsEditMemberModalOpen(false)} onSave={handleSaveMember} member={memberToEdit} />
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteMember} isDeleting={isDeleting} memberName={memberToDelete?.name || ''} />
            <EditTrainerProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onSave={handleSaveProfile} userProfile={profile} />
        </>
    );
};
export default TrainerDashboard;