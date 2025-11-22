
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { JobPost } from '../App';

interface AddEditJobPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<JobPost, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'authorProfileImageUrl'>) => Promise<void>;
    jobPost: JobPost | null;
}

const AddEditJobPostModal: React.FC<AddEditJobPostModalProps> = ({ isOpen, onClose, onSave, jobPost }) => {
    const [gymName, setGymName] = useState('');
    const [intro, setIntro] = useState('');
    const [recruitSection, setRecruitSection] = useState('');
    const [location, setLocation] = useState('');
    const [workHours, setWorkHours] = useState('');
    const [conditions, setConditions] = useState('');
    const [salary, setSalary] = useState('');
    const [idealCandidate, setIdealCandidate] = useState('');
    const [qualifications, setQualifications] = useState('');
    const [applicationMethod, setApplicationMethod] = useState('');
    
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setGymName(jobPost?.gymName || '');
            setIntro(jobPost?.intro || '');
            setRecruitSection(jobPost?.recruitSection || '');
            setLocation(jobPost?.location || '');
            setWorkHours(jobPost?.workHours || '');
            setConditions(jobPost?.conditions || '');
            setSalary(jobPost?.salary || '');
            setIdealCandidate(jobPost?.idealCandidate || '');
            setQualifications(jobPost?.qualifications || '');
            setApplicationMethod(jobPost?.applicationMethod || '');
            setError('');
            setIsSaving(false);
        }
    }, [isOpen, jobPost]);

    const handleSave = async () => {
        if (!gymName.trim() || !recruitSection.trim() || !location.trim()) {
            setError('필수 항목(헬스클럽 이름, 채용 부분, 근무지)을 입력해주세요.');
            return;
        }

        setIsSaving(true);
        setError('');
        
        try {
            await onSave({
                gymName,
                intro,
                recruitSection,
                location,
                workHours,
                conditions,
                salary,
                idealCandidate,
                qualifications,
                applicationMethod
            });
        } catch (e: any) {
            setError(e.message || '저장에 실패했습니다.');
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={jobPost ? "구인 공고 수정" : "구인 공고 작성"}>
            <div className="space-y-4 h-[70vh] overflow-y-auto pr-2">
                {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-md">{error}</p>}
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">헬스클럽 이름 <span className="text-red-400">*</span></label>
                    <input type="text" value={gymName} onChange={(e) => setGymName(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="예: FitLink 짐 역삼점" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">채용 부분 <span className="text-red-400">*</span></label>
                    <input type="text" value={recruitSection} onChange={(e) => setRecruitSection(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="예: PT 트레이너, 필라테스 강사" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">근무지 <span className="text-red-400">*</span></label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="주소를 입력하세요" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">인사글 (소개)</label>
                    <textarea rows={3} value={intro} onChange={(e) => setIntro(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="센터 소개 및 인사말" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">근무 시간</label>
                        <input type="text" value={workHours} onChange={(e) => setWorkHours(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="예: 13:00 ~ 22:00" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">급여</label>
                        <input type="text" value={salary} onChange={(e) => setSalary(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="예: 기본급 + 수업료 @%" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">근무 조건</label>
                    <textarea rows={2} value={conditions} onChange={(e) => setConditions(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="복리후생 등" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">인재상</label>
                    <textarea rows={2} value={idealCandidate} onChange={(e) => setIdealCandidate(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="성실함, 열정 등" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">자격 조건</label>
                    <textarea rows={2} value={qualifications} onChange={(e) => setQualifications(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="생활스포츠지도사 자격증 필수 등" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">지원 방법</label>
                    <textarea rows={2} value={applicationMethod} onChange={(e) => setApplicationMethod(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="이메일 접수, 문자 지원 등" />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                    <button onClick={onClose} disabled={isSaving} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                        취소
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? '저장 중...' : (jobPost ? '수정하기' : '등록하기')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddEditJobPostModal;
