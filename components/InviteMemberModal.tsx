import React, { useState } from 'react';
import Modal from './Modal';
import { ClipboardDocumentIcon } from './icons';

interface ShareProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainerId: string;
}

const ShareProfileModal: React.FC<ShareProfileModalProps> = ({ isOpen, onClose, trainerId }) => {
    const [copiedLink, setCopiedLink] = useState<'invite' | 'profile' | null>(null);
    
    const inviteLink = `${window.location.origin}/signup/${trainerId}`;
    const profileLink = `${window.location.origin}/coach/${trainerId}`;

    const handleCopy = (linkType: 'invite' | 'profile') => {
        const linkToCopy = linkType === 'invite' ? inviteLink : profileLink;
        navigator.clipboard.writeText(linkToCopy)
            .then(() => {
                setCopiedLink(linkType);
                setTimeout(() => setCopiedLink(null), 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                alert('링크 복사에 실패했습니다.');
            });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="초대 및 공유">
            <div className="space-y-6">
                <div>
                    <h4 className="font-semibold text-gray-200 mb-2">회원 초대 링크</h4>
                    <p className="text-sm text-gray-400 mb-2">
                        회원에게 이 링크를 보내 가입하게 하세요. 가입 즉시 회원님의 목록에 추가됩니다.
                    </p>
                    <div className="flex items-center space-x-2 bg-dark p-3 rounded-lg border border-gray-600">
                        <input type="text" value={inviteLink} readOnly className="w-full bg-transparent text-gray-400 outline-none"/>
                        <button onClick={() => handleCopy('invite')} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-3 rounded-lg transition-colors flex-shrink-0 text-sm">
                            {copiedLink === 'invite' ? '복사됨!' : '복사'}
                        </button>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-gray-200 mb-2">공개 프로필 링크</h4>
                     <p className="text-sm text-gray-400 mb-2">
                        SNS나 메시지로 프로필을 공유하여 자신을 홍보하고 새로운 회원을 유치하세요.
                    </p>
                    <div className="flex items-center space-x-2 bg-dark p-3 rounded-lg border border-gray-600">
                        <input type="text" value={profileLink} readOnly className="w-full bg-transparent text-gray-400 outline-none"/>
                        <button onClick={() => handleCopy('profile')} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-3 rounded-lg transition-colors flex-shrink-0 text-sm">
                            {copiedLink === 'profile' ? '복사됨!' : '복사'}
                        </button>
                    </div>
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

export default ShareProfileModal;