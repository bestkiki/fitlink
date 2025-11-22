
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { JobPost } from '../App';
import { BriefcaseIcon, MapPinIcon, ClockIcon, UserCircleIcon } from './icons';
import { Page } from '../UnauthenticatedApp';

interface JobBoardPreviewProps {
    onNavigate: (page: Page) => void;
}

const JobBoardPreview: React.FC<JobBoardPreviewProps> = ({ onNavigate }) => {
    const [jobs, setJobs] = useState<JobPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const snapshot = await db.collection('job_postings')
                    .orderBy('createdAt', 'desc')
                    .limit(4)
                    .get();
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobPost));
                setJobs(data);
            } catch (error) {
                console.error("Error fetching job preview:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    if (loading) return null; 
    if (jobs.length === 0) return null;

    return (
        <section className="py-20 bg-dark relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 -left-24 w-72 h-72 bg-secondary/5 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        <span className="text-primary">트레이너</span> 채용 공고
                    </h2>
                    <p className="text-lg text-gray-400">
                        새로운 도전을 기다리는 최고의 피트니스 센터들을 만나보세요.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {jobs.map(job => (
                        <div key={job.id} className="bg-dark-accent rounded-xl p-6 shadow-lg hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 border border-gray-800 flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        {job.authorProfileImageUrl ? (
                                            <img src={job.authorProfileImageUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-gray-700"/>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-dark flex items-center justify-center border border-gray-700">
                                                <BriefcaseIcon className="w-5 h-5 text-gray-500" />
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-xs text-gray-500 block">{job.createdAt?.toDate().toLocaleDateString()}</span>
                                            <span className="text-xs font-semibold text-gray-300 block max-w-[100px] truncate">{job.authorName}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors">{job.gymName}</h3>
                                <p className="text-primary/90 font-medium text-sm mb-4 line-clamp-1">{job.recruitSection}</p>
                                
                                <div className="space-y-2 text-sm text-gray-400 mb-6">
                                    <div className="flex items-center">
                                        <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                                        <span className="line-clamp-1">{job.location}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <ClockIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                                        <span className="line-clamp-1">{job.workHours}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => onNavigate('login')}
                                className="w-full bg-dark hover:bg-gray-700 text-gray-300 font-bold py-2.5 px-4 rounded-lg border border-gray-700 transition-colors text-sm flex items-center justify-center"
                            >
                                <span>로그인하여 상세보기</span>
                            </button>
                        </div>
                    ))}
                </div>
                
                <div className="text-center mt-12">
                    <button 
                        onClick={() => onNavigate('signup')} 
                        className="inline-flex items-center space-x-2 text-white bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary-dark px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-primary/30 transition-all transform hover:scale-105"
                    >
                        <span>더 많은 공고 보러가기</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default JobBoardPreview;
