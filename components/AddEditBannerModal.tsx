import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Banner } from '../App';
import { CameraIcon, PhotoIcon } from './icons';

interface AddEditBannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (
        bannerData: Omit<Banner, 'id' | 'createdAt' | 'imageUrl'>, 
        imageFile?: File | null
    ) => Promise<void>;
    banner: Banner | null;
}

const AddEditBannerModal: React.FC<AddEditBannerModalProps> = ({ isOpen, onClose, onSave, banner }) => {
    const [title, setTitle] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [targetAudience, setTargetAudience] = useState<'all' | 'trainer' | 'member'>('all');
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle(banner?.title || '');
            setLinkUrl(banner?.linkUrl || '');
            setIsActive(banner?.isActive ?? true);
            setTargetAudience(banner?.targetAudience || 'all');
            setImagePreview(banner?.imageUrl || null);
            
            // Reset fields that need it
            setImageFile(null);
            setError('');
            setIsSaving(false);
        }
    }, [isOpen, banner]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('이미지 파일은 5MB를 초과할 수 없습니다.');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError('제목은 필수 항목입니다.');
            return;
        }
        if (!imageFile && !banner) {
            setError('이미지는 필수 항목입니다.');
            return;
        }
        
        setIsSaving(true);
        setError('');
        
        try {
            await onSave({ title, linkUrl, isActive, targetAudience }, imageFile);
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
                    <label htmlFor="banner-image" className="block text-sm font-medium text-gray-300 mb-2">
                        배너 이미지 <span className="text-red-400">*</span>
                         <span className="text-gray-500 ml-2">(권장 비율 2:1, 최대 5MB)</span>
                    </label>
                    <input id="banner-image" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <label htmlFor="banner-image" className="cursor-pointer group relative block w-full aspect-[2/1] bg-dark rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500 hover:border-primary">
                        {imagePreview ? (
                            <img src={imagePreview} alt="배너 미리보기" className="w-full h-full object-cover rounded-md group-hover:opacity-70" />
                        ) : (
                            <div className="text-center">
                                <PhotoIcon className="w-10 h-10 mx-auto"/>
                                <p className="mt-1 text-sm">클릭하여 이미지 업로드</p>
                            </div>
                        )}
                         <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <CameraIcon className="w-8 h-8 text-white" />
                        </div>
                    </label>
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