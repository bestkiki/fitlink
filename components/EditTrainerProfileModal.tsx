import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { UserProfile } from '../App';
import { CameraIcon, UserCircleIcon } from './icons';

interface EditTrainerProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (profileData: Partial<UserProfile>, profileImageFile?: File | null, promoImageFile?: File | null) => Promise<void>;
    userProfile: UserProfile;
}

const EditTrainerProfileModal: React.FC<EditTrainerProfileModalProps> = ({ isOpen, onClose, onSave, userProfile }) => {
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [career, setCareer] = useState('');
    const [gymName, setGymName] = useState('');
    const [gymAddress, setGymAddress] = useState('');
    
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
    const [promoImageFile, setPromoImageFile] = useState<File | null>(null);
    const [promoImagePreview, setPromoImagePreview] = useState<string | null>(null);

    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name || '');
            setContact(userProfile.contact || '');
            setSpecialization(userProfile.specialization || '');
            setCareer(userProfile.career || '');
            setGymName(userProfile.gymName || '');
            setGymAddress(userProfile.gymAddress || '');
            setProfileImagePreview(userProfile.profileImageUrl || null);
            setPromoImagePreview(userProfile.promoImageUrl || null);
        }
        // Reset file inputs and errors on open
        setProfileImageFile(null);
        setPromoImageFile(null);
        setError('');
        setIsSaving(false);
    }, [userProfile, isOpen]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'promo') => {
        const file = e.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            if (type === 'profile') {
                setProfileImageFile(file);
                setProfileImagePreview(previewUrl);
            } else {
                setPromoImageFile(file);
                setPromoImagePreview(previewUrl);
            }
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setError('이름은 필수 항목입니다.');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            await onSave({
                name,
                contact,
                specialization,
                career,
                gymName,
                gymAddress,
            }, profileImageFile, promoImageFile);
        } catch (e: any) {
            setError(e.message || '저장에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="내 프로필 수정">
            <div className="space-y-4">
                {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-md">{error}</p>}
                
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    {/* Profile Image Upload */}
                    <div className="flex-shrink-0">
                        <label htmlFor="profile-image-upload" className="cursor-pointer group relative">
                            {profileImagePreview ? (
                                <img src={profileImagePreview} alt="프로필 미리보기" className="w-24 h-24 rounded-full object-cover border-2 border-gray-600 group-hover:opacity-70" />
                            ) : (
                                <UserCircleIcon className="w-24 h-24 text-gray-500 group-hover:opacity-70" />
                            )}
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <CameraIcon className="w-8 h-8 text-white" />
                            </div>
                        </label>
                        <input id="profile-image-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'profile')} />
                    </div>
                    {/* Name and Contact */}
                    <div className="w-full space-y-4">
                        <div>
                            <label htmlFor="trainer-name" className="block text-sm font-medium text-gray-300 mb-1">이름 <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                id="trainer-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="trainer-contact" className="block text-sm font-medium text-gray-300 mb-1">연락처</label>
                            <input
                                type="tel"
                                id="trainer-contact"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="예: 010-1234-5678"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="trainer-gym-name" className="block text-sm font-medium text-gray-300 mb-1">지점명</label>
                        <input
                            type="text"
                            id="trainer-gym-name"
                            value={gymName}
                            onChange={(e) => setGymName(e.target.value)}
                            className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="예: FitLink 강남점"
                        />
                    </div>
                    <div>
                        <label htmlFor="trainer-gym-address" className="block text-sm font-medium text-gray-300 mb-1">지점 위치</label>
                        <input
                            type="text"
                            id="trainer-gym-address"
                            value={gymAddress}
                            onChange={(e) => setGymAddress(e.target.value)}
                            className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="예: 서울특별시 강남구"
                        />
                    </div>
                </div>

                {/* Promo Image Upload */}
                <div>
                    <label htmlFor="promo-image-upload" className="block text-sm font-medium text-gray-300 mb-1">홍보 프로필 소개 이미지</label>
                    <p className="text-xs text-gray-500 mb-2">모바일 화면에 최적화된 세로형 이미지를 권장합니다. (9:16 비율)</p>
                     <label htmlFor="promo-image-upload" className="cursor-pointer group relative block w-full aspect-[9/16] max-w-xs mx-auto bg-dark rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500 hover:border-primary">
                        {promoImagePreview ? (
                            <img src={promoImagePreview} alt="홍보 이미지 미리보기" className="w-full h-full object-cover rounded-md group-hover:opacity-70" />
                        ) : (
                            <div className="text-center">
                                <CameraIcon className="w-10 h-10 mx-auto"/>
                                <p className="mt-1 text-sm">클릭하여 이미지 업로드</p>
                            </div>
                        )}
                         <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <CameraIcon className="w-8 h-8 text-white" />
                            </div>
                    </label>
                    <input id="promo-image-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'promo')} />
                </div>
                 
                 <div>
                    <label htmlFor="specialization" className="block text-sm font-medium text-gray-300 mb-1">전문 분야</label>
                    <textarea
                        id="specialization"
                        rows={2}
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="예: 다이어트, 근력 증가, 재활 운동"
                    ></textarea>
                </div>
                 <div>
                    <label htmlFor="career" className="block text-sm font-medium text-gray-300 mb-1">주요 경력</label>
                    <textarea
                        id="career"
                        rows={3}
                        value={career}
                        onChange={(e) => setCareer(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="자격증, 수상 경력, 근무 경력 등을 입력하세요."
                    ></textarea>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} disabled={isSaving} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                        취소
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EditTrainerProfileModal;
