
import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db } from '../firebase';
import { UserProfile, ConsultationRequest } from '../App';
import { UsersIcon, PencilIcon, PlusCircleIcon, TrashIcon, UserCircleIcon, IdCardIcon, ShareIcon, InboxIcon, CalendarIcon } from '../components/icons';
import AddEditMemberModal from '../components/AddEditMemberModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import EditTrainerProfileModal from '../components/EditTrainerProfileModal';
import InviteMemberModal from '../components/InviteMemberModal';
import MemberDetailView from './MemberDetailView';
import ScheduleManager from './ScheduleManager';

// Type definition for a member, extending UserProfile with an ID.
export interface Member extends UserProfile {
  id: string;
}

interface TrainerDashboardProps {
  user: firebase.User;
  userProfile: UserProfile;
}

type TrainerDashboardView = 'dashboard' | 'member_detail' | 'schedule';

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ user, userProfile }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [profile, setProfile] = useState(userProfile);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentView, setCurrentView] = useState<TrainerDashboardView>('dashboard');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Modal states
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  const [consultationRequests, setConsultationRequests] = useState<ConsultationRequest[]>([]);


  useEffect(() => {
    // Fetch members assigned to this trainer
    const unsubscribeMembers = db.collection('users')
      .where('role', '==', 'member')
      .where('trainerId', '==', user.uid)
      .onSnapshot(snapshot => {
        const memberData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
        setMembers(memberData);
        setLoading(false);
      });
      
    // Fetch consultation requests
    const unsubscribeRequests = db.collection('users').doc(user.uid).collection('consultationRequests')
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConsultationRequest));
            setConsultationRequests(requests);
        });

    return () => {
        unsubscribeMembers();
        unsubscribeRequests();
    };
  }, [user.uid]);

  // Handler to save trainer's own profile
  const handleSaveProfile = async (profileData: Partial<UserProfile>) => {
    try {
      await db.collection('users').doc(user.uid).update(profileData);
      setProfile(prevProfile => ({ ...prevProfile, ...profileData }));
      setIsProfileModalOpen(false);
    } catch (err: any) {
        console.error("Error updating profile:", err);
        throw new Error('프로필 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // Handlers for member management
  const handleEditMember = (member: Member) => {
    setSelectedMember(member);
    setIsEditMemberModalOpen(true);
  };

  const handleSaveMember = async (memberData: Omit<Member, 'id' | 'email'>) => {
    if (!selectedMember) return;
    try {
        await db.collection('users').doc(selectedMember.id).update(memberData);
        setIsEditMemberModalOpen(false);
        setSelectedMember(null);
    } catch (err: any) {
        console.error("Error updating member profile:", err);
        throw new Error('회원 정보 저장에 실패했습니다.');
    }
  };

  const handleDeleteMember = (member: Member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMember = async () => {
    if (!selectedMember) return;
    try {
      // Instead of deleting, we remove the trainerId to unassign them.
      await db.collection('users').doc(selectedMember.id).update({
        trainerId: firebase.firestore.FieldValue.delete()
      });
      setIsDeleteModalOpen(false);
      setSelectedMember(null);
    } catch (error) {
        console.error("Error deleting member:", error);
        alert('회원 삭제에 실패했습니다.');
    }
  };
  
  const handleConfirmRequest = async (requestId: string, memberId: string) => {
      const batch = db.batch();
      const requestRef = db.collection('users').doc(user.uid).collection('consultationRequests').doc(requestId);
      batch.update(requestRef, { status: 'confirmed' });
      
      const memberRef = db.collection('users').doc(memberId);
      batch.update(memberRef, { trainerId: user.uid });
      
      await batch.commit();
      
      await db.collection('notifications').add({
          userId: memberId,
          message: `트레이너 ${profile.name || user.email}님이 상담 요청을 수락했습니다. 이제부터 담당 트레이너로 지정됩니다.`,
          read: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
  };

  // Navigation handlers
  const viewMemberDetail = (member: Member) => {
    setSelectedMember(member);
    setCurrentView('member_detail');
  };

  const handleBackToDashboard = () => {
    setSelectedMember(null);
    setCurrentView('dashboard');
  };

  const filteredMembers = members.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentView === 'member_detail' && selectedMember) {
    return <MemberDetailView member={selectedMember} onBack={handleBackToDashboard} onEditProfile={() => handleEditMember(selectedMember)} />;
  }
  
  if (currentView === 'schedule') {
      return <ScheduleManager user={user} onBack={handleBackToDashboard} />;
  }

  return (
    <>
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          트레이너 대시보드
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          환영합니다, <span className="font-semibold text-primary">{profile.name || user.email}</span> 님!
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Trainer Profile Card */}
          <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
              <UserCircleIcon className="w-10 h-10 text-primary mr-4"/>
              <h2 className="text-xl font-bold text-white">내 프로필</h2>
            </div>
            <p className="text-gray-400"><strong>이름:</strong> {profile.name || '미지정'}</p>
            <p className="text-gray-400"><strong>전문 분야:</strong> {profile.specialization || '미지정'}</p>
            <p className="text-gray-400"><strong>연락처:</strong> {profile.contact || '미지정'}</p>
            <button onClick={() => setIsProfileModalOpen(true)} className="mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors w-full">
              내 프로필 수정
            </button>
          </div>

          {/* Action Cards */}
          <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col justify-center space-y-4">
             <button onClick={() => setIsInviteModalOpen(true)} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                <ShareIcon className="w-6 h-6 text-primary" />
                <span>회원 초대 링크 공유</span>
            </button>
             <button onClick={() => setCurrentView('schedule')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                <CalendarIcon className="w-6 h-6 text-primary" />
                <span>스케줄 관리</span>
            </button>
          </div>
          
          {/* Consultation Requests */}
          <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
                <InboxIcon className="w-10 h-10 text-primary mr-4"/>
                <h2 className="text-xl font-bold text-white">PT 상담 요청</h2>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
                {consultationRequests.length > 0 ? (
                    consultationRequests.map(req => (
                        <div key={req.id} className="bg-dark p-3 rounded-md text-sm">
                            <p className="font-semibold text-white">{req.memberName}</p>
                            <p className="text-gray-400 truncate my-1" title={req.message}>{req.message}</p>
                            <button onClick={() => handleConfirmRequest(req.id, req.memberId)} className="w-full text-center text-xs font-bold bg-primary/80 hover:bg-primary text-white py-1 rounded-md mt-1">
                                수락 및 담당 회원으로 지정
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400 text-sm">새로운 상담 요청이 없습니다.</p>
                )}
            </div>
          </div>
        </div>

        {/* Member List */}
        <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center mb-4 md:mb-0"><UsersIcon className="w-8 h-8 mr-3 text-primary"/>담당 회원 목록</h2>
            <input
              type="text"
              placeholder="회원 이름 또는 이메일로 검색"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full md:w-64 bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-3 text-gray-400">이름</th>
                  <th className="p-3 text-gray-400 hidden md:table-cell">이메일</th>
                  <th className="p-3 text-gray-400 hidden lg:table-cell">운동 목표</th>
                  <th className="p-3 text-gray-400 text-right">관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center p-4">회원 목록을 불러오는 중...</td></tr>
                ) : filteredMembers.length > 0 ? (
                  filteredMembers.map(member => (
                    <tr key={member.id} className="border-b border-gray-700/50 hover:bg-dark">
                      <td className="p-3 font-semibold cursor-pointer" onClick={() => viewMemberDetail(member)}>{member.name || '이름 미지정'}</td>
                      <td className="p-3 text-gray-400 hidden md:table-cell">{member.email}</td>
                      <td className="p-3 text-gray-400 hidden lg:table-cell truncate max-w-xs">{member.goal || '-'}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => viewMemberDetail(member)} className="text-primary hover:underline text-sm mr-4">상세보기</button>
                        <button onClick={() => handleEditMember(member)} className="p-2"><PencilIcon className="w-5 h-5 text-gray-400 hover:text-primary"/></button>
                        <button onClick={() => handleDeleteMember(member)} className="p-2"><TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-400"/></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="text-center p-4 text-gray-400">담당 회원이 없습니다. '회원 초대'로 시작해보세요.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddEditMemberModal
        isOpen={isEditMemberModalOpen}
        onClose={() => { setIsEditMemberModalOpen(false); setSelectedMember(null); }}
        onSave={handleSaveMember}
        member={selectedMember}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedMember(null); }}
        onConfirm={confirmDeleteMember}
        isDeleting={false} // This can be enhanced with a state if the delete operation is slow
        memberName={selectedMember?.name || selectedMember?.email || ''}
      />
      <EditTrainerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        userProfile={profile}
      />
       <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        trainerId={user.uid}
      />
    </>
  );
};

export default TrainerDashboard;
