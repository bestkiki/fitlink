import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db, storage } from '../firebase';
import { UserProfile, Banner } from '../App';
import { SparklesIcon, PlusCircleIcon, PencilIcon, TrashIcon, PhotoIcon } from '../components/icons';
import AddEditBannerModal from '../components/AddEditBannerModal';

interface AdminDashboardProps {
  user: firebase.User;
  userProfile: UserProfile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, userProfile }) => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

    useEffect(() => {
        const unsubscribe = db.collection('banners')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const bannersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
                setBanners(bannersData);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching banners: ", error);
                setLoading(false);
            });
        return () => unsubscribe();
    }, []);

    const handleOpenModal = (banner: Banner | null) => {
        setEditingBanner(banner);
        setIsModalOpen(true);
    };

    const handleSaveBanner = async (
        bannerData: Omit<Banner, 'id' | 'createdAt' | 'imageUrl'>, 
        imageFile?: File | null
    ) => {
        try {
            let imageUrl = editingBanner?.imageUrl || '';

            // 1. Upload new image if provided
            if (imageFile) {
                // Delete old image if it exists and we are uploading a new one
                if (editingBanner?.imageUrl && (editingBanner.imageUrl.startsWith('gs://') || editingBanner.imageUrl.startsWith('https://'))) {
                    try {
                        const oldImageRef = storage.refFromURL(editingBanner.imageUrl);
                        await oldImageRef.delete();
                    } catch (storageError) {
                        console.warn("Old image deletion failed, might not exist:", storageError);
                    }
                }
                const fileName = `${Date.now()}-${imageFile.name}`;
                // FIX: Scope banner images to the admin's UID to align with likely storage rules
                const storageRef = storage.ref(`banner_images/${user.uid}/${fileName}`);
                const snapshot = await storageRef.put(imageFile);
                imageUrl = await snapshot.ref.getDownloadURL();
            }

            const dataToSave = { ...bannerData, imageUrl };

            // 2. Save to Firestore
            if (editingBanner) {
                await db.collection('banners').doc(editingBanner.id).update(dataToSave);
            } else {
                await db.collection('banners').add({
                    ...dataToSave,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }

            setIsModalOpen(false);
            setEditingBanner(null);

        } catch (err: any) {
            console.error("Error saving banner:", err);
            throw new Error('배너 저장에 실패했습니다. 다시 시도해주세요.');
        }
    };
    
    const handleDeleteBanner = async (banner: Banner) => {
        if (!window.confirm(`정말로 "${banner.title}" 배너를 삭제하시겠습니까?`)) return;

        try {
            // Delete Firestore document
            await db.collection('banners').doc(banner.id).delete();
            
            // Delete image from Storage
            if (banner.imageUrl && (banner.imageUrl.startsWith('gs://') || banner.imageUrl.startsWith('https://'))) {
                const imageRef = storage.refFromURL(banner.imageUrl);
                await imageRef.delete();
            }

        } catch (error) {
            console.error("Error deleting banner:", error);
            alert("배너 삭제에 실패했습니다.");
        }
    };

  return (
    <>
        <div className="container mx-auto px-6 py-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                 <div className="flex items-center space-x-4">
                    <SparklesIcon className="w-10 h-10 text-primary" />
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">관리자 대시보드</h1>
                        <p className="text-lg text-gray-300">
                            환영합니다, <span className="font-semibold text-primary">{userProfile.name || user.email}</span> 님!
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => handleOpenModal(null)}
                    className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors mt-4 sm:mt-0"
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    <span>새 배너 추가</span>
                </button>
            </div>
            
            <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white flex items-center mb-4">
                    <PhotoIcon className="w-7 h-7 mr-3 text-primary" />
                    광고 배너 관리
                </h2>
                
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
                            {loading ? (
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
                                            <button onClick={() => handleOpenModal(banner)} className="text-gray-400 hover:text-primary mr-2 p-1" title="수정"><PencilIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleDeleteBanner(banner)} className="text-gray-400 hover:text-red-400 p-1" title="삭제"><TrashIcon className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="text-center p-8 text-gray-500">등록된 배너가 없습니다. '새 배너 추가' 버튼으로 첫 배너를 등록해보세요.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
        <AddEditBannerModal 
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setEditingBanner(null); }}
            onSave={handleSaveBanner}
            banner={editingBanner}
        />
    </>
  );
};

export default AdminDashboard;