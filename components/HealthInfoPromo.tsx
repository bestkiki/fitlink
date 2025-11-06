import React from 'react';
import { BookOpenIcon } from './icons';

interface HealthInfoPromoProps {
    onNavigate: () => void;
}

const HealthInfoPromo: React.FC<HealthInfoPromoProps> = ({ onNavigate }) => {
    return (
        <section id="health-info-promo" className="py-20 bg-dark-accent/50">
            <div className="container mx-auto px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <BookOpenIcon className="w-16 h-16 mx-auto text-primary mb-4" />
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        전문가가 검증한 건강 정보
                    </h2>
                    <p className="text-lg text-gray-300 mb-8">
                        운동, 식단, 회복, 마인드셋까지. 여러분의 건강한 라이프스타일을 위해 FitLink가 직접 엄선한 유용한 정보들을 만나보세요.
                    </p>
                    <button onClick={onNavigate} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">
                        건강 정보 보러가기
                    </button>
                </div>
            </div>
        </section>
    );
};

export default HealthInfoPromo;
