
import React, { useState, useEffect, useMemo } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db } from '../firebase';
import { UserProfile, ConsultationRequest } from '../App';
import MemberDetailView from './MemberDetailView';
import ScheduleManager from './ScheduleManager';
import AddEditMemberModal from '../components/AddEditMemberModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import EditTrainerProfileModal from '../components/EditTrainerProfileModal';
import InviteMemberModal from '../components/InviteMemberModal';
import { UserCircleIcon, UsersIcon, CalendarIcon, PencilIcon, TrashIcon, IdCardIcon, ShareIcon, InboxIcon, CheckCircleIcon, MagnifyingGlassIcon } from '../components/icons';
import LoadingSpinner from '../components/LoadingSpinner';

// FIX: This type definition was missing, causing import errors in other files.
export type Member = UserProfile & { id: string };

interface TrainerDashboardProps {
  user: firebase.User;
  userProfile: UserProfile;
}

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ user, userProfile }) => {
  const [profile, setProfile] = useState(userProfile);
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'member_detail' | 'schedule'>('dashboard');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const unsubMembers = db.collection('users')
      .where('trainerId', '==', user.uid)
      .onSnapshot(snapshot => {
        if (!isMounted) return;
        const memberData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
        setMembers(memberData);
        if(loading) setLoading(false);
      }, (error) => {
        console.error("Error fetching members:", error);
        if (isMounted) setLoading(false);
      });

    const unsubRequests = db.collection('users').doc(user.uid).collection('consultationRequests')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        if (!isMounted) return;
        const requestData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConsultationRequest));
        setRequests(requestData);
      });
      
    // Listen for profile updates
    const unsubProfile = db.collection('users').doc(user.uid).onSnapshot(doc => {
        if(isMounted && doc.exists) {
            setProfile(doc.data() as UserProfile);
        }
    });

    return () => {
      isMounted = false;
      unsubMembers();
      unsubRequests();
      unsubProfile();
    };
  }, [user.uid]);

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setView('member_detail');
  };

  const handleOpenEditMemberModal = (member: Member) => {
    setMemberToEdit(member);
    setIsEditMemberModalOpen(true);
  };

  const handleSaveMember = async (memberData: Omit<Member, 'id' | 'email'>) => {
    if (!memberToEdit) return;
    try {
        await db.collection('users').doc(memberToEdit.id).update(memberData);
        setIsEditMemberModalOpen(false);
        setMemberToEdit(null);
    } catch (err: any) {
        console.error("Error updating member:", err);
        throw new Error('회원 정보 저장에 실패했습니다.');
    }
  };

  const handleOpenDeleteModal = (member: Member) => {
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      // This "deletes" the member by disassociating them from the trainer.
      await db.collection('users').doc(memberToDelete.id).update({
        trainerId: firebase.firestore.FieldValue.delete()
      });
      setIsDeleteModalOpen(false);
      setMemberToDelete(null);
    } catch (error) {
        console.error("Error removing member:", error);
        alert('회원 삭제에 실패했습니다.');
    } finally {
        setIsDeleting(false);
    }
  };
  
  const handleSaveProfile = async (profileData: Partial<UserProfile>) => {
    try {
        await db.collection('users').doc(user.uid).update(profileData);
        setIsEditProfileModalOpen(false);
    } catch(err: any) {
        console.error("Error saving profile:", err);
        throw new Error('프로필 저장에 실패했습니다.');
    }
  };

  const handleConfirmRequest = async (request: ConsultationRequest) => {
      const batch = db.batch();
      
      const memberRef = db.collection('users').doc(request.memberId);
      batch.update(memberRef, { trainerId: user.uid });
      
      const requestRef = db.collection('users').doc(user.uid).collection('consultationRequests').doc(request.id);
      batch.update(requestRef, { status: 'confirmed' });

      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, {
        userId: request.memberId,
        message: `${profile.name || user.email} 트레이너가 회원님의 상담 요청을 수락했습니다. 이제부터 담당 트레이너로 지정됩니다.`,
        read: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      try {
          await batch.commit();
      } catch (error) {
          console.error("Error confirming request:", error);
          alert('요청 수락에 실패했습니다.');
      }
  };


  const filteredMembers = useMemo(() => {
    if (!searchTerm) return members;
    return members.filter(member =>
      (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [members, searchTerm]);


  if (loading) return <LoadingSpinner />;

  if (view === 'member_detail' && selectedMember) {
    return <MemberDetailView member={selectedMember} onBack={() => setView('dashboard')} onEditProfile={() => handleOpenEditMemberModal(selectedMember)} />;
  }

  if (view === 'schedule') {
      return <ScheduleManager user={user} onBack={() => setView('dashboard')} />;
  }

  return (
    <>
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">트레이너 대시보드</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Profile Section */}
            <div className="lg:col-span-1 bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col">
                <div className="flex items-center mb-4">
                    <UserCircleIcon className="w-12 h-12 text-primary mr-4"/>
                    <div>
                        <h2 className="text-xl font-bold text-white">{profile.name || '이름을 등록해주세요'}</h2>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                </div>
                <div className="space-y-2 text-sm text-gray-300 flex-grow">
                    <p><strong className="font-semibold text-gray-400">전문 분야:</strong> {profile.specialization || '미지정'}</p>
                    <p><strong className="font-semibold text-gray-400">연락처:</strong> {profile.contact || '미지정'}</p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button onClick={() => setIsEditProfileModalOpen(true)} className="flex items-center justify-center space-x-2 bg-dark hover:bg-dark/70 text-gray-200 font-bold py-2 px-3 rounded-lg transition-colors text-sm">
                        <IdCardIcon className="w-5 h-5"/><span>프로필 수정</span>
                    </button>
                    <button onClick={() => setIsInviteModalOpen(true)} className="flex items-center justify-center space-x-2 bg-dark hover:bg-dark/70 text-gray-200 font-bold py-2 px-3 rounded-lg transition-colors text-sm">
                        <ShareIcon className="w-5 h-5"/><span>회원 초대</span>
                    </button>
                </div>
            </div>

            {/* Consultation Requests & Schedule */}
            <div className="lg:col-span-2 bg-dark-accent p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center"><InboxIcon className="w-6 h-6 mr-3 text-primary"/>상담 요청</h2>
                <div className="space-y-3 max-h-40 overflow-y-auto pr-2 mb-6">
                    {requests.length > 0 ? requests.map(req => (
                        <div key={req.id} className="bg-dark p-3 rounded-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-white">{req.memberName}</p>
                                    <p className="text-xs text-gray-400">{req.memberEmail}</p>
                                    <p className="text-sm text-gray-300 mt-2 italic">"{req.message}"</p>
                                </div>
                                <button onClick={() => handleConfirmRequest(req)} className="flex-shrink-0 flex items-center space-x-2 bg-primary/80 hover:bg-primary text-white font-bold py-1 px-3 rounded-lg transition-colors text-sm">
                                    <CheckCircleIcon className="w-5 h-5"/><span>수락</span>
                                </button>
                            </div>
                        </div>
                    )) : <p className="text-gray-400">새로운 상담 요청이 없습니다.</p>}
                </div>
                <button onClick={() => setView('schedule')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                    <CalendarIcon className="w-6 h-6 text-primary" />
                    <span>스케줄 관리 바로가기</span>
                </button>
            </div>
        </div>

        {/* Member List */}
        <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center mb-4 sm:mb-0"><UsersIcon className="w-6 h-6 mr-3 text-primary"/>나의 회원 목록</h2>
                <div className="relative w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="회원 이름 또는 이메일 검색..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 bg-dark p-2 pl-8 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 absolute top-1/2 left-2 transform -translate-y-1/2"/>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-gray-700 text-sm text-gray-400">
                        <tr>
                            <th className="p-3">이름</th>
                            <th className="p-3 hidden md:table-cell">이메일</th>
                            <th className="p-3 hidden lg:table-cell">운동 목표</th>
                            <th className="p-3 text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMembers.length > 0 ? filteredMembers.map(member => (
                            <tr key={member.id} className="border-b border-gray-800 hover:bg-dark">
                                <td className="p-3 font-semibold text-white">{member.name || '이름 미지정'}</td>
                                <td className="p-3 text-gray-400 hidden md:table-cell">{member.email}</td>
                                <td className="p-3 text-gray-400 hidden lg:table-cell truncate" style={{maxWidth: '200px'}}>{member.goal || '-'}</td>
                                <td className="p-3 text-right">
                                    <div className="flex justify-end items-center space-x-2">
                                        <button onClick={() => handleSelectMember(member)} className="text-primary hover:underline text-sm">상세</button>
                                        <button onClick={() => handleOpenEditMemberModal(member)} className="p-1.5 hover:bg-primary/20 rounded-full"><PencilIcon className="w-4 h-4 text-primary"/></button>
                                        <button onClick={() => handleOpenDeleteModal(member)} className="p-1.5 hover:bg-red-500/20 rounded-full"><TrashIcon className="w-4 h-4 text-red-400"/></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                             <tr>
                                <td colSpan={4} className="text-center p-8 text-gray-400">
                                    {searchTerm ? '검색 결과가 없습니다.' : '아직 등록된 회원이 없습니다. "회원 초대" 버튼을 통해 회원을 추가해보세요.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
      
      {/* Modals */}
      <EditTrainerProfileModal 
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSave={handleSaveProfile}
        userProfile={profile}
      />
      <InviteMemberModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        trainerId={user.uid}
      />
      <AddEditMemberModal 
        isOpen={isEditMemberModalOpen}
        onClose={() => { setIsEditMemberModalOpen(false); setMemberToEdit(null); }}
        onSave={handleSaveMember}
        member={memberToEdit}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setMemberToDelete(null); }}
        onConfirm={handleDeleteMember}
        isDeleting={isDeleting}
        memberName={memberToDelete?.name || ''}
      />
    </>
  );
};

export default TrainerDashboard;
