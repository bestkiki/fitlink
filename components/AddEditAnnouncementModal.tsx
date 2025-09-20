import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Announcement } from '../App';

interface AddEditAnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { title: string, content: string }) => Promise<void>;
    announcement: Announcement | null;
}

const AddEditAnnouncementModal: React.FC<AddEditAnnouncementModalProps> = ({ isOpen, onClose, onSave, announcement }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle(announcement?.title || '');
            setContent(announcement?.content || '');
            setError('');
            setIsSaving(false);
        }
    }, [isOpen, announcement]);

    const handleSave = async () => {
        if (!title.trim()) {
            setError('제목을 입력해주세요.');
            return;
        }
        if (!content.trim()) {
            setError('내용을 입력해주세요.');
            return;
        }

        setIsSaving(true);
        setError('');
        try {
            await onSave({ title, content });
        } catch (e: any) {
            setError(e.message || '저장에 실패했습니다.');
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={announcement ? "공지사항 수정" : "새 공지사항 작성"}>
            <div className="space-y-4">
                {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-md">{error}</p>}
                <div>
                    <label htmlFor="ann-title" className="block text-sm font-medium text-gray-300 mb-1">
                        제목 <span className="text-red-400">*</span>
                    </label>
                    <input
                        id="ann-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="공지사항 제목"
                    />
                </div>
                <div>
                    <label htmlFor="ann-content" className="block text-sm font-medium text-gray-300 mb-1">
                        내용 <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        id="ann-content"
                        rows={8}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="회원들에게 전달할 내용을 입력하세요."
                    ></textarea>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} disabled={isSaving} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                        취소
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? '저장 중...' : (announcement ? '수정하기' : '게시하기')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddEditAnnouncementModal;
