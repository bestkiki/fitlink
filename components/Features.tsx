
import React from 'react';
import { UsersIcon, ChartBarIcon, CalendarIcon, ChatBubbleIcon, VideoCameraIcon } from './icons';

const trainerFeatures = [
  {
    icon: <UsersIcon className="w-10 h-10 text-primary" />,
    title: '스마트한 회원 관리',
    description: '고객 프로필, 운동 목표, 건강 상태 등 모든 정보를 한 곳에서 체계적으로 관리하세요.',
  },
  {
    icon: <ChartBarIcon className="w-10 h-10 text-primary" />,
    title: '운동 데이터 추적',
    description: '회원별 운동 일지, 신체 변화를 기록하고 그래프로 시각화하여 성과를 한눈에 파악할 수 있습니다.',
  },
  {
    icon: <CalendarIcon className="w-10 h-10 text-primary" />,
    title: '간편한 스케줄링',
    description: 'PT 및 그룹 수업 예약을 손쉽게 관리하고, 캘린더에서 전체 일정을 확인할 수 있습니다.',
  },
  {
    icon: <ChatBubbleIcon className="w-10 h-10 text-primary" />,
    title: '원활한 커뮤니케이션',
    description: '개인 피드백, 그룹 공지 등 회원과의 소통을 간편하게 만들어보세요.',
  },
  {
    icon: <VideoCameraIcon className="w-10 h-10 text-primary" />,
    title: '콘텐츠 공유',
    description: '운동 루틴, 식단표, 동기부여 영상 등 유용한 콘텐츠를 회원에게 손쉽게 공유할 수 있습니다.',
  },
];

const memberFeatures = [
  {
    title: '나의 성장 기록 확인',
    description: '내 운동 기록과 체중, 체지방 변화를 그래프로 확인하며 성취감을 느껴보세요.',
  },
  {
    title: '코치의 전문적인 피드백',
    description: '트레이너가 공유한 맞춤 운동 루틴, 식단, 피드백을 언제 어디서든 확인할 수 있습니다.',
  },
  {
    title: '간편한 수업 예약',
    description: '가능한 시간을 확인하고 터치 몇 번으로 간편하게 PT 스케줄을 예약하고 변경할 수 있습니다.',
  },
  {
    title: '중요한 알림 기능',
    description: '예약된 수업이나 오늘의 운동 미션을 잊지 않도록 제때 알려드립니다.',
  },
];

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-dark-accent p-6 rounded-lg shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-2">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-dark">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            <span className="text-primary">트레이너</span>와 <span className="text-secondary">회원</span> 모두를 위한 완벽한 기능
          </h2>
          <p className="text-lg text-gray-400 mt-4 max-w-3xl mx-auto">
            FitLink는 코칭의 효율성을 극대화하고, 회원의 운동 경험을 한 단계 끌어올립니다.
          </p>
        </div>

        <div className="mb-16">
            <h3 className="text-2xl font-bold text-center mb-8 text-primary">🏋️ 트레이너/코치용 주요 기능</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trainerFeatures.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
            ))}
            </div>
        </div>

        <div>
            <h3 className="text-2xl font-bold text-center mb-8 text-secondary">🙋‍♂️ 회원(고객)용 주요 기능</h3>
            <div className="bg-dark-accent rounded-lg p-8 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {memberFeatures.map((feature, index) => (
                    <div key={index}>
                        <h4 className="text-lg font-semibold text-white mb-2">{feature.title}</h4>
                        <p className="text-gray-400">{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
