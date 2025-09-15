import React from 'react';
import Modal from './Modal';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
    memberName: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, isDeleting, memberName }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="회원 삭제 확인">
            <div className="text-gray-300">
                <p>
                    정말로 <span className="font-bold text-secondary">{memberName}</span> 회원을 삭제하시겠습니까?
                </p>
                <p className="mt-2 text-sm text-gray-400">
                    이 작업은 되돌릴 수 없으며, 해당 회원의 모든 정보가 영구적으로 삭제됩니다.
                </p>
            </div>
            <div className="flex justify-end space-x-3 pt-6">
                <button onClick={onClose} disabled={isDeleting} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                    취소
                </button>
                <button onClick={onConfirm} disabled={isDeleting} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isDeleting ? '삭제 중...' : '삭제'}
                </button>
            </div>
        </Modal>
    );
};

export default DeleteConfirmationModal;
