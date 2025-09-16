import React from 'react';
import { ArrowLeftIcon } from '../components/icons';

interface TermsOfServiceProps {
    onBack: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center space-x-2 text-primary mb-6 hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>돌아가기</span>
            </button>
            <div className="bg-dark-accent p-8 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-white mb-6">이용약관</h1>
                <div className="space-y-4 text-gray-300">
                    <h2 className="text-xl font-semibold text-white">제1조 (목적)</h2>
                    <p>본 약관은 FitLink (이하 '회사')가 제공하는 FitLink 서비스(이하 '서비스')의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
                    
                    <h2 className="text-xl font-semibold text-white">제2조 (정의)</h2>
                    <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>'서비스'라 함은 회사가 제공하는 트레이너와 회원을 위한 스케줄 관리, 운동 기록, 커뮤니케이션 등의 기능을 포함한 웹 어플리케이션을 의미합니다.</li>
                        <li>'회원'이라 함은 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다. 회원은 '트레이너'와 '일반 회원'으로 구분됩니다.</li>
                        <li>'계정'이라 함은 회원의 식별과 서비스 이용을 위하여 회원이 정하고 회사가 승인하는 이메일 주소를 의미합니다.</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-white">제3조 (약관의 게시와 개정)</h2>
                    <p>1. 회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</p>
                    <p>2. 회사는 '약관의 규제에 관한 법률', '정보통신망 이용촉진 및 정보보호 등에 관한 법률' 등 관련 법을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</p>
                    <p>3. 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 제1항의 방식에 따라 그 개정약관의 적용일자 7일 전부터 적용일자 전일까지 공지합니다.</p>

                    <h2 className="text-xl font-semibold text-white">제4조 (서비스의 제공 및 변경)</h2>
                    <p>1. 회사는 회원에게 아래와 같은 서비스를 제공합니다.</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>회원 관리 서비스</li>
                        <li>운동 데이터 기록 및 추적 서비스</li>
                        <li>스케줄 관리 및 예약 서비스</li>
                        <li>커뮤니케이션 서비스</li>
                        <li>기타 회사가 추가 개발하거나 다른 회사와의 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</li>
                    </ul>
                    <p>2. 회사는 상당한 이유가 있는 경우에 운영상, 기술상의 필요에 따라 제공하고 있는 전부 또는 일부 서비스를 변경할 수 있습니다.</p>

                    <h2 className="text-xl font-semibold text-white">제5조 (회원의 의무)</h2>
                    <p>1. 회원은 다음 행위를 하여서는 안 됩니다.</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>신청 또는 변경 시 허위 내용의 등록</li>
                        <li>타인의 정보 도용</li>
                        <li>회사가 게시한 정보의 변경</li>
                        <li>회사 및 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                        <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
