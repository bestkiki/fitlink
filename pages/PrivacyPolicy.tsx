import React from 'react';
import { ArrowLeftIcon } from '../components/icons';

interface PrivacyPolicyProps {
    onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center space-x-2 text-primary mb-6 hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>돌아가기</span>
            </button>
            <div className="bg-dark-accent p-8 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-white mb-6">개인정보처리방침</h1>
                <div className="space-y-4 text-gray-300">
                    <p>FitLink (이하 '회사')는 개인정보보호법 등 관련 법령상의 개인정보보호 규정을 준수하며, 관련 법령에 의거한 개인정보처리방침을 정하여 이용자 권익 보호에 최선을 다하고 있습니다.</p>

                    <h2 className="text-xl font-semibold text-white">1. 수집하는 개인정보의 항목</h2>
                    <p>회사는 회원가입, 원활한 고객상담, 각종 서비스의 제공을 위해 아래와 같은 개인정보를 수집하고 있습니다.</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>필수 항목: 이메일 주소, 비밀번호</li>
                        <li>선택 항목 (프로필 등록 시): 이름, 연락처, 운동 목표, 신체 정보(체중, 체지방률 등), 운동 기록</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-white">2. 개인정보의 수집 및 이용 목적</h2>
                    <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금 정산</li>
                        <li>회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정 이용 방지와 비인가 사용 방지, 가입 의사 확인</li>
                        <li>마케팅 및 광고에 활용: 신규 서비스 개발 및 맞춤 서비스 제공, 이벤트 등 광고성 정보 전달</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-white">3. 개인정보의 보유 및 이용기간</h2>
                    <p>회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 관계법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.</p>
                     <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                        <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                        <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                     </ul>

                    <h2 className="text-xl font-semibold text-white">4. 개인정보의 파기절차 및 방법</h2>
                    <p>회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체없이 파기합니다. 파기절차 및 방법은 다음과 같습니다.</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>파기절차: 회원이 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 DB로 옮겨져(종이의 경우 별도의 서류함) 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라(보유 및 이용기간 참조) 일정 기간 저장된 후 파기됩니다.</li>
                        <li>파기방법: 전자적 파일형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
