
import React from 'react';

const TestimonialCard: React.FC<{ quote: string; name: string; role: string; imageUrl: string }> = ({ quote, name, role, imageUrl }) => (
    <div className="bg-dark-accent p-8 rounded-lg shadow-lg text-center flex flex-col items-center">
        <img src={imageUrl} alt={name} className="w-24 h-24 rounded-full mb-4 border-4 border-primary" />
        <p className="text-gray-300 italic mb-6 flex-grow">"{quote}"</p>
        <div>
            <h4 className="font-bold text-lg text-white">{name}</h4>
            <p className="text-primary">{role}</p>
        </div>
    </div>
);

const Testimonials: React.FC = () => {
    return (
        <section id="testimonials" className="py-20 bg-dark-accent/50">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">FitLink와 함께 성장하는 사람들</h2>
                    <p className="text-lg text-gray-400 mt-4">전문가와 회원들이 직접 경험한 변화를 확인해보세요.</p>
                </div>
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <TestimonialCard
                        quote="FitLink를 도입하고 나서 회원 관리에 드는 시간이 절반으로 줄었어요. 엑셀로 관리할 때보다 훨씬 체계적이고, 회원들의 운동 데이터가 쌓이니 더 전문적인 코칭이 가능해졌습니다."
                        name="김민준"
                        role="퍼스널 트레이너"
                        imageUrl="https://picsum.photos/200/200?image=1005"
                    />
                    <TestimonialCard
                        quote="트레이너님이 짜주신 식단과 운동 루틴을 앱으로 바로 확인할 수 있어서 정말 편해요. 특히 제 체중 변화를 그래프로 보면서 운동 동기부여가 확실히 됩니다. 최고의 앱이에요!"
                        name="박서연"
                        role="피트니스 회원"
                        imageUrl="https://picsum.photos/200/200?image=823"
                    />
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
