import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
// FIX: Import auth from firebase to get current user for feedback.
import { db, auth } from '../firebase';
import { Member } from './TrainerDashboard';
import { ExerciseLog, BodyMeasurement, ExerciseSet, DietLog, MealType, PersonalExerciseLog, Feedback } from '../App';
import { ArrowLeftIcon, PencilIcon, PlusCircleIcon, TrashIcon, ChartBarIcon, DocumentTextIcon, FireIcon, ClipboardListIcon, ChatBubbleLeftRightIcon } from '../components/icons';
import Modal from '../components/Modal';
import ProgressChart from '../components/ProgressChart';

// --- MODAL COMPONENTS (defined inside to avoid new files) ---

// Add/Edit Exercise Log Modal
interface AddEditExerciseLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (logData: Omit<ExerciseLog, 'id' | 'createdAt'>) => Promise<void>;
    log: ExerciseLog | null;
}

const AddEditExerciseLogModal: React.FC<AddEditExerciseLogModalProps> = ({ isOpen, onClose, onSave, log }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [exerciseName, setExerciseName] = useState('');
    const [sets, setSets] = useState<ExerciseSet[]>([{ reps: 10, weight: 0 }]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (log) {
            setDate(log.date);
            setExerciseName(log.exerciseName);
            setSets(log.sets && log.sets.length > 0 ? log.sets : [{ reps: 10, weight: 0 }]);
        } else {
            setDate(new Date().toISOString().split('T')[0]);
            setExerciseName('');
            setSets([{ reps: 10, weight: 0 }]);
        }
        setIsSaving(false);
    }, [log, isOpen]);

    const handleSetChange = (index: number, field: keyof ExerciseSet, value: number) => {
        const newSets = [...sets];
        newSets[index] = { ...newSets[index], [field]: Math.max(0, value) };
        setSets(newSets);
    };

    const addSet = () => {
        const lastSet = sets[sets.length - 1] || { reps: 10, weight: 0 };
        setSets([...sets, { ...lastSet }]);
    };

    const removeSet = (index: number) => {
        if (sets.length > 1) {
            setSets(sets.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async () => {
        if (!exerciseName.trim()) {
            alert('운동 이름을 입력해주세요.');
            return;
        }
        setIsSaving(true);
        await onSave({ date, exerciseName: exerciseName.trim(), sets });
        setIsSaving(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={log ? "운동 기록 수정" : "운동 기록 추가"}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">날짜</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">운동 이름</label>
                    <input type="text" value={exerciseName} onChange={e => setExerciseName(e.target.value)} placeholder="예: 스쿼트" className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-300 mb-2">세트</label>
                     <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {sets.map((set, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <span className="text-gray-400 font-mono w-6">{index+1}.</span>
                                <input type="number" placeholder="무게" value={set.weight} onChange={e => handleSetChange(index, 'weight', +e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 text-center" />
                                <span className="text-gray-400">kg</span>
                                <input type="number" placeholder="횟수" value={set.reps} onChange={e => handleSetChange(index, 'reps', +e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 text-center" />
                                <span className="text-gray-400">회</span>
                                <button onClick={() => removeSet(index)} className="p-2 bg-dark hover:bg-red-500/20 rounded-full transition-colors"><TrashIcon className="w-5 h-5 text-gray-500 hover:text-red-400"/></button>
                            </div>
                        ))}
                     </div>
                     <button onClick={addSet} className="mt-3 text-primary text-sm font-semibold hover:underline">+ 세트 추가</button>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                    <button onClick={onClose} disabled={isSaving} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">취소</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                        {isSaving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// Add/Edit Body Measurement Modal
interface AddEditBodyMeasurementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (measurementData: Omit<BodyMeasurement, 'id' | 'createdAt'>) => Promise<void>;
    measurement: BodyMeasurement | null;
}

const AddEditBodyMeasurementModal: React.FC<AddEditBodyMeasurementModalProps> = ({ isOpen, onClose, onSave, measurement }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [weight, setWeight] = useState<number | ''>('');
    const [bodyFat, setBodyFat] = useState<number | ''>('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (measurement) {
            setDate(measurement.date);
            setWeight(measurement.weight ?? '');
            setBodyFat(measurement.bodyFat ?? '');
        } else {
            setDate(new Date().toISOString().split('T')[0]);
            setWeight('');
            setBodyFat('');
        }
        setIsSaving(false);
    }, [measurement, isOpen]);

    const handleSubmit = async () => {
        if (weight === '' && bodyFat === '') {
            alert('체중 또는 체지방률 중 하나는 입력해야 합니다.');
            return;
        }
        setIsSaving(true);
        await onSave({
            date,
            weight: weight !== '' ? Number(weight) : undefined,
            bodyFat: bodyFat !== '' ? Number(bodyFat) : undefined
        });
        setIsSaving(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={measurement ? "신체 정보 수정" : "신체 정보 추가"}>
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">측정일</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">체중 (kg)</label>
                    <input type="number" value={weight} onChange={e => setWeight(e.target.value === '' ? '' : +e.target.value)} placeholder="예: 75.5" className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">체지방률 (%)</label>
                    <input type="number" value={bodyFat} onChange={e => setBodyFat(e.target.value === '' ? '' : +e.target.value)} placeholder="예: 15.2" className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"/>
                </div>
                 <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                    <button onClick={onClose} disabled={isSaving} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">취소</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                        {isSaving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const FeedbackSection: React.FC<{
    logId: string;
    feedback: Feedback[];
    onSave: (feedbackText: string) => void;
}> = ({ logId, feedback, onSave }) => {
    const [newFeedback, setNewFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFeedback.trim()) return;
        setIsSubmitting(true);
        await onSave(newFeedback);
        setNewFeedback('');
        setIsSubmitting(false);
    };

    return (
        <div className="mt-2 pt-2 border-t border-gray-700/50">
            {feedback.map(fb => (
                <div key={fb.id} className="text-xs text-gray-400 mt-1 pl-2">
                    <span className="font-semibold text-primary">{fb.trainerName}:</span> {fb.text}
                </div>
            ))}
            <form onSubmit={handleSubmit} className="flex items-center space-x-2 mt-2">
                <input
                    type="text"
                    value={newFeedback}
                    onChange={(e) => setNewFeedback(e.target.value)}
                    placeholder="피드백을 남겨주세요..."
                    className="w-full bg-dark-accent text-sm p-1.5 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button type="submit" disabled={isSubmitting} className="bg-primary text-white text-sm px-3 py-1.5 rounded-md hover:bg-primary-dark disabled:opacity-50">
                    전송
                </button>
            </form>
        </div>
    );
};


// --- MAIN COMPONENT ---
interface MemberDetailViewProps {
    member: Member;
    onBack: () => void;
    onEditProfile: () => void;
}

const MemberDetailView: React.FC<MemberDetailViewProps> = ({ member, onBack, onEditProfile }) => {
    const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
    const [personalExerciseLogs, setPersonalExerciseLogs] = useState<PersonalExerciseLog[]>([]);
    const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
    const [dietLogs, setDietLogs] = useState<DietLog[]>([]);
    const [loading, setLoading] = useState({ logs: true, measurements: true, diet: true, personalLogs: true });

    const [isExerciseLogModalOpen, setIsExerciseLogModalOpen] = useState(false);
    const [editingExerciseLog, setEditingExerciseLog] = useState<ExerciseLog | null>(null);

    const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
    const [editingMeasurement, setEditingMeasurement] = useState<BodyMeasurement | null>(null);

    useEffect(() => {
        const memberRef = db.collection('users').doc(member.id);

        const fetchWithFeedback = async <T extends { id: string }>(
            collectionName: string,
            orderByField: string = 'createdAt'
        ): Promise<T[]> => {
            const snapshot = await memberRef.collection(collectionName).orderBy(orderByField, 'desc').get();
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
            
            const itemsWithFeedback = await Promise.all(items.map(async item => {
                const feedbackSnap = await memberRef.collection(collectionName).doc(item.id).collection('feedback').orderBy('createdAt', 'asc').get();
                const feedback = feedbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
                return { ...item, feedback };
            }));
            
            return itemsWithFeedback;
        };

        const unsubLogs = memberRef.collection('exerciseLogs').orderBy('createdAt', 'desc').onSnapshot(snap => {
            setExerciseLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExerciseLog)));
            setLoading(l => ({ ...l, logs: false }));
        });
        
        const unsubMeasurements = memberRef.collection('bodyMeasurements').orderBy('createdAt', 'desc').onSnapshot(snap => {
            setBodyMeasurements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BodyMeasurement)));
            setLoading(l => ({ ...l, measurements: false }));
        });
        
        fetchWithFeedback<PersonalExerciseLog>('personalExerciseLogs').then(data => {
            setPersonalExerciseLogs(data);
            setLoading(l => ({...l, personalLogs: false}));
        });

        fetchWithFeedback<DietLog>('dietLogs', 'date').then(data => {
            setDietLogs(data);
            setLoading(l => ({...l, diet: false}));
        });


        return () => {
            unsubLogs();
            unsubMeasurements();
        };
    }, [member.id]);

    const handleSaveFeedback = async (
        logType: 'personalExerciseLogs' | 'dietLogs',
        logId: string,
        feedbackText: string
    ) => {
        const trainer = auth.currentUser;
        if (!trainer) return;

        try {
            const feedbackRef = db.collection('users').doc(member.id).collection(logType).doc(logId).collection('feedback');
            await feedbackRef.add({
                text: feedbackText,
                trainerId: trainer.uid,
                trainerName: trainer.displayName || trainer.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await db.collection('notifications').add({
                userId: member.id,
                message: `트레이너가 당신의 기록에 피드백을 남겼습니다: "${feedbackText.substring(0, 20)}..."`,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Refresh data locally
            const feedbackSnap = await feedbackRef.orderBy('createdAt', 'asc').get();
            const newFeedbackList = feedbackSnap.docs.map(doc => ({id: doc.id, ...doc.data()} as Feedback));

            if (logType === 'personalExerciseLogs') {
                setPersonalExerciseLogs(prev => prev.map(log => log.id === logId ? {...log, feedback: newFeedbackList} : log));
            } else {
                setDietLogs(prev => prev.map(log => log.id === logId ? {...log, feedback: newFeedbackList} : log));
            }

        } catch (error) {
            console.error("Error saving feedback:", error);
            alert("피드백 저장에 실패했습니다.");
        }
    };


    const handleOpenExerciseLogModal = (log: ExerciseLog | null) => {
        setEditingExerciseLog(log);
        setIsExerciseLogModalOpen(true);
    };

    const handleSaveExerciseLog = async (logData: Omit<ExerciseLog, 'id' | 'createdAt'>) => {
        const collectionRef = db.collection('users').doc(member.id).collection('exerciseLogs');
        try {
            if (editingExerciseLog) {
                await collectionRef.doc(editingExerciseLog.id).update(logData);
            } else {
                await collectionRef.add({ ...logData, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            }
            setIsExerciseLogModalOpen(false);
            setEditingExerciseLog(null);
        } catch (error) {
            console.error("Error saving exercise log:", error);
            alert("운동 기록 저장에 실패했습니다.");
        }
    };
    
    const handleDeleteExerciseLog = async (logId: string) => {
        if (window.confirm('정말로 이 기록을 삭제하시겠습니까?')) {
            await db.collection('users').doc(member.id).collection('exerciseLogs').doc(logId).delete();
        }
    };

    const handleOpenMeasurementModal = (measurement: BodyMeasurement | null) => {
        setEditingMeasurement(measurement);
        setIsMeasurementModalOpen(true);
    };

    const handleSaveMeasurement = async (measurementData: Omit<BodyMeasurement, 'id' | 'createdAt'>) => {
        const collectionRef = db.collection('users').doc(member.id).collection('bodyMeasurements');
        try {
            if (editingMeasurement) {
                await collectionRef.doc(editingMeasurement.id).update(measurementData);
            } else {
                await collectionRef.add({ ...measurementData, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            }
            setIsMeasurementModalOpen(false);
            setEditingMeasurement(null);
        } catch (error) {
            console.error("Error saving body measurement:", error);
            alert("신체 정보 저장에 실패했습니다.");
        }
    };
    
    const handleDeleteMeasurement = async (measurementId: string) => {
        if (window.confirm('정말로 이 기록을 삭제하시겠습니까?')) {
            await db.collection('users').doc(member.id).collection('bodyMeasurements').doc(measurementId).delete();
        }
    };

    const mealTypes: { key: MealType, name: string }[] = [
      { key: 'breakfast', name: '아침' },
      { key: 'lunch', name: '점심' },
      { key: 'dinner', name: '저녁' },
      { key: 'snacks', name: '간식' },
    ];
    
    const sortedMeasurements = [...bodyMeasurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    return (
        <>
            <div className="container mx-auto px-6 py-12">
                <button onClick={onBack} className="flex items-center space-x-2 text-primary mb-6 hover:underline">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>회원 목록으로 돌아가기</span>
                </button>

                {/* Header and Profile Section */}
                <div className="bg-dark-accent p-6 rounded-lg shadow-lg mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white">{member.name}</h1>
                            <p className="text-gray-400">{member.email}</p>
                        </div>
                        <button onClick={onEditProfile} className="mt-4 sm:mt-0 flex items-center space-x-2 bg-primary/80 hover:bg-primary text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <PencilIcon className="w-5 h-5"/>
                            <span>프로필 수정</span>
                        </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <h3 className="font-semibold text-gray-300 mb-1">운동 목표</h3>
                            <p className="text-gray-400 whitespace-pre-wrap">{member.goal || '지정된 목표가 없습니다.'}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-300 mb-1">트레이너 메모 (회원 비공개)</h3>
                            <p className="text-gray-400 whitespace-pre-wrap">{member.notes || '작성된 메모가 없습니다.'}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Progress Section */}
                    <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center"><ChartBarIcon className="w-6 h-6 mr-3 text-primary"/>성장 기록</h2>
                            <button onClick={() => handleOpenMeasurementModal(null)} className="flex items-center space-x-2 bg-primary/80 hover:bg-primary text-white font-bold py-1 px-3 rounded-lg transition-colors text-sm">
                                <PlusCircleIcon className="w-5 h-5"/>
                                <span>기록 추가</span>
                            </button>
                        </div>
                        <ProgressChart measurements={sortedMeasurements} />
                        <div className="space-y-2 mt-4 max-h-40 overflow-y-auto">
                            {loading.measurements ? <p>로딩 중...</p> : sortedMeasurements.slice().reverse().map(m => (
                                <div key={m.id} className="flex justify-between items-center bg-dark p-2 rounded-md text-sm">
                                    <span className="font-semibold text-gray-300">{m.date}</span>
                                    <div className="flex space-x-4">
                                        {m.weight != null && <span>체중: {m.weight}kg</span>}
                                        {m.bodyFat != null && <span>체지방: {m.bodyFat}%</span>}
                                    </div>
                                    <div>
                                        <button onClick={() => handleOpenMeasurementModal(m)} className="p-1"><PencilIcon className="w-4 h-4 text-gray-400 hover:text-primary"/></button>
                                        <button onClick={() => handleDeleteMeasurement(m.id)} className="p-1"><TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-400"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Exercise Logs */}
                    <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center"><DocumentTextIcon className="w-6 h-6 mr-3 text-primary"/>트레이너 할당 운동</h2>
                            <button onClick={() => handleOpenExerciseLogModal(null)} className="flex items-center space-x-2 bg-primary/80 hover:bg-primary text-white font-bold py-1 px-3 rounded-lg transition-colors text-sm">
                                <PlusCircleIcon className="w-5 h-5"/>
                                <span>일지 추가</span>
                            </button>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {loading.logs ? <p>로딩 중...</p> : exerciseLogs.length > 0 ? exerciseLogs.map(log => (
                                <div key={log.id} className="bg-dark p-3 rounded-md">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-primary">{log.date}</p>
                                            <p className="font-bold text-white mt-1">{log.exerciseName}</p>
                                        </div>
                                        <div className="flex space-x-1">
                                            <button onClick={() => handleOpenExerciseLogModal(log)} className="p-1"><PencilIcon className="w-4 h-4 text-gray-400 hover:text-primary"/></button>
                                            <button onClick={() => handleDeleteExerciseLog(log.id)} className="p-1"><TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-400"/></button>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-400 mt-1">
                                        {log.sets.map((set, i) => <span key={i} className="mr-3">{set.weight}kg x {set.reps}회</span>)}
                                    </div>
                                </div>
                            )) : <p className="text-gray-400">운동 기록이 없습니다.</p>}
                        </div>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Personal Exercise Logs */}
                    <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center"><ClipboardListIcon className="w-6 h-6 mr-3 text-primary"/>회원 개인 운동 기록</h2>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                           {loading.personalLogs ? <p>로딩 중...</p> : personalExerciseLogs.length > 0 ? personalExerciseLogs.map(log => (
                                <div key={log.id} className="bg-dark p-3 rounded-md">
                                    <p className="font-semibold text-primary">{log.date}</p>
                                    <p className="font-bold text-white mt-1">{log.exerciseName}</p>
                                    <div className="text-sm text-gray-400 mt-1 mb-2">
                                        {log.sets.map((set, i) => <span key={i} className="mr-3">{set.weight}kg x {set.reps}회</span>)}
                                    </div>
                                    <FeedbackSection 
                                        logId={log.id}
                                        feedback={log.feedback || []}
                                        onSave={(text) => handleSaveFeedback('personalExerciseLogs', log.id, text)}
                                    />
                                </div>
                            )) : <p className="text-gray-400">회원이 기록한 개인 운동이 없습니다.</p>}
                        </div>
                    </div>

                    {/* Diet Logs */}
                    <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center"><FireIcon className="w-6 h-6 mr-3 text-primary"/>최근 식단 기록</h2>
                        <div className="space-y-6 max-h-96 overflow-y-auto">
                            {loading.diet ? <p>로딩 중...</p> : dietLogs.length > 0 ? dietLogs.map(log => (
                                <div key={log.id} className="bg-dark p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                                        <h3 className="font-bold text-primary">{log.date}</h3>
                                        <p className="text-lg font-bold text-primary">{log.totalCalories} kcal</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-2">
                                        {mealTypes.map(meal => (
                                            <div key={meal.key}>
                                                <h4 className="font-semibold text-gray-300 mb-1">{meal.name}</h4>
                                                {log.meals[meal.key] && log.meals[meal.key].length > 0 ? (
                                                    log.meals[meal.key].map(food => (
                                                        <div key={food.id} className="flex justify-between text-gray-400">
                                                            <span>{food.foodName}</span>
                                                            <span>{food.calories} kcal</span>
                                                        </div>
                                                    ))
                                                ) : <p className="text-xs text-gray-500">기록 없음</p>}
                                            </div>
                                        ))}
                                    </div>
                                     <FeedbackSection 
                                        logId={log.id}
                                        feedback={log.feedback || []}
                                        onSave={(text) => handleSaveFeedback('dietLogs', log.id, text)}
                                    />
                                </div>
                            )) : <p className="text-gray-400">식단 기록이 없습니다.</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddEditExerciseLogModal
                isOpen={isExerciseLogModalOpen}
                onClose={() => { setIsExerciseLogModalOpen(false); setEditingExerciseLog(null); }}
                onSave={handleSaveExerciseLog}
                log={editingExerciseLog}
            />
            <AddEditBodyMeasurementModal
                isOpen={isMeasurementModalOpen}
                onClose={() => { setIsMeasurementModalOpen(false); setEditingMeasurement(null); }}
                onSave={handleSaveMeasurement}
                measurement={editingMeasurement}
            />
        </>
    );
};

export default MemberDetailView;