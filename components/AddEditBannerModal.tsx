import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Banner } from '../App';
import { PhotoIcon } from './icons';

interface AddEditBannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (
        bannerData: Omit<Banner, 'id' | 'createdAt'>
    ) => Promise<void>;
    banner: Banner | null;
}

const AddEditBannerModal: React.FC<AddEditBannerModalProps> = ({ isOpen, onClose, onSave, banner }) => {
    const [title, setTitle] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [targetAudience, setTargetAudience] = useState<'all' | 'trainer' | 'member'>('all');
    const [imageUrl, setImageUrl] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle(banner?.title || '');
            setLinkUrl(banner?.linkUrl || '');
            setIsActive(banner?.isActive ?? true);
            setTargetAudience(banner?.targetAudience || 'all');
            setImageUrl(banner?.imageUrl || '');
            
            setError('');
            setIsSaving(false);
        }
    }, [isOpen, banner]);

    const handleSave = async () => {
        if (!title.trim()) {
            setError('제목은 필수 항목입니다.');
            return;
        }
        if (!imageUrl.trim()) {
            setError('이미지 URL은 필수 항목입니다.');
            return;
        }
        
        setIsSaving(true);
        setError('');
        
        try {
            await onSave({ title, linkUrl, isActive, targetAudience, imageUrl });
        } catch (e: any) {
            setError(e.message || '저장에 실패했습니다.');
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={banner ? "배너 수정" : "새 배너 추가"}>
            <div className="space-y-4">
                {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-md">{error}</p>}
                
                <div>
                    <label htmlFor="banner-image-url" className="block text-sm font-medium text-gray-300 mb-1">
                        배너 이미지 URL <span className="text-red-400">*</span>
                    </label>
                    <input
                        id="banner-image-url"
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="https://example.com/image.png"
                    />
                </div>

                <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        이미지 미리보기
                    </label>
                    <div className="w-full aspect-[2/1] bg-dark rounded-lg flex items-center justify-center overflow-hidden border border-gray-600">
                        {imageUrl ? (
                             <img 
                                src={imageUrl} 
                                alt="배너 미리보기" 
                                className="w-full h-full object-cover" 
                             />
                        ) : (
                            <div className="text-center text-gray-500">
                                <PhotoIcon className="w-10 h-10 mx-auto"/>
                                <p className="mt-1 text-sm">이미지 URL을 입력하세요</p>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="banner-title" className="block text-sm font-medium text-gray-300 mb-1">
                        제목 <span className="text-red-400">*</span>
                    </label>
                    <input
                        id="banner-title" type="text" value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="예: 여름맞이 PT 할인 이벤트"
                    />
                </div>

                 <div>
                    <label htmlFor="banner-link" className="block text-sm font-medium text-gray-300 mb-1">
                        연결 링크 (선택)
                    </label>
                    <input
                        id="banner-link" type="url" value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="https://example.com/promotion"
                    />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="target-audience" className="block text-sm font-medium text-gray-300 mb-1">노출 대상</label>
                        <select
                            id="target-audience" value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value as any)}
                            className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">전체</option>
                            <option value="trainer">트레이너</option>
                            <option value="member">회원</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">상태</label>
                         <div className="flex items-center justify-between cursor-pointer p-2 bg-dark rounded-lg h-10">
                            <span className="text-sm font-medium text-gray-200">
                                {isActive ? '활성 (대시보드에 노출)' : '비활성'}
                            </span>
                            <div className="relative">
                                <input
                                    type="checkbox" id="is-active-toggle" className="sr-only"
                                    checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                                />
                                <label htmlFor="is-active-toggle" className={`block w-12 h-6 rounded-full cursor-pointer ${isActive ? 'bg-primary' : 'bg-gray-600'}`}></label>
                                <label htmlFor="is-active-toggle" className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform cursor-pointer ${isActive ? 'transform translate-x-6' : ''}`}></label>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                    <button onClick={onClose} disabled={isSaving} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                        취소
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? '저장 중...' : '저장하기'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddEditBannerModal;