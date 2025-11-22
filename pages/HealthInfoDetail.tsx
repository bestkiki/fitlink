
import React, { useEffect } from 'react';
import { ArrowLeftIcon, UserCircleIcon } from '../components/icons';
import { HealthArticle } from '../App';

interface HealthInfoDetailProps {
    article: HealthArticle;
    onBack: () => void;
}

const HealthInfoDetail: React.FC<HealthInfoDetailProps> = ({ article, onBack }) => {
    useEffect(() => {
        // Store the original title and meta description
        const originalTitle = document.title;
        const metaDescription = document.querySelector('meta[name="description"]');
        const originalDescription = metaDescription ? metaDescription.getAttribute('content') : '';

        // Update the title and meta description for the current article
        document.title = `${article.title} | FitLink`;
        if (metaDescription) {
            metaDescription.setAttribute('content', article.summary);
        }

        // Cleanup function to restore original values when the component unmounts
        return () => {
            document.title = originalTitle;
            if (metaDescription && originalDescription) {
                metaDescription.setAttribute('content', originalDescription);
            }
        };
    }, [article]);

    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center space-x-2 text-primary mb-8 hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>목록으로 돌아가기</span>
            </button>

            <article className="max-w-3xl mx-auto bg-dark-accent rounded-xl shadow-xl overflow-hidden">
                <img src={article.image} alt={article.title} className="w-full h-64 md:h-80 object-cover" />
                <div className="p-8">
                    <div className="flex items-center space-x-2 mb-4 text-sm text-gray-400">
                        <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase text-xs font-bold">{article.category}</span>
                        <span>•</span>
                        <span>{article.createdAt?.toDate().toLocaleDateString('ko-KR')}</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">{article.title}</h1>
                    
                    <p className="text-xl text-gray-300 mb-8 leading-relaxed border-l-4 border-primary pl-4 italic">{article.summary}</p>

                    <div
                        className="health-info-content text-gray-300 leading-relaxed text-lg"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                    
                    {/* Author Promotion Section */}
                    <div className="mt-12 pt-8 border-t border-gray-700">
                        <p className="text-sm text-gray-500 mb-4 font-semibold">Written by</p>
                        <div className="flex items-center justify-between bg-dark p-4 rounded-lg border border-gray-700 hover:border-primary/50 transition-colors">
                            <div className="flex items-center space-x-4">
                                {article.authorProfileImageUrl ? (
                                    <img src={article.authorProfileImageUrl} alt={article.authorName} className="w-16 h-16 rounded-full object-cover border-2 border-gray-600" />
                                ) : (
                                    <UserCircleIcon className="w-16 h-16 text-gray-500" />
                                )}
                                <div>
                                    <h3 className="text-lg font-bold text-white">{article.authorName}</h3>
                                    <p className="text-sm text-gray-400">{article.authorRole === 'trainer' ? '전문 트레이너' : 'FitLink 에디터'}</p>
                                </div>
                            </div>
                            {article.authorRole === 'trainer' && (
                                <a 
                                    href={`/coach/${article.authorId}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                                >
                                    프로필 보기
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </article>
            <style>{`
                .health-info-content h3 {
                    font-size: 1.5rem; /* 24px */
                    line-height: 2rem; /* 32px */
                    font-weight: 700;
                    color: white;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                    border-bottom: 1px solid #4B5563; /* gray-600 */
                    padding-bottom: 0.5rem;
                }
                .health-info-content p {
                    margin-bottom: 1.5rem;
                }
                .health-info-content blockquote {
                    border-left: 4px solid #14B8A6; /* primary */
                    padding-left: 1rem;
                    margin: 1.5rem 0;
                    color: #D1D5DB; /* gray-300 */
                    font-style: italic;
                    background-color: rgba(20, 184, 166, 0.1);
                    padding: 1rem;
                    border-radius: 0.25rem;
                }
                .health-info-content strong, .health-info-content b {
                    color: #14B8A6; /* primary */
                    font-weight: 600;
                }
                .health-info-content ul, .health-info-content ol {
                    margin-bottom: 1.5rem;
                    padding-left: 1.5rem;
                    list-style-type: disc;
                }
                .health-info-content li {
                    margin-bottom: 0.5rem;
                }
            `}</style>
        </div>
    );
};

export default HealthInfoDetail;
