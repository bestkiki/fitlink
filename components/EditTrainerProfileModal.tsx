import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { UserProfile } from '../App';

interface EditTrainerProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (profileData: Partial<UserProfile>) => Promise<void>;
    userProfile: UserProfile;
}

const EditTrainerProfileModal: React.FC<EditTrainerProfileModalProps> = ({ isOpen, onClose, onSave, userProfile }) => {
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [career, setCareer] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name || '');
            setContact(userProfile.contact || '');
            setSpecialization(userProfile.specialization || '');
            setCareer(userProfile.career || '');
        }
        setError('');
        setIsSaving(false);
    }, [userProfile, isOpen]);

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
            });
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
