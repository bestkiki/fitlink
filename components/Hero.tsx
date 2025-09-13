import React from 'react';

interface HeroProps {
    onNavigate: () => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <section className="relative h-[80vh] min-h-[500px] flex items-center justify-center text-center text-white">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1740&auto=format&fit=crop')" }}>
        <div className="absolute inset-0 bg-black/60"></div>
      </div>
      <div className="relative z-10 px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
          최고의 트레이너를 위한<br />가장 스마트한 회원 관리
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-300">
          FitLink와 함께 회원의 성장을 체계적으로 관리하고, 코칭의 가치를 높여보세요.
          스케줄 관리부터 운동 기록, 커뮤니케이션까지 한번에 해결할 수 있습니다.
        </p>
        <button onClick={onNavigate} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">
          지금 바로 시작하기
        </button>
      </div>
    </section>
  );
};

export default Hero;