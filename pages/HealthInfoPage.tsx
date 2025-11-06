import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ArrowLeftIcon, MagnifyingGlassIcon } from '../components/icons';
import HealthInfoDetail from './HealthInfoDetail';
import firebase from 'firebase/compat/app';

interface HealthInfoPageProps {
    onBack: () => void;
}

type Category = 'workout' | 'diet' | 'recovery' | 'mindset';

export interface Article {
    id: string;
    title: string;
    summary: string;
    image: string;
    category: Category;
    content: string[];
    createdAt: firebase.firestore.Timestamp;
}

const categories: { id: string, name: string }[] = [
    { id: 'all', name: '전체' },
    { id: 'workout', name: '운동' },
    { id: 'diet', name: '식단' },
    { id: 'recovery', name: '회복' },
    { id: 'mindset', name: '마인드셋' }
];

const HealthInfoPage: React.FC<HealthInfoPageProps> = ({ onBack }) => {
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setLoading(true);
        const unsubscribe = db.collection('health_articles')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const articlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
                setArticles(articlesData);
                setLoading(false);
            }, error => {
                console.error("Error fetching health articles:", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);

    const handleArticleClick = (article: Article) => {
        setSelectedArticle(article);
        setView('detail');
    };

    const handleBackToList = () => {
        setSelectedArticle(null);
        setView('list');
    };
    
    const filteredArticles = articles
        .filter(article => selectedCategory === 'all' || article.category === selectedCategory)
        .filter(article => {
            if (!searchTerm.trim()) return true;
            const lowercasedTerm = searchTerm.toLowerCase();
            return (
                article.title.toLowerCase().includes(lowercasedTerm) ||
                article.summary.toLowerCase().includes(lowercasedTerm)
            );
        });

    if (view === 'detail' && selectedArticle) {
        return <HealthInfoDetail article={selectedArticle} onBack={handleBackToList} />;
    }

    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center space-x-2 text-primary mb-8 hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>돌아가기</span>
            </button>

            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">건강 및 피트니스 정보</h1>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">운동, 영양, 회복에 대한 유용한 정보들을 확인해보세요.</p>
            </div>
            
            <div className="flex justify-center flex-wrap gap-3 sm:gap-4 mb-8" role="tablist" aria-label="건강 정보 카테고리">
                {categories.map(category => (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        role="tab"
                        aria-selected={selectedCategory === category.id}
                        className={`px-5 py-2 rounded-full font-semibold transition-all duration-200 text-sm sm:text-base ${
                            selectedCategory === category.id
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-dark-accent text-gray-300 hover:bg-primary/50 hover:text-white'
                        }`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>
            
            <div className="relative max-w-lg mx-auto mb-12">
                <input
                    type="text"
                    placeholder="궁금한 정보를 검색해보세요... (예: 스쿼트, 단백질)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-dark-accent p-4 pl-12 rounded-full text-white border-2 border-gray-700 focus:border-primary focus:outline-none focus:ring-0 transition-colors"
                    aria-label="건강 정보 검색"
                />
                <MagnifyingGlassIcon className="w-6 h-6 text-gray-500 absolute top-1/2 left-4 transform -translate-y-1/2" />
            </div>
            
            {loading ? (
                <div className="text-center text-gray-400">정보를 불러오는 중...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredArticles.length > 0 ? (
                        filteredArticles.map((article) => (
                            <div key={article.id} onClick={() => handleArticleClick(article)} className="bg-dark-accent rounded-lg shadow-lg overflow-hidden group cursor-pointer transform hover:-translate-y-2 transition-transform duration-300">
                                <div className="relative overflow-hidden">
                                    <img src={article.image} alt={article.title} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute top-4 right-4 bg-primary/80 text-white text-xs font-bold px-3 py-1 rounded-full">{categories.find(c => c.id === article.category)?.name}</div>
                                </div>
                                <div className="p-6">
                                    <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{article.title}</h2>
                                    <p className="text-gray-400 mb-4 h-12 line-clamp-2">{article.summary}</p>
                                    <span className="font-semibold text-primary group-hover:underline">자세히 보기 &rarr;</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="md:col-span-2 text-center text-gray-500 py-20 bg-dark-accent rounded-lg">
                            <p className="text-lg">{searchTerm ? `'${searchTerm}'에 대한 검색 결과가 없습니다.` : '해당 카테고리에 맞는 정보가 없습니다.'}</p>
                            <p className="mt-2 text-sm">{searchTerm ? '다른 검색어를 시도해보세요.' : '다른 카테고리를 선택해보세요.'}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HealthInfoPage;
