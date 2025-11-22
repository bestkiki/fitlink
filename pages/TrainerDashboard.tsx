
import React, { useState, useEffect, useMemo } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db, storage } from '../firebase';
import { UserProfile, ConsultationRequest, Announcement, Banner } from '../App';
import { UserCircleIcon, UsersIcon, CalendarIcon, PlusCircleIcon, PencilIcon, ShareIcon, EnvelopeIcon, DocumentTextIcon, ChatBubbleBottomCenterTextIcon, ArrowTopRightOnSquareIcon, InboxArrowDownIcon, TrashIcon, MegaphoneIcon, ChatBubbleLeftRightIcon, TrophyIcon, QuestionMarkCircleIcon, BookOpenIcon, BriefcaseIcon } from '../components/icons';
import EditTrainerProfileModal from '../components/EditTrainerProfileModal';
import AddEditMemberModal from '../components/AddEditMemberModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import MemberDetailView from './MemberDetailView';
import ScheduleManager from './ScheduleManager';
import ShareProfileModal from '../components/InviteMemberModal';
import ConsultationRequestsModal from '../components/ConsultationRequestsModal';
import AddEditAnnouncementModal from '../components/AddEditAnnouncementModal';
import CommunityPage from './CommunityPage';
import ChallengeManagerPage from './ChallengeManagerPage';
import QnAPage from './QnAPage';
import HealthInfoPage from './HealthInfoPage';
import JobBoardPage from './JobBoardPage';

export interface Member extends UserProfile {
    id: string;
}

interface TrainerDashboardProps {
  user: firebase.User;
  userProfile: UserProfile;
}

type TrainerView = 'dashboard' | 'memberDetail' | 'schedule' | 'community' | 'challenges' | 'qna' | 'healthInfo' | 'jobBoard';

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ user, userProfile }) => {
    const [profile, setProfile] = useState(userProfile);
    const [members, setMembers] = useState<Member[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [consultationRequests, setConsultationRequests] = useState<ConsultationRequest[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loadingBanners, setLoadingBanners] = useState(true);
    const [currentBanner, setCurrentBanner] = useState(0);
    
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
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribeMembers = db.collection('users')
            .where('trainerId', '==', user.uid)
            .onSnapshot(snapshot => {
                const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
                setMembers(membersData);
                if (loading) setLoading(false);
            });
            
        const unsubscribeConsultations = db.collection('users').doc(user.uid).collection('consultationRequests')
            .where('status', '==', 'pending')
            .onSnapshot(snapshot => {
                const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConsultationRequest));
                setConsultationRequests(requestsData);
            });
            
        const unsubscribeAnnouncements = db.collection('users').doc(user.uid).collection('announcements')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const announcementData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
                setAnnouncements(announcementData);
            });

        return () => {
            unsubscribeMembers();
            unsubscribeConsultations();
            unsubscribeAnnouncements();
        };
    }, [user.uid]);

    useEffect(() => {
        const unsubscribeBanners = db.collection('banners')
            .where('isActive', '==', true)
            .onSnapshot(snapshot => {
                const allActiveBanners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
                
                const relevantBanners = allActiveBanners
                    .filter(banner => ['all', 'trainer'].includes(banner.targetAudience))
                    .sort((a, b) => {
                        const timeA = a.createdAt?.toMillis() || 0;
                        const timeB = b.createdAt?.toMillis() || 0;
                        return timeB - timeA;
                    });

                setBanners(relevantBanners);
                setLoadingBanners(false);
            }, (error) => {
                console.error("Error fetching banners:", error);
                setLoadingBanners(false);
            });

        return () => unsubscribeBanners();
    }, []);

    useEffect(() => {
        if (banners.length > 1) {
            const timer = setTimeout(() => {
                setCurrentBanner(prev => (prev + 1) % banners.length);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [currentBanner, banners.length]);
    
    const handleSaveProfile = async (
        profileData: Partial<UserProfile>, 
        profileImageFile?: File | null, 
        promoImageFile?: File | null
    ) => {
        try {
            const uploadImage = async (file: File, path: string): Promise<string> => {
                const fileName = `${Date.now()}-${file.name}`;
                const fullPath = `${path}/${fileName}`;
                const storageRef = storage.ref(fullPath);
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
    
    const handleCloseAddEditModal = () => {
        setIsAddEditMemberModalOpen(false);
        setEditingMember(null);
    };

    const handleSaveMember = async (memberData: Partial<UserProfile>) => {
        if (!editingMember) return;
        try {
            await db.collection('users').doc(editingMember.id).update(memberData);
        } catch (err: any) {
            console.error("Error saving member:", err);
            throw new Error('회원 정보 저장에 실패했습니다.');
        } finally {
            handleCloseAddEditModal();
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
    
    const handleOpenAnnouncementModal = (announcement: Announcement | null) => {
        setEditingAnnouncement(announcement);
        setIsAnnouncementModalOpen(true);
    };
    
    const handleSaveAnnouncement = async (data: { title: string, content: string }) => {
        const collectionRef = db.collection('users').doc(user.uid).collection('announcements');
        try {
            if (editingAnnouncement) {
                // Editing existing announcement
                await collectionRef.doc(editingAnnouncement.id).update(data);
            } else {
                // Creating new announcement
                await collectionRef.add({
                    ...data,
                    trainerId: user.uid,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
                // Send notifications to all members
                const batch = db.batch();
                members.forEach(member => {
                    const notifRef = db.collection('notifications').doc();
                    batch.set(notifRef, {
                        userId: member.id,
                        message: `새로운 공지: ${data.title}`,
                        read: false,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
                await batch.commit();
            }
            setIsAnnouncementModalOpen(false);
            setEditingAnnouncement(null);
        } catch (error) {
            console.error("Error saving announcement: ", error);
            throw new Error("공지 저장에 실패했습니다.");
        }
    };

    const handleDeleteAnnouncement = async (announcementId: string) => {
        if (window.confirm("정말로 이 공지를 삭제하시겠습니까?")) {
            try {
                await db.collection('users').doc(user.uid).collection('announcements').doc(announcementId).delete();
            } catch (error) {
                console.error("Error deleting announcement: ", error);
                alert("공지 삭제에 실패했습니다.");
            }
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
    
    const renderContent = () => {
        switch (currentView) {
            case 'memberDetail':
                return selectedMember ? (
                    <MemberDetailView 
                        member={selectedMember} 
                        onBack={handleBackToDashboard} 
                        onEditProfile={() => handleOpenAddEditModal(selectedMember)} 
                    />
                ) : null;
            case 'schedule':
                return <ScheduleManager user={user} onBack={handleBackToDashboard} />;
            case 'community':
                return <CommunityPage user={user} userProfile={profile} onBack={handleBackToDashboard} />;
            case 'challenges':
                return <ChallengeManagerPage user={user} onBack={handleBackToDashboard} />;
            case 'qna':
                return <QnAPage user={user} userProfile={profile} onBack={handleBackToDashboard} />;
            case 'healthInfo':
                return <HealthInfoPage onBack={handleBackToDashboard} />;
            case 'jobBoard':
                return <JobBoardPage user={user} userProfile={profile} onBack={handleBackToDashboard} />;
            default:
                const nextBanner = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setCurrentBanner(prev => (prev + 1) % banners.length);
                };
                const prevBanner = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length);
                };
                return (
                    <div className="container mx-auto px-6 py-12">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">트레이너 대시보드</h1>
                        <p className="text-lg text-gray-300 mb-8">
                            환영합니다, <span className="font-semibold text-primary">{profile.name || user.email}</span> 님!
                        </p>
                        
                        {!loadingBanners && banners.length > 0 && banners[currentBanner] && (
                            <div className="relative w-full max-w-5xl mx-auto mb-8 group">
                                <a href={banners[currentBanner].linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-full aspect-video lg:aspect-auto lg:h-64 bg-dark rounded-lg overflow-hidden shadow-lg">
                                    <img 
                                        src={banners[currentBanner].imageUrl} 
                                        alt={banners[currentBanner].title} 
                                        className="w-full h-full object-contain transition-transform duration-500 ease-in-out"
                                        key={banners[currentBanner].id}
                                    />
                                </a>
                                {banners.length > 1 && (
                                <>
                                    <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                                        <button onClick={prevBanner} className="bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                        </button>
                                        <button onClick={nextBanner} className="bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                                        {banners.map((_, index) => (
                                            <button key={index} onClick={(e) => { e.stopPropagation(); setCurrentBanner(index); }} className={`w-2 h-2 rounded-full transition-colors ${currentBanner === index ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`}></button>
                                        ))}
                                    </div>
                                </>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-8">
                            <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col xl:col-span-1">
                                <div className="flex items-center mb-4">
                                    {profile.profileImageUrl ? (
                                        <img src={profile.profileImageUrl} alt="Profile" className="w-16 h-16 rounded-full mr-4 object-cover"/>
                                    ) : (
                                        <UserCircleIcon className="w-16 h-16 text-primary mr-4"/>
                                    )}
                                    <h2 className="text-xl font-bold text-white">내 프로필</h2>
                                </div>
                                <div className="flex-grow space-y-1">
                                    <p className="text-gray-400"><strong>이름:</strong> {profile.name || '미지정'}</p>
                                    <p className="text-gray-400"><strong>지점명:</strong> {profile.gymName || '미지정'}</p>
                                    <p className="text-gray-400"><strong>전문 분야:</strong> {profile.specialization || '미지정'}</p>
                                    <p className="text-gray-400"><strong>연락처:</strong> {profile.contact || '미지정'}</p>
                                    <p className="text-gray-400"><strong>무료 체험:</strong> {profile.offersFreeTrial ? <span className="text-primary font-bold">제공</span> : '미제공'}</p>
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
                            
                            <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col xl:col-span-2">
                                  <div className="flex justify-between items-center mb-4">
                                      <h2 className="text-xl font-bold text-white flex items-center"><MegaphoneIcon className="w-6 h-6 mr-3 text-primary"/>공지사항 관리</h2>
                                      <button onClick={() => handleOpenAnnouncementModal(null)} className="flex items-center space-x-2 bg-primary/80 hover:bg-primary text-white font-bold py-1 px-3 rounded-lg transition-colors text-sm">
                                          <PlusCircleIcon className="w-5 h-5"/>
                                          <span>새 공지 작성</span>
                                      </button>
                                  </div>
                                  <div className="flex-grow space-y-3 max-h-60 overflow-y-auto pr-2">
                                      {announcements.length > 0 ? (
                                          announcements.map(ann => (
                                              <div key={ann.id} className="bg-dark p-3 rounded-md">
                                                  <div className="flex justify-between items-start">
                                                      <div>
                                                          <p className="font-bold text-white">{ann.title}</p>
                                                          <p className="text-xs text-gray-500">{ann.createdAt ? ann.createdAt.toDate().toLocaleDateString('ko-KR') : '방금 전'}</p>
                                                      </div>
                                                      <div className="flex space-x-1 flex-shrink-0">
                                                          <button onClick={() => handleOpenAnnouncementModal(ann)} className="p-1 hover:bg-primary/20 rounded-full"><PencilIcon className="w-4 h-4 text-primary"/></button>
                                                          <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-1 hover:bg-red-500/20 rounded-full"><TrashIcon className="w-4 h-4 text-red-400"/></button>
                                                      </div>
                                                  </div>
                                                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">{ann.content}</p>
                                              </div>
                                          ))
                                      ) : (
                                        <div className="flex items-center justify-center h-full min-h-[10rem]">
                                          <p className="text-gray-500 text-center">작성된 공지사항이 없습니다.</p>
                                        </div>
                                      )}
                                  </div>
                            </div>

                            <div className="bg-dark-accent p-6 rounded-lg shadow-lg flex flex-col xl:col-span-1">
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

                        <div className="bg-dark-accent p-4 rounded-lg shadow-lg mb-8">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                <button onClick={() => setIsShareModalOpen(true)} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                                    <ShareIcon className="w-6 h-6 text-primary" />
                                    <span>초대/공유</span>
                                </button>
                                <button onClick={() => setCurrentView('schedule')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                                    <CalendarIcon className="w-6 h-6 text-primary" />
                                    <span>스케줄</span>
                                </button>
                                 <button onClick={() => setCurrentView('community')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-primary" />
                                    <span>커뮤니티</span>
                                </button>
                                <button onClick={() => setCurrentView('challenges')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                                    <TrophyIcon className="w-6 h-6 text-primary" />
                                    <span>챌린지</span>
                                </button>
                                <button onClick={() => setCurrentView('qna')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                                    <QuestionMarkCircleIcon className="w-6 h-6 text-primary" />
                                    <span>Q&A</span>
                                </button>
                                <button onClick={() => setCurrentView('healthInfo')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                                    <BookOpenIcon className="w-6 h-6 text-primary" />
                                    <span>건강 정보</span>
                                </button>
                                <button onClick={() => setCurrentView('jobBoard')} className="w-full bg-dark hover:bg-dark/70 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-3">
                                    <BriefcaseIcon className="w-6 h-6 text-primary" />
                                    <span>구인구직</span>
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
                                            <th className="p-3 text-sm font-semibold text-gray-400 hidden lg:table-cell">남은 세션</th>
                                            <th className="p-3 text-sm font-semibold text-gray-400 text-right">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan={4} className="text-center p-4">회원 목록을 불러오는 중...</td></tr>
                                        ) : filteredMembers.length > 0 ? (
                                            filteredMembers.map(member => {
                                                const totalSessions = member.totalSessions || 0;
                                                const usedSessions = member.usedSessions || 0;
                                                const remainingSessions = totalSessions - usedSessions;
                                                return (
                                                    <tr key={member.id} className="border-b border-gray-800 hover:bg-dark">
                                                        <td className="p-3 font-medium text-white">{member.name || '이름 미지정'}</td>
                                                        <td className="p-3 text-gray-400 hidden md:table-cell">{member.email}</td>
                                                        <td className="p-3 text-gray-400 hidden lg:table-cell">
                                                            {totalSessions > 0 ? `${remainingSessions} / ${totalSessions}회` : '-'}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <button onClick={() => handleSelectMember(member)} className="text-primary hover:underline mr-4 text-sm font-semibold">기록 관리</button>
                                                            <button onClick={() => handleOpenAddEditModal(member)} className="text-gray-400 hover:text-white mr-2 p-1" title="프로필 수정"><PencilIcon className="w-5 h-5"/></button>
                                                            <button onClick={() => handleOpenDeleteModal(member)} className="text-gray-400 hover:text-red-400 p-1" title="회원 삭제"><TrashIcon className="w-5 h-5"/></button>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        ) : (
                                            <tr><td colSpan={4} className="text-center p-4 text-gray-500">담당 회원이 없습니다. '초대 및 공유' 버튼으로 회원을 초대해보세요.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="min-h-screen bg-dark">
            {currentView === 'dashboard' ? (
                 <>
                    {renderContent()}
                    <EditTrainerProfileModal 
                        isOpen={isProfileModalOpen}
                        onClose={() => setIsProfileModalOpen(false)}
                        onSave={handleSaveProfile}
                        userProfile={profile}
                    />
                    {isAddEditMemberModalOpen && (
                        <AddEditMemberModal
                            isOpen={isAddEditMemberModalOpen}
                            onClose={handleCloseAddEditModal}
                            onSave={handleSaveMember}
                            member={editingMember}
                        />
                    )}
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
                        trainerName={profile.name || ''}
                    />
                    <AddEditAnnouncementModal
                        isOpen={isAnnouncementModalOpen}
                        onClose={() => { setIsAnnouncementModalOpen(false); setEditingAnnouncement(null); }}
                        onSave={handleSaveAnnouncement}
                        announcement={editingAnnouncement}
                    />
                </>
            ) : (
                 <>
                    {renderContent()}
                    {isAddEditMemberModalOpen && (
                         <AddEditMemberModal
                            isOpen={isAddEditMemberModalOpen}
                            onClose={handleCloseAddEditModal}
                            onSave={handleSaveMember}
                            member={editingMember}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default TrainerDashboard;
