
import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { HealthArticle, UserProfile } from '../App';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

interface AddEditHealthArticleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (articleData: Omit<HealthArticle, 'id' | 'createdAt'>) => Promise<void>;
    article: HealthArticle | null;
    userProfile: UserProfile;
    user: firebase.User;
}

const categories = [
    { id: 'workout', name: '운동' },
    { id: 'diet', name: '식단' },
    { id: 'recovery', name: '회복' },
    { id: 'mindset', name: '마인드셋' }
];

// Improved Editor Toolbar with Buttons
const EditorToolbar: React.FC<{ onCommand: (command: string, value?: string) => void }> = ({ onCommand }) => {
    const btnClass = "p-2 h-8 min-w-[32px] flex justify-center items-center rounded hover:bg-gray-600 transition-colors text-sm font-bold border border-gray-600 text-gray-300";
    
    const handleClick = (e: React.MouseEvent, command: string, value?: string) => {
        e.preventDefault(); // Prevent losing focus from editor
        onCommand(command, value);
    };

    return (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-dark border-b border-gray-600 sticky top-0 z-10">
            <button type="button" title="굵게" onClick={(e) => handleClick(e, 'bold')} className={btnClass}>B</button>
            <button type="button" title="기울임" onClick={(e) => handleClick(e, 'italic')} className={`${btnClass} italic`}>I</button>
            <div className="w-px h-6 bg-gray-600 mx-1"></div>
            <button type="button" title="소제목" onClick={(e) => handleClick(e, 'formatBlock', 'H3')} className={btnClass}>H3</button>
            <button type="button" title="본문" onClick={(e) => handleClick(e, 'formatBlock', 'P')} className={btnClass}>P</button>
            <div className="w-px h-6 bg-gray-600 mx-1"></div>
            <button type="button" title="인용구" onClick={(e) => handleClick(e, 'formatBlock', 'BLOCKQUOTE')} className={btnClass}>“ ”</button>
            <button type="button" title="글머리 기호 목록" onClick={(e) => handleClick(e, 'insertUnorderedList')} className={btnClass}>• 목록</button>
            <button type="button" title="번호 매기기 목록" onClick={(e) => handleClick(e, 'insertOrderedList')} className={btnClass}>1. 목록</button>
        </div>
    );
};


const AddEditHealthArticleModal: React.FC<AddEditHealthArticleModalProps> = ({ isOpen, onClose, onSave, article, userProfile, user }) => {
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
            const initialContent = article?.content || '<p><br></p>'; // Default to a paragraph to prevent raw text nodes
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
            editorRef.current.focus();
            setContent(editorRef.current.innerHTML);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError('제목을 입력해주세요.');
            return;
        }
        if (!summary.trim()) {
            setError('요약을 입력해주세요.');
            return;
        }
        if (!image.trim()) {
            setError('이미지 URL을 입력해주세요.');
            return;
        }
        if (!content.trim()) {
            setError('본문을 입력해주세요.');
            return;
        }

        setIsSaving(true);
        setError('');
        
        const isAdmin = userProfile.isAdmin;
        const role = isAdmin ? 'admin' : 'trainer';
        
        let status = article?.status;
        if (!status) {
             if (article) {
                 status = 'approved';
             } else {
                 status = isAdmin ? 'approved' : 'pending';
             }
        }

        try {
            await onSave({
                title,
                summary,
                image,
                category,
                content,
                authorId: article?.authorId || user.uid,
                authorName: article?.authorName || userProfile.name || user.email || 'Unknown',
                authorProfileImageUrl: article?.authorProfileImageUrl || userProfile.profileImageUrl || undefined,
                authorRole: article?.authorRole || role,
                status: status,
            });
        } catch (e: any) {
            setError(e.message || '저장에 실패했습니다.');
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={article ? "게시글 수정" : "새 게시글 작성"}>
            {/* WYSIWYG Editor Styles */}
            <style>{`
                .editor-placeholder[contentEditable=true]:empty:before {
                    content: attr(data-placeholder);
                    color: #6B7280; /* gray-500 */
                    pointer-events: none;
                    display: block; 
                }
                /* Editor WYSIWYG Styles matching Detail Page */
                .editor-content h3 {
                    font-size: 1.25rem; /* 20px */
                    line-height: 1.75rem;
                    font-weight: 700;
                    color: white;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    border-bottom: 1px solid #4B5563; /* gray-600 */
                    padding-bottom: 0.25rem;
                }
                .editor-content p {
                    margin-bottom: 1rem;
                    line-height: 1.6;
                    color: #D1D5DB; /* gray-300 */
                }
                .editor-content blockquote {
                    border-left: 4px solid #14B8A6; /* primary */
                    padding-left: 1rem;
                    margin: 1.5rem 0;
                    color: #D1D5DB; 
                    font-style: italic;
                    background-color: rgba(20, 184, 166, 0.1);
                    padding: 1rem;
                    border-radius: 0.25rem;
                }
                .editor-content ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin-bottom: 1rem;
                    color: #D1D5DB;
                }
                .editor-content ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin-bottom: 1rem;
                    color: #D1D5DB;
                }
                .editor-content li {
                    margin-bottom: 0.25rem;
                }
                .editor-content b, .editor-content strong {
                    color: #14B8A6;
                    font-weight: 700;
                }
            `}</style>
            
            <div className="space-y-4">
                {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-md">{error}</p>}
                {!userProfile.isAdmin && !article && (
                    <div className="bg-blue-500/10 border border-blue-500/50 rounded-md p-3">
                        <p className="text-blue-400 text-sm">
                            작성하신 글은 관리자의 승인 후 게시됩니다. 좋은 정보로 회원들에게 어필해보세요!
                        </p>
                    </div>
                )}
                
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
                        placeholder="리스트에 표시될 짧은 설명입니다."
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
                    <div className="border border-gray-600 rounded-md overflow-hidden flex flex-col">
                        <EditorToolbar onCommand={executeCommand} />
                        <div
                            ref={editorRef}
                            id="article-content"
                            contentEditable={true}
                            onInput={handleContentChange}
                            className="w-full bg-dark p-4 overflow-y-auto focus:outline-none focus:bg-dark-accent/30 editor-content editor-placeholder min-h-[300px]"
                            data-placeholder="내용을 입력하세요. 상단 툴바를 이용해 스타일을 적용할 수 있습니다."
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Tip: 글 작성 시 Enter를 누르면 문단이 나뉩니다. Shift+Enter를 누르면 줄만 바뀝니다.
                    </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} disabled={isSaving} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                        취소
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? '저장 중...' : (userProfile.isAdmin ? '게시하기' : (article ? '수정하기' : '승인 요청하기'))}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddEditHealthArticleModal;
