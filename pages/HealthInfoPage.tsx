import React, { useState } from 'react';
import { ArrowLeftIcon } from '../components/icons';
import HealthInfoDetail from './HealthInfoDetail';

interface HealthInfoPageProps {
    onBack: () => void;
}

interface Article {
    title: string;
    summary: string;
    image: string;
    content: string[];
}

const articles: Article[] = [
    {
        title: "올바른 스쿼트 자세",
        summary: "무릎과 허리를 보호하며 효과를 극대화하는 스쿼트 자세에 대해 알아봅니다.",
        image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1738&auto=format&fit=crop",
        content: [
            "스쿼트는 하체 근력 강화의 왕으로 불리는 최고의 운동입니다. 하지만 잘못된 자세로 수행할 경우 무릎이나 허리에 부담을 줄 수 있습니다. 올바른 자세를 익혀 부상 없이 최대의 효과를 얻어보세요.",
            "1. 준비 자세: 발을 어깨너비보다 약간 넓게 벌리고, 발끝은 15~30도 정도 바깥쪽을 향하게 합니다. 허리를 곧게 펴고 가슴을 열어주세요. 시선은 정면을 향합니다.",
            "2. 내려가기: 의자에 앉는다는 느낌으로 엉덩이를 뒤로 빼면서 천천히 내려갑니다. 이때 무릎이 발끝보다 앞으로 과도하게 나가지 않도록 주의하고, 허리가 구부러지지 않도록 복부에 힘을 줍니다. 허벅지가 지면과 평행이 될 때까지 내려가는 것이 이상적입니다.",
            "3. 올라오기: 발뒤꿈치로 땅을 민다는 느낌으로 힘을 주며 일어섭니다. 올라오는 동작에서도 허리가 굽혀지지 않도록 코어 근육의 긴장을 유지해야 합니다. 최고 지점에서 엉덩이를 강하게 수축시켜주면 둔근에 더 큰 자극을 줄 수 있습니다.",
            "잘못된 자세로는 무릎이 안쪽으로 모이거나, 허리가 둥글게 말리는 경우, 그리고 너무 빠르게 움직이는 것 등이 있습니다. 항상 통제된 속도로 정확한 자세를 유지하는 것이 가장 중요합니다."
        ]
    },
    {
        title: "단백질 섭취의 중요성",
        summary: "근성장을 위한 단백질 섭취 타이밍과 권장량에 대한 모든 것을 알려드립니다.",
        image: "https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=1740&auto=format&fit=crop",
        content: [
            "근육을 성장시키기 위해 운동만큼 중요한 것이 바로 영양 섭취, 특히 단백질입니다. 단백질은 근육을 구성하는 기본 요소로, 운동으로 손상된 근육 섬유를 회복하고 더 강하게 만드는 데 필수적인 역할을 합니다.",
            "일반적으로 근력 운동을 하는 사람의 경우 체중 1kg당 1.6g ~ 2.2g의 단백질 섭취가 권장됩니다. 예를 들어 체중이 70kg이라면 하루에 약 112g에서 154g의 단백질을 섭취해야 합니다.",
            "단백질 섭취 타이밍에 대해서는 여러 의견이 있지만, 가장 중요한 것은 하루 총 섭취량을 채우는 것입니다. 다만 운동 직후 30분에서 1시간 이내에 단백질을 섭취하면 근육 회복과 합성에 더 도움이 될 수 있다는 연구 결과가 많습니다. 이를 '기회의 창'이라고 부릅니다.",
            "좋은 단백질 공급원으로는 닭가슴살, 소고기, 생선, 계란, 두부, 콩, 그리고 유청 단백질 보충제 등이 있습니다. 다양한 공급원을 통해 단백질을 섭취하여 필수 아미노산을 골고루 얻는 것이 좋습니다."
        ]
    },
    {
        title: "체지방 감량을 위한 유산소 운동",
        summary: "가장 효과적인 유산소 운동 종류와 주당 적정 운동 횟수를 확인해보세요.",
        image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=1826&auto=format&fit=crop",
        content: [
            "체지방 감량을 목표로 한다면 근력 운동과 함께 유산소 운동을 병행하는 것이 매우 효과적입니다. 유산소 운동은 심박수를 높여 칼로리 소모를 촉진하고 심폐지구력을 향상시키는 데 도움을 줍니다.",
            "대표적인 유산소 운동으로는 달리기, 사이클링, 수영, 줄넘기 등이 있습니다. 어떤 운동이든 꾸준히 하는 것이 가장 중요하지만, 운동 강도에 따라 효과는 달라질 수 있습니다.",
            "고강도 인터벌 트레이닝(HIIT)은 짧은 시간 동안 고강도 운동과 휴식을 반복하는 방식으로, 운동 후에도 칼로리 소모가 지속되는 '애프터번 효과'가 커 시간 대비 효율이 높습니다. 반면, 저강도 유산소 운동(LISS)은 일정한 속도로 30분 이상 길게 운동하는 방식으로, 지방을 주 에너지원으로 사용해 체지방 감량에 직접적인 도움을 줍니다.",
            "미국 스포츠의학회(ACSM)에서는 체중 감량을 위해 주당 150분 이상의 중강도 유산소 운동을 권장합니다. 주 3~5회, 한 번에 30분~60분 정도 꾸준히 실천하여 건강한 다이어트에 성공하시길 바랍니다."
        ]
    },
    {
        title: "충분한 수면과 근회복의 관계",
        summary: "운동만큼 중요한 회복! 수면이 근육 성장에 미치는 영향에 대해 알아봅니다.",
        image: "https://images.unsplash.com/photo-1531368421863-b42784b2d354?q=80&w=1740&auto=format&fit=crop",
        content: [
            "열심히 운동한 후 근육이 실제로 성장하는 시간은 바로 우리가 잠을 자는 동안입니다. 수면은 근육 회복과 성장에 있어 절대적으로 중요한 요소이며, 이를 간과해서는 안 됩니다.",
            "우리가 깊은 잠에 빠졌을 때, 뇌하수체에서 성장 호르몬(HGH)이 가장 활발하게 분비됩니다. 이 성장 호르몬은 단백질 합성을 촉진하고 근육 조직의 회복을 돕는 핵심적인 역할을 합니다. 충분한 수면을 취하지 못하면 성장 호르몬 분비가 줄어들어 운동 효과가 반감될 수 있습니다.",
            "또한, 수면 부족은 스트레스 호르몬인 코르티솔 수치를 높입니다. 코르티솔은 근육 단백질을 분해하는 이화 작용을 촉진하므로, 근육 성장에는 적이라고 할 수 있습니다. 반면, 충분한 수면은 코르티솔 수치를 안정시키는 데 도움을 줍니다.",
            "성인의 경우 하루 7~9시간의 양질의 수면이 권장됩니다. 매일 일정한 시간에 잠자리에 들고 일어나며, 침실을 어둡고 조용하게 유지하는 등 좋은 수면 습관을 만드는 것이 중요합니다. 최고의 운동 성과를 원한다면, 최고의 회복, 즉 충분한 수면을 보장해야 합니다."
        ]
    }
];

const HealthInfoPage: React.FC<HealthInfoPageProps> = ({ onBack }) => {
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

    const handleArticleClick = (article: Article) => {
        setSelectedArticle(article);
        setView('detail');
    };

    const handleBackToList = () => {
        setSelectedArticle(null);
        setView('list');
    };

    if (view === 'detail' && selectedArticle) {
        return <HealthInfoDetail article={selectedArticle} onBack={handleBackToList} />;
    }

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
                    <div key={index} onClick={() => handleArticleClick(article)} className="bg-dark-accent rounded-lg shadow-lg overflow-hidden group cursor-pointer">
                        <div className="overflow-hidden">
                            <img src={article.image} alt={article.title} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-white mb-2">{article.title}</h2>
                            <p className="text-gray-400 mb-4">{article.summary}</p>
                            <span className="font-semibold text-primary group-hover:underline">자세히 보기 &rarr;</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HealthInfoPage;
