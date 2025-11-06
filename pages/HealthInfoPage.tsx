import React from 'react';
import { ArrowLeftIcon } from '../components/icons';

interface HealthInfoPageProps {
    onBack: () => void;
}

const HealthInfoPage: React.FC<HealthInfoPageProps> = ({ onBack }) => {
    const articles = [
        { title: "올바른 스쿼트 자세", summary: "무릎과 허리를 보호하며 효과를 극대화하는 스쿼트 자세에 대해 알아봅니다.", image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1738&auto=format&fit=crop" },
        { title: "단백질 섭취의 중요성", summary: "근성장을 위한 단백질 섭취 타이밍과 권장량에 대한 모든 것을 알려드립니다.", image: "https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=1740&auto=format&fit=crop" },
        { title: "체지방 감량을 위한 유산소 운동", summary: "가장 효과적인 유산소 운동 종류와 주당 적정 운동 횟수를 확인해보세요.", image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=1826&auto=format&fit=crop" },
        { title: "충분한 수면과 근회복의 관계", summary: "운동만큼 중요한 회복! 수면이 근육 성장에 미치는 영향에 대해 알아봅니다.", image: "https://images.unsplash.com/photo-1531368421863-b42784b2d354?q=80&w=1740&auto=format&fit=crop" }
    ];

    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center space-x-2 text-primary mb-8 hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>돌아가기</span>
            </button>

            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">건강 및 피트니스 정보</h1>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">운동, 영양, 회복에 대한 유용한 정보들을 확인해보세요.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {articles.map((article, index) => (
                    <div key={index} className="bg-dark-accent rounded-lg shadow-lg overflow-hidden group cursor-pointer">
                        <div className="overflow-hidden">
                            <img src={article.image} alt={article.title} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-white mb-2">{article.title}</h2>
                            <p className="text-gray-400 mb-4">{article.summary}</p>
                            <span className="font-semibold text-primary hover:underline">자세히 보기 &rarr;</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HealthInfoPage;
