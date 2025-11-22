
import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { db } from '../firebase';
import { UserProfile, JobPost } from '../App';
import { ArrowLeftIcon, BriefcaseIcon, MapPinIcon, ClockIcon, UserCircleIcon, PencilIcon, TrashIcon, PlusCircleIcon } from '../components/icons';
import AddEditJobPostModal from '../components/AddEditJobPostModal';

interface JobBoardPageProps {
    user: firebase.User;
    userProfile: UserProfile;
    onBack: () => void;
}

const JobBoardPage: React.FC<JobBoardPageProps> = ({ user, userProfile, onBack }) => {
    const [jobs, setJobs] = useState<JobPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<JobPost | null>(null);
    
    // Only Trainers and Admins can write
    const canWrite = userProfile.role === 'trainer' || userProfile.isAdmin;

    useEffect(() => {
        setLoading(true);
        const unsubscribe = db.collection('job_postings')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobPost));
                setJobs(data);
                setLoading(false);
            }, error => {
                console.error("Error fetching jobs:", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);

    const handleOpenModal = (job: JobPost | null) => {
        setEditingJob(job);
        setIsModalOpen(true);
    };

    const handleSaveJob = async (data: Omit<JobPost, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'authorProfileImageUrl'>) => {
        try {
            if (editingJob) {
                await db.collection('job_postings').doc(editingJob.id).update(data);
            } else {
                await db.collection('job_postings').add({
                    ...data,
                    authorId: user.uid,
                    authorName: userProfile.name || user.email,
                    authorProfileImageUrl: userProfile.profileImageUrl || null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }
            setIsModalOpen(false);
            setEditingJob(null);
        } catch (error) {
            console.error("Error saving job post:", error);
            throw new Error("공고 저장에 실패했습니다.");
        }
    };

    const handleDeleteJob = async (jobId: string) => {
        if (window.confirm("정말로 이 공고를 삭제하시겠습니까?")) {
            try {
                await db.collection('job_postings').doc(jobId).delete();
            } catch (error) {
                console.error("Error deleting job post:", error);
                alert("공고 삭제에 실패했습니다.");
            }
        }
    };

    return (
        <>
            <div className="container mx-auto px-6 py-12">
                <button onClick={onBack} className="flex items-center space-x-2 text-primary mb-6 hover:underline">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>대시보드로 돌아가기</span>
                </button>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center">
                            <BriefcaseIcon className="w-8 h-8 mr-3 text-primary" />
                            트레이너 구인구직
                        </h1>
                        <p className="text-gray-400">새로운 기회를 찾거나 최고의 인재를 영입하세요.</p>
                    </div>
                    {canWrite && (
                        <button onClick={() => handleOpenModal(null)} className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors mt-4 sm:mt-0">
                            <PlusCircleIcon className="w-5 h-5" />
                            <span>공고 등록하기</span>
                        </button>
                    )}
                </div>

                {loading && <p className="text-center text-gray-400 p-8">공고를 불러오는 중...</p>}
                
                {!loading && jobs.length === 0 && (
                    <div className="text-center text-gray-500 p-12 bg-dark-accent rounded-lg">
                        <BriefcaseIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                        <p>현재 등록된 구인 공고가 없습니다.</p>
                        {canWrite && <p>첫 번째 공고를 등록해보세요!</p>}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {jobs.map(job => (
                        <div key={job.id} className="bg-dark-accent p-6 rounded-lg shadow-lg border border-gray-800 hover:border-primary/50 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{job.gymName}</h2>
                                    <p className="text-primary font-semibold text-sm mt-1">{job.recruitSection}</p>
                                </div>
                                {(user.uid === job.authorId || userProfile.isAdmin) && (
                                    <div className="flex space-x-2">
                                        <button onClick={() => handleOpenModal(job)} className="p-2 hover:bg-primary/10 rounded-full text-gray-400 hover:text-primary">
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteJob(job.id)} className="p-2 hover:bg-red-500/10 rounded-full text-gray-400 hover:text-red-400">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 text-sm text-gray-300 mb-4">
                                <div className="flex items-center">
                                    <MapPinIcon className="w-4 h-4 mr-2 text-gray-500" />
                                    <span>{job.location}</span>
                                </div>
                                <div className="flex items-center">
                                    <ClockIcon className="w-4 h-4 mr-2 text-gray-500" />
                                    <span>{job.workHours}</span>
                                </div>
                            </div>

                            {job.intro && (
                                <div className="bg-dark p-3 rounded-md text-sm text-gray-400 mb-4 whitespace-pre-wrap line-clamp-3">
                                    {job.intro}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-4 border-t border-gray-700 pt-3">
                                <div>
                                    <span className="block font-semibold text-gray-300 mb-1">급여</span>
                                    {job.salary}
                                </div>
                                <div>
                                    <span className="block font-semibold text-gray-300 mb-1">자격요건</span>
                                    <span className="line-clamp-1">{job.qualifications}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
                                <div className="flex items-center space-x-2">
                                    {job.authorProfileImageUrl ? (
                                        <img src={job.authorProfileImageUrl} alt={job.authorName} className="w-6 h-6 rounded-full object-cover" />
                                    ) : (
                                        <UserCircleIcon className="w-6 h-6 text-gray-500" />
                                    )}
                                    <span className="text-xs text-gray-500">{job.authorName}</span>
                                </div>
                                <span className="text-xs text-gray-600">{job.createdAt?.toDate().toLocaleDateString()}</span>
                            </div>
                            
                            {/* Expandable Details could go here, or navigate to detail page. For now, simple list view is enough for requirements. */}
                            <div className="mt-4">
                                <div className="bg-dark p-3 rounded text-xs space-y-2">
                                    <p><span className="text-primary font-bold">지원방법:</span> {job.applicationMethod}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AddEditJobPostModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingJob(null); }}
                onSave={handleSaveJob}
                jobPost={editingJob}
            />
        </>
    );
};

export default JobBoardPage;
