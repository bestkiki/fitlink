import React from 'react';
import { ArrowLeftIcon } from '../components/icons';
import { Article } from './HealthInfoPage'; // Import the updated type

interface HealthInfoDetailProps {
    article: Article;
    onBack: () => void;
}

const HealthInfoDetail: React.FC<HealthInfoDetailProps> = ({ article, onBack }) => {
    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center space-x-2 text-primary mb-8 hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>목록으로 돌아가기</span>
            </button>

            <article className="max-w-3xl mx-auto">
                <img src={article.image} alt={article.title} className="w-full h-64 md:h-80 object-cover rounded-lg shadow-lg mb-8" />
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">{article.title}</h1>
                
                <p className="text-xl text-gray-400 mb-8 border-l-4 border-primary pl-4 italic">{article.summary}</p>

                <div
                    className="health-info-content text-gray-300 leading-relaxed text-lg"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />
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
                    margin-bottom: 1rem;
                }
                .health-info-content blockquote {
                    border-left: 4px solid #14B8A6; /* primary */
                    padding-left: 1rem;
                    margin: 1.5rem 0;
                    color: #D1D5DB; /* gray-300 */
                    font-style: italic;
                }
                .health-info-content strong, .health-info-content b {
                    color: white;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
};

export default HealthInfoDetail;