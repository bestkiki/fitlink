import React, { useState, useEffect } from 'react';
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

const AddEditHealthArticleModal: React.FC<AddEditHealthArticleModalProps> = ({ isOpen, onClose, onSave, article }) => {
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [image, setImage] = useState('');
    const [category, setCategory] = useState<'workout' | 'diet' | 'recovery' | 'mindset'>('workout');
    const [content, setContent] = useState('');
    
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle(article?.title || '');
            setSummary(article?.summary || '');
            setImage(article?.image || '');
            setCategory(article?.category || 'workout');
            setContent(article?.content.join('\n\n') || '');
            
            setError('');
            setIsSaving(false);
        }
    }, [isOpen, article]);

    const handleSave = async () => {
        if (!title.trim() || !summary.trim() || !image.trim() || !content.trim()) {
            setError('모든 필드는 필수 항목입니다.');
            return;
        }

        setIsSaving(true);
        setError('');
        
        const contentArray = content.split('\n').filter(p => p.trim() !== '');
        
        try {
            await onSave({
                title,
                summary,
                image,
                category,
                content: contentArray,
            });
        } catch (e: any) {
            setError(e.message || '저장에 실패했습니다.');
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={article ? "게시글 수정" : "새 게시글 작성"}>
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
                    <textarea
                        id="article-content"
                        rows={10}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="문단과 문단 사이는 엔터로 구분해주세요."
                    ></textarea>
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
