import React, { useState } from 'react';
import Modal from './Modal';
import { ShareIcon } from './icons';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainerId: string;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, trainerId }) => {
    const [copied, setCopied] = useState(false);
    const inviteLink = `${window.location.origin}/signup/${trainerId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                alert('링크 복사에 실패했습니다.');
            });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="회원 초대하기">
            <div className="space-y-4">
                <p className="text-gray-300">
                    아래 링크를 회원에게 공유하세요. 회원이 이 링크를 통해 가입하면 자동으로 회원님의 목록에 추가됩니다.
                </p>
                <div className="flex items-center space-x-2 bg-dark p-3 rounded-lg border border-gray-600">
                    <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="w-full bg-transparent text-gray-400 outline-none"
                    />
                    <button
                        onClick={handleCopy}
                        className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors flex-shrink-0"
                    >
                        {copied ? '복사됨!' : '복사'}
                    </button>
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        닫기
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default InviteMemberModal;
