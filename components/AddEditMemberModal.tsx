import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Member } from '../pages/TrainerDashboard';

interface AddEditMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (memberData: Omit<Member, 'id' | 'email'>) => void;
    member: Member | null;
}

const AddEditMemberModal: React.FC<AddEditMemberModalProps> = ({ isOpen, onClose, onSave, member }) => {
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [goal, setGoal] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (member) {
            setName(member.name || '');
            setContact(member.contact || '');
            setGoal(member.goal || '');
            setNotes(member.notes || '');
        } else {
            // Reset form
            setName('');
            setContact('');
            setGoal('');
            setNotes('');
        }
        setError('');
    }, [member, isOpen]);

    const handleSave = () => {
        if (!name.trim()) {
            setError('이름은 필수 항목입니다.');
            return;
        }
        if (!member) return;

        onSave({
            name,
            contact,
            goal,
            notes,
        });
    };

    if (!member) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={member.name ? '회원 정보 수정' : '회원 정보 추가'}>
            <div className="space-y-4">
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">이메일 (수정 불가)</label>
                    <input
                        type="email"
                        id="email"
                        value={member.email}
                        readOnly
                        className="w-full bg-dark p-2 rounded-md text-gray-500 border border-gray-600 cursor-not-allowed"
                    />
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">이름 <span className="text-red-400">*</span></label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="contact" className="block text-sm font-medium text-gray-300 mb-1">연락처</label>
                    <input
                        type="tel"
                        id="contact"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="예: 010-1234-5678"
                    />
                </div>
                 <div>
                    <label htmlFor="goal" className="block text-sm font-medium text-gray-300 mb-1">운동 목표</label>
                    <textarea
                        id="goal"
                        rows={3}
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="예: 체지방 5kg 감량, 3대 운동 300kg 달성"
                    ></textarea>
                </div>
                 <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">트레이너 메모</label>
                    <textarea
                        id="notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="회원에 대한 특이사항을 기록하세요 (비공개)"
                    ></textarea>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        취소
                    </button>
                    <button onClick={handleSave} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        저장
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddEditMemberModal;
