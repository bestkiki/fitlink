import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface AskQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { title: string, content: string }) => Promise<void>;
}

const AskQuestionModal: React.FC<AskQuestionModalProps> = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setContent('');
            setError('');
            setIsSaving(false);
        }
    }, [isOpen]);

    const handleSave = async () => {
        if (!title.trim()) {
            setError('제목을 입력해주세요.');
            return;
        }
        if (!content.trim()) {
            setError('질문 내용을 입력해주세요.');
            return;
        }

        setIsSaving(true);
        setError('');
        try {
            await onSave({ title, content });
        } catch (e: any) {
            setError(e.message || '질문 등록에 실패했습니다.');
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="새 질문하기">
            <div className="space-y-4">
                {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-md">{error}</p>}
                <div>
                    <label htmlFor="qna-title" className="block text-sm font-medium text-gray-300 mb-1">
                        질문 제목 <span className="text-red-400">*</span>
                    </label>
                    <input
                        id="qna-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="궁금한 점을 한 문장으로 요약해주세요."
                    />
                </div>
                <div>
                    <label htmlFor="qna-content" className="block text-sm font-medium text-gray-300 mb-1">
                        질문 내용 <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        id="qna-content"
                        rows={8}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="자세한 상황이나 궁금한 점을 구체적으로 작성해주시면 더 좋은 답변을 받을 수 있습니다."
                    ></textarea>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} disabled={isSaving} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                        취소
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? '등록 중...' : '질문 등록하기'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AskQuestionModal;