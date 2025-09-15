import React, { useState, useEffect, useRef } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db } from '../firebase';
import { UsersIcon, CalendarIcon, ChatBubbleIcon, PencilIcon, TrashIcon, IdCardIcon, DocumentTextIcon } from '../components/icons';
import AddEditMemberModal from '../components/AddEditMemberModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import EditTrainerProfileModal from '../components/EditTrainerProfileModal';
import { UserProfile } from '../App';
import MemberDetailView from './MemberDetailView';

interface TrainerDashboardProps {
  user: firebase.User;
  userProfile: UserProfile;
}

export interface Member extends Omit<UserProfile, 'role' | 'trainerId'> {
    id: string;
}

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ user, userProfile }) => {
  const [profile, setProfile] = useState(userProfile);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [viewingMember, setViewingMember] = useState<Member | null>(null);

  const membersSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const querySnapshot = await db.collection('users').where('trainerId', '==', user.uid).get();
        const memberData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<UserProfile, 'role' | 'trainerId'>),
        }));
        setMembers(memberData);
      } catch (err) {
        console.error("Error fetching members:", err);
        setError('회원 목록을 불러오는 데 실패했습니다.');
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [user.uid]);
  
  const generateInviteLink = () => {
    const link = `${window.location.origin}/signup/coach/${user.uid}`;
    setInviteLink(link);
  };

  const copyToClipboard = () => {
    if (inviteLink) {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleOpenEditModal = (member: Member) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedMember(null);
  };

  const handleSaveMember = async (memberData: Omit<Member, 'id' | 'email'>) => {
    if (!selectedMember) return;

    try {
        await db.collection('users').doc(selectedMember.id).update(memberData);
        const updatedMember = { ...selectedMember, ...memberData };
        setMembers(prevMembers => 
            prevMembers.map(m => m.id === selectedMember.id ? updatedMember : m)
        );
        if (viewingMember?.id === selectedMember.id) {
            setViewingMember(updatedMember);
        }
        handleCloseEditModal();
    } catch (err: any) {
        console.error("Error updating member:", err);
        if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED') {
            throw new Error('회원 정보를 수정할 권한이 없습니다. Firebase 보안 규칙을 확인해주세요.');
        }
        throw new Error('서버 오류로 인해 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleDeleteMember = (member: Member) => {
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setMemberToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
        await db.collection('users').doc(memberToDelete.id).delete();
        setMembers(prevMembers => prevMembers.filter(m => m.id !== memberToDelete.id));
        handleCloseDeleteModal();
    } catch (err) {
        console.error("Error deleting member:", err);
        alert('회원 삭제에 실패했습니다. 권한을 확인하거나 다시 시도해주세요.');
    } finally {
        setIsDeleting(false);
    }
  };

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

  const scrollToMembers = () => {
    membersSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  if (viewingMember) {
      return <MemberDetailView 
                member={viewingMember} 
                onBack={() => setViewingMember(null)}
                onEditProfile={() => handleOpenEditModal(viewingMember)}
             />
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Invite Member Card */}
          <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">회원 초대하기</h2>
            <p className="text-gray-400 mb-4">
              회원을 초대하여 FitLink에서 함께 운동 계획을 관리하세요.
            </p>
            {!inviteLink ? (
              <button
                onClick={generateInviteLink}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors mt-auto"
              >
                초대 링크 생성
              </button>
            ) : (
              <div className="flex flex-col space-y-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="w-full bg-dark p-2 rounded-md text-gray-300 border border-gray-600 focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="w-full bg-secondary hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  {copied ? '복사 완료!' : '링크 복사'}
                </button>
              </div>
            )}
          </div>
          
          <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center">
              <IdCardIcon className="w-12 h-12 text-primary mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">내 프로필 관리</h2>
              <p className="text-gray-400">회원에게 보여줄 프로필을 관리합니다.</p>
              <button onClick={() => setIsProfileModalOpen(true)} className="mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  프로필 수정
              </button>
          </div>

          <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center">
              <UsersIcon className="w-12 h-12 text-primary mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">회원 관리</h2>
              <p className="text-gray-400">등록된 회원 목록을 확인하고 관리합니다.</p>
              <button onClick={scrollToMembers} className="mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  회원 목록 보기
              </button>
          </div>
          
          <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col items-center justify-center text-center opacity-50">
              <CalendarIcon className="w-12 h-12 text-primary mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">스케줄 관리</h2>
              <p className="text-gray-400">수업 스케줄을 확인하고 예약합니다.</p>
              <button disabled className="mt-4 bg-gray-600 text-gray-300 font-bold py-2 px-4 rounded-lg cursor-not-allowed">
                  곧 제공될 예정입니다
              </button>
          </div>
        </div>

        {/* Member List Section */}
        <div ref={membersSectionRef} className="mt-16 scroll-mt-20">
          <h2 className="text-2xl font-bold text-white mb-6">내 회원 목록</h2>
          <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
              {loadingMembers ? (
                  <p className="text-gray-400">회원 목록을 불러오는 중...</p>
              ) : error ? (
                  <p className="text-red-400">{error}</p>
              ) : members.length > 0 ? (
                  <div className="space-y-4">
                      {members.map(member => (
                          <div key={member.id} className="p-4 bg-dark rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-700 gap-4">
                            <div className="flex-grow">
                                <p className="font-semibold text-lg text-white">{member.name || '이름 미지정'}</p>
                                <p className="text-sm text-gray-400">{member.email}</p>
                            </div>
                            <div className="flex space-x-2 flex-shrink-0">
                                <button onClick={() => setViewingMember(member)} className="p-2 bg-green-500/20 hover:bg-green-500/40 rounded-md transition-colors flex items-center space-x-2 text-sm text-green-400 font-semibold px-3">
                                    <DocumentTextIcon className="w-5 h-5" />
                                    <span>기록 관리</span>
                                </button>
                                <button onClick={() => handleOpenEditModal(member)} className="p-2 bg-primary/20 hover:bg-primary/40 rounded-md transition-colors" title="프로필 수정">
                                    <PencilIcon className="w-5 h-5 text-primary" />
                                </button>
                                <button onClick={() => handleDeleteMember(member)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-md transition-colors" title="회원 삭제">
                                    <TrashIcon className="w-5 h-5 text-red-400" />
                                </button>
                            </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-gray-400">아직 등록된 회원이 없습니다. 초대 링크를 통해 첫 회원을 등록해보세요!</p>
              )}
          </div>
        </div>
      </div>
      <AddEditMemberModal 
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveMember}
        member={selectedMember}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        memberName={memberToDelete?.name || memberToDelete?.email || ''}
      />
      <EditTrainerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        userProfile={profile}
      />
    </>
  );
};

export default TrainerDashboard;