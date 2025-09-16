
import React, { useState, useEffect } from 'react';
import Modal from './Modal';

// FIX: Added actual component implementation to replace placeholder content.

interface ConsultationRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (message: string) => Promise<void>;
    trainerName: string;
}

const ConsultationRequestModal: React.FC<ConsultationRequestModalProps> = ({ isOpen, onClose, onSend, trainerName }) => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');

    const handleSend = async () => {
        if (!message.trim()) {
            setError('메시지를 입력해주세요.');
            return;
        }

        setIsSending(true);
        setError('');

        try {
            await onSend(message);
        } catch (e: any) {
            setError(e.message || '요청 전송에 실패했습니다.');
            // Only set isSending to false if there's an error, as success will close the modal.
            setIsSending(false);
        }
    };

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setMessage('');
            setIsSending(false);
            setError('');
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${trainerName}님께 상담 요청`}>
            <div className="space-y-4">
                {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-md">{error}</p>}
                
                <div>
                    <label htmlFor="consultation-message" className="block text-sm font-medium text-gray-300 mb-1">
                        문의 내용
                    </label>
                    <textarea
                        id="consultation-message"
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-secondary"
                        placeholder="간단한 자기소개, 운동 목표, 궁금한 점 등을 자유롭게 작성해주세요."
                    ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} disabled={isSending} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                        취소
                    </button>
                    <button onClick={handleSend} disabled={isSending} className="bg-secondary hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSending ? '전송 중...' : '요청 보내기'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConsultationRequestModal;
