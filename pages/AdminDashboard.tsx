import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db } from '../firebase';
import { UserProfile, Banner } from '../App';
import { SparklesIcon, PlusCircleIcon, PencilIcon, TrashIcon, PhotoIcon, BookOpenIcon } from '../components/icons';
import AddEditBannerModal from '../components/AddEditBannerModal';
import AddEditHealthArticleModal from '../components/AddEditHealthArticleModal';

export interface HealthArticle {
  id: string;
  title: string;
  summary: string;
  image: string;
  category: 'workout' | 'diet' | 'recovery' | 'mindset';
  content: string;
  createdAt: firebase.firestore.Timestamp;
}

interface AdminDashboardProps {
  user: firebase.User;
  userProfile: UserProfile;
}

type AdminView = 'banners' | 'healthInfo';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, userProfile }) => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loadingBanners, setLoadingBanners] = useState(true);
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

    const [healthArticles, setHealthArticles] = useState<HealthArticle[]>([]);
    const [loadingArticles, setLoadingArticles] = useState(true);
    const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<HealthArticle | null>(null);
    
    const [currentView, setCurrentView] = useState<AdminView>('banners');


    useEffect(() => {
        const unsubscribeBanners = db.collection('banners')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const bannersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
                setBanners(bannersData);
                setLoadingBanners(false);
            }, (error) => {
                console.error("Error fetching banners: ", error);
                setLoadingBanners(false);
            });
            
        const unsubscribeArticles = db.collection('health_articles')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const articlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthArticle));
                setHealthArticles(articlesData);
                setLoadingArticles(false);
            }, (error) => {
                console.error("Error fetching health articles: ", error);
                setLoadingArticles(false);
            });

        return () => {
            unsubscribeBanners();
            unsubscribeArticles();
        };
    }, []);

    const handleOpenBannerModal = (banner: Banner | null) => {
        setEditingBanner(banner);
        setIsBannerModalOpen(true);
    };
    
    const handleOpenArticleModal = (article: HealthArticle | null) => {
        setEditingArticle(article);
        setIsArticleModalOpen(true);
    };

    const handleSaveBanner = async (
        bannerData: Omit<Banner, 'id' | 'createdAt'>
    ) => {
        try {
            if (editingBanner) {
                await db.collection('banners').doc(editingBanner.id).update(bannerData);
            } else {
                await db.collection('banners').add({
                    ...bannerData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }
            setIsBannerModalOpen(false);
            setEditingBanner(null);
        } catch (err: any) {
            console.error("Error saving banner:", err);
            throw new Error('배너 저장에 실패했습니다. 다시 시도해주세요.');
        }
    };
    
    const handleSaveArticle = async (articleData: Omit<HealthArticle, 'id' | 'createdAt'>) => {
        try {
            if (editingArticle) {
                await db.collection('health_articles').doc(editingArticle.id).update(articleData);
            } else {
                await db.collection('health_articles').add({
                    ...articleData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }
            setIsArticleModalOpen(false);
            setEditingArticle(null);
        } catch (err: any) {
            console.error("Error saving article:", err);
            throw new Error('게시글 저장에 실패했습니다. 다시 시도해주세요.');
        }
    };
    
    const handleDeleteBanner = async (banner: Banner) => {
        if (!window.confirm(`정말로 "${banner.title}" 배너를 삭제하시겠습니까?`)) return;

        try {
            await db.collection('banners').doc(banner.id).delete();
        } catch (error) {
            console.error("Error deleting banner:", error);
            alert("배너 삭제에 실패했습니다.");
        }
    };
    
    const handleDeleteArticle = async (article: HealthArticle) => {
        if (!window.confirm(`정말로 "${article.title}" 게시글을 삭제하시겠습니까?`)) return;
        try {
            await db.collection('health_articles').doc(article.id).delete();
        } catch (error) {
            console.error("Error deleting article:", error);
            alert("게시글 삭제에 실패했습니다.");
        }
    };
    
    const renderBanners = () => (
        <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center">
                    <PhotoIcon className="w-7 h-7 mr-3 text-primary" />
                    광고 배너 관리
                </h2>
                <button 
                    onClick={() => handleOpenBannerModal(null)}
                    className="flex items-center space-x-2 bg-primary/80 hover:bg-primary text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    <span>새 배너</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    {/* ... table content from before ... */}
                </table>
            </div>
        </div>
    );
    
    const renderHealthInfo = () => (
        <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center">
                    <BookOpenIcon className="w-7 h-7 mr-3 text-primary" />
                    건강 정보 관리
                </h2>
                <button 
                    onClick={() => handleOpenArticleModal(null)}
                    className="flex items-center space-x-2 bg-primary/80 hover:bg-primary text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    <span>새 글 작성</span>
                </button>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="p-3 text-sm font-semibold text-gray-400">제목</th>
                            <th className="p-3 text-sm font-semibold text-gray-400">카테고리</th>
                            <th className="p-3 text-sm font-semibold text-gray-400">작성일</th>
                            <th className="p-3 text-sm font-semibold text-gray-400 text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingArticles ? (
                            <tr><td colSpan={4} className="text-center p-8 text-gray-500">게시글 목록을 불러오는 중...</td></tr>
                        ) : healthArticles.length > 0 ? (
                            healthArticles.map(article => (
                                <tr key={article.id} className="border-b border-gray-800 hover:bg-dark">
                                    <td className="p-3 font-medium text-white">{article.title}</td>
                                    <td className="p-3 text-gray-400 capitalize">{article.category}</td>
                                    <td className="p-3 text-gray-400">{article.createdAt.toDate().toLocaleDateString('ko-KR')}</td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => handleOpenArticleModal(article)} className="text-gray-400 hover:text-primary mr-2 p-1" title="수정"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteArticle(article)} className="text-gray-400 hover:text-red-400 p-1" title="삭제"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={4} className="text-center p-8 text-gray-500">등록된 게시글이 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );


  return (
    <>
        <div className="container mx-auto px-6 py-12">
            <div className="flex items-center space-x-4 mb-8">
                <SparklesIcon className="w-10 h-10 text-primary" />
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white">관리자 대시보드</h1>
                    <p className="text-lg text-gray-300">
                        환영합니다, <span className="font-semibold text-primary">{userProfile.name || user.email}</span> 님!
                    </p>
                </div>
            </div>
            
             <div className="mb-8 border-b border-gray-700">
                <nav className="flex space-x-4" aria-label="Tabs">
                    <button
                        onClick={() => setCurrentView('banners')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${currentView === 'banners' ? 'border-b-2 border-primary text-primary bg-dark-accent' : 'text-gray-400 hover:text-white'}`}
                    >
                        배너 관리
                    </button>
                    <button
                        onClick={() => setCurrentView('healthInfo')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${currentView === 'healthInfo' ? 'border-b-2 border-primary text-primary bg-dark-accent' : 'text-gray-400 hover:text-white'}`}
                    >
                        건강 정보 관리
                    </button>
                </nav>
            </div>
            
            {currentView === 'banners' ? (
                 <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white flex items-center">
                            <PhotoIcon className="w-7 h-7 mr-3 text-primary" />
                            광고 배너 관리
                        </h2>
                         <button 
                            onClick={() => handleOpenBannerModal(null)}
                            className="flex items-center space-x-2 bg-primary/80 hover:bg-primary text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
                        >
                            <PlusCircleIcon className="w-5 h-5" />
                            <span>새 배너</span>
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="p-3 text-sm font-semibold text-gray-400">미리보기</th>
                                    <th className="p-3 text-sm font-semibold text-gray-400">제목</th>
                                    <th className="p-3 text-sm font-semibold text-gray-400">노출 대상</th>
                                    <th className="p-3 text-sm font-semibold text-gray-400">상태</th>
                                    <th className="p-3 text-sm font-semibold text-gray-400 text-right">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingBanners ? (
                                    <tr><td colSpan={5} className="text-center p-8 text-gray-500">배너 목록을 불러오는 중...</td></tr>
                                ) : banners.length > 0 ? (
                                    banners.map(banner => (
                                        <tr key={banner.id} className="border-b border-gray-800 hover:bg-dark">
                                            <td className="p-3">
                                                <img src={banner.imageUrl} alt={banner.title} className="w-24 h-12 object-cover rounded-md bg-dark" />
                                            </td>
                                            <td className="p-3 font-medium text-white">{banner.title}</td>
                                            <td className="p-3 text-gray-400 capitalize">{banner.targetAudience}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    banner.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/50 text-gray-400'
                                                }`}>
                                                    {banner.isActive ? '활성' : '비활성'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => handleOpenBannerModal(banner)} className="text-gray-400 hover:text-primary mr-2 p-1" title="수정"><PencilIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleDeleteBanner(banner)} className="text-gray-400 hover:text-red-400 p-1" title="삭제"><TrashIcon className="w-5 h-5"/></button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="text-center p-8 text-gray-500">등록된 배너가 없습니다.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                renderHealthInfo()
            )}

        </div>
        <AddEditBannerModal 
            isOpen={isBannerModalOpen}
            onClose={() => { setIsBannerModalOpen(false); setEditingBanner(null); }}
            onSave={handleSaveBanner}
            banner={editingBanner}
        />
        <AddEditHealthArticleModal
            isOpen={isArticleModalOpen}
            onClose={() => { setIsArticleModalOpen(false); setEditingArticle(null); }}
            onSave={handleSaveArticle}
            article={editingArticle}
        />
    </>
  );
};

export default AdminDashboard;
