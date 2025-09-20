import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Challenge } from '../App';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

interface AddEditChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (challengeData: Omit<Challenge, 'id' | 'createdAt' | 'participantCount'>) => Promise<void>;
    challenge: Challenge | null;
    trainerId: string;
}

const AddEditChallengeModal: React.FC<AddEditChallengeModalProps> = ({ isOpen, onClose, onSave, challenge, trainerId }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const today = new Date().toISOString().split('T')[0];
            const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            setTitle(challenge?.title || '');
            setDescription(challenge?.description || '');
            setStartDate(challenge?.startDate ? challenge.startDate.toDate().toISOString().split('T')[0] : today);
            setEndDate(challenge?.endDate ? challenge.endDate.toDate().toISOString().split('T')[0] : nextWeek);
            
            setError('');
            setIsSaving(false);
        }
    }, [isOpen, challenge]);

    const handleSave = async () => {
        if (!title.trim() || !startDate || !endDate) {
            setError('제목과 기간은 필수 항목입니다.');
            return;
        }
        if (new Date(startDate) >= new Date(endDate)) {
            setError('종료일은 시작일보다 이후여야 합니다.');
            return;
        }

        setIsSaving(true);
        setError('');
        
        try {
            await onSave({
                trainerId,
                title,
                description,
                startDate: firebase.firestore.Timestamp.fromDate(new Date(startDate)),
                endDate: firebase.firestore.Timestamp.fromDate(new Date(endDate)),
            });
        } catch (e: any) {
            setError(e.message || '저장에 실패했습니다.');
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={challenge ? "챌린지 수정" : "새 챌린지 만들기"}>
            <div className="space-y-4">
                {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-md">{error}</p>}
                
                <div>
                    <label htmlFor="challenge-title" className="block text-sm font-medium text-gray-300 mb-1">
                        챌린지 제목 <span className="text-red-400">*</span>
                    </label>
                    <input
                        id="challenge-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="예: 30일 스쿼트 챌린지"
                    />
                </div>

                <div>
                    <label htmlFor="challenge-desc" className="block text-sm font-medium text-gray-300 mb-1">
                        설명
                    </label>
                    <textarea
                        id="challenge-desc"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="챌린지 목표, 규칙, 보상 등을 설명해주세요."
                    ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-300 mb-1">시작일</label>
                        <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600" />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-300 mb-1">종료일</label>
                        <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600" />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} disabled={isSaving} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                        취소
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? '저장 중...' : (challenge ? '수정하기' : '만들기')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddEditChallengeModal;