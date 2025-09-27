import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { UserProfile } from '../App';

interface ConsultationRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (message: string, requestType: 'consultation' | 'assignment', contact?: string, time?: string) => Promise<void>;
    trainerName: string;
    currentUserProfile: UserProfile | null;
}

const ConsultationRequestModal: React.FC<ConsultationRequestModalProps> = ({ isOpen, onClose, onSend, trainerName, currentUserProfile }) => {
    const [message, setMessage] = useState('');
    const [contact, setContact] = useState('');
    const [preferredTime, setPreferredTime] = useState('');
    const [requestType, setRequestType] = useState<'consultation' | 'assignment'>('consultation');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setMessage('');
            setContact(currentUserProfile?.contact || '');
            setPreferredTime('');
            setRequestType('consultation');
            setIsSending(false);
            setError('');
        }
    }, [isOpen, currentUserProfile]);

    const handleSend = async () => {
        if (!message.trim()) {
            setError('문의 내용을 입력해주세요.');
            return;
        }

        setIsSending(true);
        setError('');

        try {
            await onSend(message, requestType, contact, preferredTime);
        } catch (e: any) {
            setError(e.message || '요청 전송에 실패했습니다.');
            setIsSending(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${trainerName}님께 요청 보내기`}>
            <div className="space-y-4">
                {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-md">{error}</p>}
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">요청 종류</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <label className={`flex-1 flex items-center p-3 rounded-lg cursor-pointer border-2 transition-colors ${requestType === 'consultation' ? 'border-secondary bg-secondary/10' : 'border-gray-600 bg-dark hover:bg-dark-accent'}`}>
                            <input type="radio" name="requestType" value="consultation" checked={requestType === 'consultation'} onChange={() => setRequestType('consultation')} className="h-4 w-4 text-secondary bg-dark border-gray-500 focus:ring-secondary"/>
                            <span className="ml-3 text-sm font-medium text-gray-200">일반 상담 요청</span>
                        </label>
                         <label className={`flex-1 flex items-center p-3 rounded-lg cursor-pointer border-2 transition-colors ${requestType === 'assignment' ? 'border-secondary bg-secondary/10' : 'border-gray-600 bg-dark hover:bg-dark-accent'}`}>
                            <input type="radio" name="requestType" value="assignment" checked={requestType === 'assignment'} onChange={() => setRequestType('assignment')} className="h-4 w-4 text-secondary bg-dark border-gray-500 focus:ring-secondary"/>
                            <span className="ml-3 text-sm font-medium text-gray-200">담당 트레이너로 지정 요청</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label htmlFor="consultation-message" className="block text-sm font-medium text-gray-300 mb-1">
                        문의 내용 <span className="text-red-400">*</span>
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
                
                <div>
                    <label htmlFor="contact-info" className="block text-sm font-medium text-gray-300 mb-1">
                        연락처 (선택)
                    </label>
                    <input
                        id="contact-info"
                        type="text"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-secondary"
                        placeholder="예: 010-1234-5678"
                    />
                </div>

                <div>
                    <label htmlFor="preferred-time" className="block text-sm font-medium text-gray-300 mb-1">
                        희망 상담 시간 (선택)
                    </label>
                    <input
                        id="preferred-time"
                        type="text"
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-secondary"
                        placeholder="예: 평일 저녁 7시 이후"
                    />
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