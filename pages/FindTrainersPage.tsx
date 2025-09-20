import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { UserProfile } from '../App';
import { ArrowLeftIcon, DumbbellIcon, MagnifyingGlassIcon, UserCircleIcon, MapPinIcon, SparklesIcon } from '../components/icons';

interface FindTrainersPageProps {
    onBack: () => void;
}

interface TrainerProfile extends UserProfile {
    id: string;
}

const TrainerCard: React.FC<{ trainer: TrainerProfile }> = ({ trainer }) => (
    <a href={`/coach/${trainer.id}`} className="block bg-dark-accent p-6 rounded-lg shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1 group">
        <div className="flex items-center space-x-4 mb-4">
            {trainer.profileImageUrl ? (
                <img src={trainer.profileImageUrl} alt={trainer.name} className="w-16 h-16 rounded-full object-cover border-2 border-dark" />
            ) : (
                <UserCircleIcon className="w-16 h-16 text-gray-500 group-hover:text-primary transition-colors"/>
            )}
            <div>
                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{trainer.name || '이름 미지정'}</h3>
                <p className="text-sm text-gray-400">{trainer.email}</p>
            </div>
        </div>
        {trainer.offersFreeTrial && (
            <div className="mb-4 -mt-2 inline-flex items-center bg-primary/20 text-primary font-bold px-3 py-1 rounded-full text-xs">
                <SparklesIcon className="w-4 h-4 mr-1.5"/>
                1회 무료 체험 가능
            </div>
        )}
        <div className="space-y-4 pt-4 border-t border-gray-700/50">
            <div>
                <h4 className="font-semibold text-gray-300 flex items-center text-sm mb-1"><MapPinIcon className="w-4 h-4 mr-2 text-primary"/>근무지</h4>
                <p className="text-gray-400 text-sm line-clamp-1">{trainer.gymName || '지점 정보 없음'}</p>
                {trainer.gymAddress && <p className="text-gray-500 text-xs line-clamp-1">{trainer.gymAddress}</p>}
            </div>
            <div>
                <h4 className="font-semibold text-gray-300 flex items-center text-sm mb-1"><DumbbellIcon className="w-4 h-4 mr-2 text-primary"/>전문 분야</h4>
                <p className="text-gray-400 text-sm line-clamp-2">{trainer.specialization || '전문 분야가 아직 등록되지 않았습니다.'}</p>
            </div>
        </div>
    </a>
);


const FindTrainersPage: React.FC<FindTrainersPageProps> = ({ onBack }) => {
    const [trainers, setTrainers] = useState<TrainerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showFreeTrialOnly, setShowFreeTrialOnly] = useState(false);

    useEffect(() => {
        const fetchTrainers = async () => {
            setLoading(true);
            try {
                const snapshot = await db.collection('users').where('role', '==', 'trainer').get();
                const trainerData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as TrainerProfile));
                setTrainers(trainerData);
            } catch (err) {
                console.error("Error fetching trainers:", err);
                setError('트레이너 목록을 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchTrainers();
    }, []);

    const filteredTrainers = useMemo(() => {
        let results = trainers;

        if (showFreeTrialOnly) {
            results = results.filter(trainer => trainer.offersFreeTrial);
        }

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            results = results.filter(trainer => 
                trainer.name?.toLowerCase().includes(lowercasedTerm) ||
                trainer.specialization?.toLowerCase().includes(lowercasedTerm) ||
                trainer.gymName?.toLowerCase().includes(lowercasedTerm) ||
                trainer.gymAddress?.toLowerCase().includes(lowercasedTerm)
            );
        }
        
        return results;
    }, [searchTerm, trainers, showFreeTrialOnly]);

    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center space-x-2 text-secondary mb-6 hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>대시보드로 돌아가기</span>
            </button>
            <h1 className="text-3xl font-bold mb-2">트레이너 찾기</h1>
            <p className="text-gray-400 mb-8">FitLink에 등록된 전문 트레이너들을 만나보세요.</p>

            <div className="mb-8 max-w-lg">
                 <div className="relative">
                    <input
                        type="text"
                        placeholder="이름, 전문 분야, 지역으로 검색..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-dark-accent p-3 pl-10 rounded-lg text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 absolute top-1/2 left-3 transform -translate-y-1/2"/>
                </div>
                <div className="mt-4">
                    <label className="flex items-center space-x-2 cursor-pointer text-gray-300 w-fit">
                        <input
                            type="checkbox"
                            checked={showFreeTrialOnly}
                            onChange={e => setShowFreeTrialOnly(e.target.checked)}
                            className="h-5 w-5 rounded bg-dark border-gray-600 text-primary focus:ring-primary"
                        />
                        <span>무료 체험 제공 트레이너만 보기</span>
                    </label>
                </div>
            </div>

            {loading ? (
                <p>트레이너 목록을 불러오는 중...</p>
            ) : error ? (
                <p className="text-red-400">{error}</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredTrainers.length > 0 ? (
                        filteredTrainers.map(trainer => <TrainerCard key={trainer.id} trainer={trainer} />)
                    ) : (
                        <div className="text-center text-gray-400 bg-dark-accent rounded-lg p-8 md:col-span-2 lg:col-span-3">
                            <p>검색 결과와 일치하는 트레이너가 없습니다.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FindTrainersPage;