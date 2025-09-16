
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ShareIcon, ClipboardDocumentIcon, CheckCircleIcon } from './icons';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainerId: string;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, trainerId }) => {
    const [inviteLink, setInviteLink] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Construct the full URL based on the current window location
            const link = `${window.location.origin}/signup/${trainerId}`;
            setInviteLink(link);
            setIsCopied(false); // Reset copied state when modal re-opens
        }
    }, [isOpen, trainerId]);

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('링크 복사에 실패했습니다.');
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="회원 초대하기">
            <div className="space-y-4 text-center">
                <ShareIcon className="w-16 h-16 mx-auto text-primary" />
                <h3 className="text-lg font-semibold text-white">회원 초대 링크</h3>
                <p className="text-gray-400 text-sm">
                    아래 링크를 복사하여 회원에게 전달하세요.
                    <br />
                    회원이 링크를 통해 가입하면 자동으로 회원님의 담당 회원으로 등록됩니다.
                </p>
                <div className="flex items-center bg-dark p-2 rounded-lg border border-gray-600">
                    <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="w-full bg-transparent text-gray-300 focus:outline-none"
                    />
                    <button
                        onClick={handleCopyToClipboard}
                        className="flex-shrink-0 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-3 rounded-lg transition-colors flex items-center space-x-2"
                    >
                        {isCopied ? (
                            <>
                                <CheckCircleIcon className="w-5 h-5" />
                                <span>복사됨!</span>
                            </>
                        ) : (
                            <>
                                <ClipboardDocumentIcon className="w-5 h-5" />
                                <span>복사</span>
                            </>
                        )}
                    </button>
                </div>
                <div className="pt-4">
                     <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        닫기
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default InviteMemberModal;
