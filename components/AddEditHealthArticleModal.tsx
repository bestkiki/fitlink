import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { HealthArticle } from '../pages/AdminDashboard';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

interface AddEditHealthArticleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (articleData: Omit<HealthArticle, 'id' | 'createdAt'>) => Promise<void>;
    article: HealthArticle | null;
}

const categories = [
    { id: 'workout', name: '운동' },
    { id: 'diet', name: '식단' },
    { id: 'recovery', name: '회복' },
    { id: 'mindset', name: '마인드셋' }
];

const EditorToolbar: React.FC<{ onCommand: (command: string, value?: string) => void }> = ({ onCommand }) => {
    return (
        <div className="flex items-center space-x-2 p-2 bg-dark border-b border-gray-600">
            <button type="button" title="굵게" onClick={() => onCommand('bold')} className="p-2 w-10 h-10 flex justify-center items-center hover:bg-dark-accent rounded font-bold">B</button>
            <select onChange={(e) => onCommand('formatBlock', e.target.value)} className="bg-dark text-white p-2 rounded border border-gray-500 focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="p">본문</option>
                <option value="h3">소제목</option>
                <option value="blockquote">인용</option>
            </select>
        </div>
    );
};


const AddEditHealthArticleModal: React.FC<AddEditHealthArticleModalProps> = ({ isOpen, onClose, onSave, article }) => {
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [image, setImage] = useState('');
    const [category, setCategory] = useState<'workout' | 'diet' | 'recovery' | 'mindset'>('workout');
    const [content, setContent] = useState('');
    const editorRef = useRef<HTMLDivElement>(null);
    
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle(article?.title || '');
            setSummary(article?.summary || '');
            setImage(article?.image || '');
            setCategory(article?.category || 'workout');
            const initialContent = article?.content || '';
            setContent(initialContent);

            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.innerHTML = initialContent;
                }
            }, 0);
            
            setError('');
            setIsSaving(false);
        }
    }, [isOpen, article]);

    const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
        setContent(e.currentTarget.innerHTML);
    };

    const executeCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            setContent(editorRef.current.innerHTML);
            editorRef.current.focus();
        }
    };

    const handleSave = async () => {
        if (!title.trim() || !summary.trim() || !image.trim() || !content.trim()) {
            setError('모든 필드는 필수 항목입니다.');
            return;
        }

        setIsSaving(true);
        setError('');
        
        try {
            await onSave({
                title,
                summary,
                image,
                category,
                content,
            });
        } catch (e: any) {
            setError(e.message || '저장에 실패했습니다.');
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={article ? "게시글 수정" : "새 게시글 작성"}>
            <style>{`
                .editor-placeholder[contentEditable=true]:empty:before {
                    content: attr(data-placeholder);
                    color: #6B7280; /* gray-500 */
                    pointer-events: none;
                    display: block; /* For Firefox */
                }
            `}</style>
            <div className="space-y-4">
                {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-md">{error}</p>}
                
                <div>
                    <label htmlFor="article-title" className="block text-sm font-medium text-gray-300 mb-1">
                        제목 <span className="text-red-400">*</span>
                    </label>
                    <input
                        id="article-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                
                <div>
                    <label htmlFor="article-summary" className="block text-sm font-medium text-gray-300 mb-1">
                        요약 <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        id="article-summary"
                        rows={2}
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                    ></textarea>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="article-image" className="block text-sm font-medium text-gray-300 mb-1">
                            이미지 URL <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="article-image"
                            type="url"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="article-category" className="block text-sm font-medium text-gray-300 mb-1">
                            카테고리 <span className="text-red-400">*</span>
                        </label>
                        <select
                            id="article-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value as any)}
                            className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary h-[42px]"
                        >
                           {categories.map(cat => (
                               <option key={cat.id} value={cat.id}>{cat.name}</option>
                           ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="article-content" className="block text-sm font-medium text-gray-300 mb-1">
                        본문 <span className="text-red-400">*</span>
                    </label>
                    <div className="border border-gray-600 rounded-md">
                        <EditorToolbar onCommand={executeCommand} />
                        <div
                            ref={editorRef}
                            id="article-content"
                            contentEditable={true}
                            onInput={handleContentChange}
                            className="w-full bg-dark p-3 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-primary rounded-b-md editor-placeholder"
                            // FIX: Replaced the invalid 'placeholder' attribute with a valid 'data-placeholder' attribute to fix the TypeScript error. The CSS has been updated to use this data attribute for the placeholder effect.
                            data-placeholder="본문 내용을 입력하세요..."
                            style={{ minHeight: '256px' }}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} disabled={isSaving} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                        취소
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? '저장 중...' : '저장하기'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddEditHealthArticleModal;