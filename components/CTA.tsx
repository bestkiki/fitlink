
import React from 'react';

const CTA: React.FC = () => {
    return (
        <section id="cta" className="py-20 bg-dark">
            <div className="container mx-auto px-6 text-center">
                 <div className="bg-gradient-to-r from-primary to-secondary p-10 rounded-lg shadow-2xl max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                        이제, 코칭에만 집중하세요
                    </h2>
                    <p className="text-lg text-white/90 mb-8">
                        복잡한 회원 관리는 FitLink에 맡기고, 당신의 전문성을 높이는 데 더 많은 시간을 투자하세요.
                    </p>
                    <a href="#" className="bg-white text-primary font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105 shadow-lg">
                        무료로 시작하기
                    </a>
                 </div>
            </div>
        </section>
    );
};

export default CTA;
