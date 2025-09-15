import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { UserProfile } from '../App';

interface EditMyProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (profileData: Partial<UserProfile>) => Promise<void>;
    userProfile: UserProfile;
}

const EditMyProfileModal: React.FC<EditMyProfileModalProps> = ({ isOpen, onClose, onSave, userProfile }) => {
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [goal, setGoal] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name || '');
            setContact(userProfile.contact || '');
            setGoal(userProfile.goal || '');
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
                goal,
            });
        } catch (e: any) {
            setError(e.message || '저장에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="내 정보 수정">
            <div className="space-y-4">
                {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-md">{error}</p>}
                
                <div>
                    <label htmlFor="member-name" className="block text-sm font-medium text-gray-300 mb-1">이름 <span className="text-red-400">*</span></label>
                    <input
                        type="text"
                        id="member-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="member-contact" className="block text-sm font-medium text-gray-300 mb-1">연락처</label>
                    <input
                        type="tel"
                        id="member-contact"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="예: 010-1234-5678"
                    />
                </div>
                 <div>
                    <label htmlFor="member-goal" className="block text-sm font-medium text-gray-300 mb-1">운동 목표</label>
                    <textarea
                        id="member-goal"
                        rows={3}
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="예: 체지방 5kg 감량, 3대 운동 300kg 달성"
                    ></textarea>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} disabled={isSaving} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                        취소
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-secondary hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EditMyProfileModal;
