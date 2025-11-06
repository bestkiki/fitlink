import React from 'react';
import { ArrowLeftIcon } from '../components/icons';

interface Article {
    title: string;
    image: string;
    content: string[];
}

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
                <div className="text-gray-300 space-y-4 leading-relaxed text-lg">
                    {article.content.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </div>
            </article>
        </div>
    );
};

export default HealthInfoDetail;
