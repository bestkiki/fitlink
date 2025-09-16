import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import firebase from 'firebase/compat/app';
import { db } from '../firebase';
import { ConsultationRequest } from '../App';
import { ClockIcon, CheckCircleIcon, TrashIcon, EnvelopeIcon } from './icons';

interface ConsultationRequestsModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainerId: string;
}

const ConsultationRequestsModal: React.FC<ConsultationRequestsModalProps> = ({ isOpen, onClose, trainerId }) => {
    const [requests, setRequests] = useState<ConsultationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);
        const unsubscribe = db.collection('users').doc(trainerId).collection('consultationRequests')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConsultationRequest));
                setRequests(requestsData);
                setLoading(false);
            }, err => {
                console.error("Error fetching consultation requests:", err);
                setError('요청을 불러오는 데 실패했습니다.');
                setLoading(false);
            });

        return () => unsubscribe();
    }, [isOpen, trainerId]);
    
    const handleUpdateRequest = async (requestId: string, status: 'confirmed' | 'deleted') => {
        const requestRef = db.collection('users').doc(trainerId).collection('consultationRequests').doc(requestId);
        try {
            if (status === 'confirmed') {
                await requestRef.update({ status: 'confirmed' });
            } else if (status === 'deleted') {
                await requestRef.delete();
            }
        } catch (err) {
            console.error(`Error updating request to ${status}:`, err);
            alert('요청 상태 변경에 실패했습니다.');
        }
    };
    
    const timeSince = (date: firebase.firestore.Timestamp | undefined): string => {
        if (!date) return '';
        const seconds = Math.floor((new Date().getTime() - date.toDate().getTime()) / 1000);
        let interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "일 전";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "시간 전";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "분 전";
        return "방금 전";
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="상담 요청 목록">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {loading && <p className="text-center text-gray-400">요청 목록을 불러오는 중...</p>}
                {error && <p className="text-center text-red-400">{error}</p>}
                {!loading && requests.length === 0 && (
                    <div className="text-center py-8">
                        <EnvelopeIcon className="w-12 h-12 mx-auto text-gray-600" />
                        <p className="mt-4 text-gray-400">받은 상담 요청이 없습니다.</p>
                    </div>
                )}
                {requests.map(req => (
                    <div key={req.id} className={`p-4 rounded-lg transition-colors ${req.status === 'pending' ? 'bg-dark shadow-md' : 'bg-dark/50'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-white">{req.memberName}</p>
                                <p className="text-sm text-gray-400">{req.memberEmail}</p>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                            }`}>{req.status === 'pending' ? 'new' : 'confirmed'}</span>
                        </div>
                        <p className="mt-3 text-gray-300 bg-dark-accent p-3 rounded-md whitespace-pre-wrap">{req.message}</p>
                        <div className="mt-2 text-sm text-gray-400 space-y-1 border-t border-gray-700/50 pt-2">
                            {req.memberContact && <p><strong>연락처:</strong> {req.memberContact}</p>}
                            {req.preferredTime && <p><strong>희망 시간:</strong> {req.preferredTime}</p>}
                        </div>
                        <div className="flex justify-between items-center mt-3">
                            <p className="text-xs text-gray-500 flex items-center">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                {timeSince(req.createdAt)}
                            </p>
                            <div className="flex space-x-2">
                                {req.status === 'pending' && (
                                    <button onClick={() => handleUpdateRequest(req.id, 'confirmed')} className="p-1.5 rounded-full hover:bg-green-500/20" title="확인됨으로 표시">
                                        <CheckCircleIcon className="w-5 h-5 text-green-400"/>
                                    </button>
                                )}
                                 <button 
                                    onClick={() => {
                                        if (window.confirm('정말로 이 요청을 삭제하시겠습니까?')) {
                                            handleUpdateRequest(req.id, 'deleted');
                                        }
                                    }} 
                                    className="p-1.5 rounded-full hover:bg-red-500/20" 
                                    title="요청 삭제"
                                >
                                    <TrashIcon className="w-5 h-5 text-red-400"/>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Modal>
    );
};

export default ConsultationRequestsModal;