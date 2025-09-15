
import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db } from '../firebase';
import { Member } from './TrainerDashboard';
import { ExerciseLog, BodyMeasurement, ExerciseSet } from '../App';
import { ArrowLeftIcon, PencilIcon, PlusCircleIcon, TrashIcon, ChartBarIcon, DumbbellIcon } from '../components/icons';
import ProgressChart from '../components/ProgressChart';
import Modal from '../components/Modal';

interface MemberDetailViewProps {
    member: Member;
    onBack: () => void;
    onEditProfile: () => void;
}

const MemberDetailView: React.FC<MemberDetailViewProps> = ({ member, onBack, onEditProfile }) => {
    const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
    const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [loadingMeasurements, setLoadingMeasurements] = useState(true);

    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<ExerciseLog | null>(null);

    useEffect(() => {
        const logUnsub = db.collection('users').doc(member.id).collection('exerciseLogs')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExerciseLog));
                setExerciseLogs(data);
                setLoadingLogs(false);
            });

        const measurementUnsub = db.collection('users').doc(member.id).collection('bodyMeasurements')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BodyMeasurement));
                setBodyMeasurements(data);
                setLoadingMeasurements(false);
            });
        
        return () => {
            logUnsub();
            measurementUnsub();
        };
    }, [member.id]);

    const handleSaveLog = async (logData: Omit<ExerciseLog, 'id' | 'createdAt'>) => {
        const collectionRef = db.collection('users').doc(member.id).collection('exerciseLogs');
        try {
            if (editingLog) {
                await collectionRef.doc(editingLog.id).update(logData);
            } else {
                await collectionRef.add({
                    ...logData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }
            setIsLogModalOpen(false);
            setEditingLog(null);
        } catch (error) {
            console.error("Error saving log:", error);
            alert("운동 일지 저장에 실패했습니다.");
        }
    };
    
    const handleDeleteLog = async (logId: string) => {
        if(window.confirm('정말로 이 기록을 삭제하시겠습니까?')) {
            await db.collection('users').doc(member.id).collection('exerciseLogs').doc(logId).delete();
        }
    };

    const handleSaveMeasurement = async (measurementData: Omit<BodyMeasurement, 'id' | 'createdAt'>) => {
        try {
             await db.collection('users').doc(member.id).collection('bodyMeasurements').add({
                ...measurementData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            setIsMeasurementModalOpen(false);
        } catch (error) {
            console.error("Error saving measurement:", error);
            alert("신체 정보 저장에 실패했습니다.");
        }
    };

    const handleDeleteMeasurement = async (measurementId: string) => {
        if(window.confirm('정말로 이 기록을 삭제하시겠습니까?')) {
            await db.collection('users').doc(member.id).collection('bodyMeasurements').doc(measurementId).delete();
        }
    }

    const sortedMeasurements = [...bodyMeasurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <>
            <div className="container mx-auto px-6 py-12">
                <button onClick={onBack} className="flex items-center space-x-2 text-primary mb-6 hover:underline">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>회원 목록으로 돌아가기</span>
                </button>

                <div className="bg-dark-accent p-6 rounded-lg shadow-lg mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-white">{member.name || '이름 미지정'}</h1>
                            <p className="text-gray-400">{member.email}</p>
                        </div>
                        <button onClick={onEditProfile} className="flex items-center space-x-2 bg-primary/80 hover:bg-primary text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm">
                            <PencilIcon className="w-4 h-4" />
                            <span>프로필 수정</span>
                        </button>
                    </div>
                    <div className="mt-4 border-t border-gray-700 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><strong className="text-gray-400">연락처:</strong> {member.contact || '-'}</div>
                        <div><strong className="text-gray-400">운동 목표:</strong> {member.goal || '-'}</div>
                        <div className="md:col-span-2"><strong className="text-gray-400">메모:</strong> {member.notes || '-'}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 bg-dark-accent p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center"><ChartBarIcon className="w-6 h-6 mr-2 text-primary"/>신체 변화 기록</h2>
                            <button onClick={() => setIsMeasurementModalOpen(true)} className="flex items-center space-x-2 bg-primary/80 hover:bg-primary text-white font-bold py-1 px-3 rounded-lg transition-colors text-sm">
                                <PlusCircleIcon className="w-5 h-5"/>
                                <span>기록 추가</span>
                            </button>
                        </div>
                        <ProgressChart measurements={sortedMeasurements} />
                        <div className="mt-4 max-h-40 overflow-y-auto space-y-2">
                             {loadingMeasurements ? <p>로딩 중...</p> : bodyMeasurements.map(m => (
                                <div key={m.id} className="flex justify-between items-center bg-dark p-2 rounded-md text-sm">
                                    <span>{new Date(m.date).toLocaleDateString('ko-KR')}</span>
                                    <span>체중: {m.weight}kg</span>
                                    <button onClick={() => handleDeleteMeasurement(m.id)} className="p-1 hover:bg-red-500/20 rounded-full"><TrashIcon className="w-4 h-4 text-red-400"/></button>
                                </div>
                             ))}
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-dark-accent p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                           <h2 className="text-xl font-bold text-white flex items-center"><DumbbellIcon className="w-6 h-6 mr-2 text-primary"/>운동 일지</h2>
                            <button onClick={() => { setEditingLog(null); setIsLogModalOpen(true); }} className="flex items-center space-x-2 bg-primary/80 hover:bg-primary text-white font-bold py-1 px-3 rounded-lg transition-colors text-sm">
                                <PlusCircleIcon className="w-5 h-5"/>
                                <span>일지 추가</span>
                            </button>
                        </div>
                         <div className="space-y-3 max-h-96 overflow-y-auto">
                            {loadingLogs ? <p>로딩 중...</p> : exerciseLogs.length > 0 ? (
                                exerciseLogs.map(log => (
                                    <div key={log.id} className="bg-dark p-3 rounded-md">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-primary">{log.date}</p>
                                                <p className="font-bold text-white mt-1">{log.exerciseName}</p>
                                            </div>
                                            <div className="flex space-x-1">
                                                <button onClick={() => { setEditingLog(log); setIsLogModalOpen(true); }} className="p-1 hover:bg-primary/20 rounded-full"><PencilIcon className="w-4 h-4 text-primary"/></button>
                                                <button onClick={() => handleDeleteLog(log.id)} className="p-1 hover:bg-red-500/20 rounded-full"><TrashIcon className="w-4 h-4 text-red-400"/></button>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-400 mt-1">
                                            {log.sets.map((set, index) => (
                                                <span key={index} className="mr-3">{set.weight}kg x {set.reps}회</span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400">기록된 운동 일지가 없습니다.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isLogModalOpen && <AddEditLogModal isOpen={isLogModalOpen} onClose={() => { setIsLogModalOpen(false); setEditingLog(null); }} onSave={handleSaveLog} log={editingLog} />}
            {isMeasurementModalOpen && <AddMeasurementModal isOpen={isMeasurementModalOpen} onClose={() => setIsMeasurementModalOpen(false)} onSave={handleSaveMeasurement} />}
        </>
    );
};

// --- Modals (in-file components for simplicity) ---

// Add/Edit Log Modal
interface AddEditLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<ExerciseLog, 'id'|'createdAt'>) => void;
    log: ExerciseLog | null;
}

const AddEditLogModal: React.FC<AddEditLogModalProps> = ({ isOpen, onClose, onSave, log }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [exerciseName, setExerciseName] = useState('');
    const [sets, setSets] = useState<ExerciseSet[]>([{ reps: 10, weight: 20 }]);

    useEffect(() => {
        if (log) {
            setDate(log.date);
            setExerciseName(log.exerciseName);
            setSets(log.sets);
        } else {
            setDate(new Date().toISOString().split('T')[0]);
            setExerciseName('');
            setSets([{ reps: 10, weight: 20 }]);
        }
    }, [log, isOpen]);

    const handleSetChange = (index: number, field: keyof ExerciseSet, value: number) => {
        const newSets = [...sets];
        newSets[index][field] = value;
        setSets(newSets);
    };

    const addSet = () => setSets([...sets, { reps: 10, weight: 20 }]);
    const removeSet = (index: number) => setSets(sets.filter((_, i) => i !== index));

    const handleSubmit = () => {
        if (!exerciseName) { alert('운동 이름을 입력하세요.'); return; }
        onSave({ date, exerciseName, sets });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={log ? "운동 일지 수정" : "운동 일지 추가"}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">날짜</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">운동 이름</label>
                    <input type="text" value={exerciseName} onChange={e => setExerciseName(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600"/>
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-300 mb-1">세트</label>
                     <div className="space-y-2">
                        {sets.map((set, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input type="number" placeholder="무게(kg)" value={set.weight} onChange={e => handleSetChange(index, 'weight', +e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600" />
                                <span className="text-gray-400">kg</span>
                                <input type="number" placeholder="횟수" value={set.reps} onChange={e => handleSetChange(index, 'reps', +e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600" />
                                <span className="text-gray-400">회</span>
                                <button onClick={() => removeSet(index)} className="p-1 hover:bg-red-500/20 rounded-full"><TrashIcon className="w-5 h-5 text-red-400"/></button>
                            </div>
                        ))}
                     </div>
                     <button onClick={addSet} className="mt-2 text-primary text-sm font-semibold hover:underline">+ 세트 추가</button>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">취소</button>
                    <button onClick={handleSubmit} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">저장</button>
                </div>
            </div>
        </Modal>
    );
};


// Add Measurement Modal
interface AddMeasurementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<BodyMeasurement, 'id'|'createdAt'>) => void;
}

const AddMeasurementModal: React.FC<AddMeasurementModalProps> = ({ isOpen, onClose, onSave }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [weight, setWeight] = useState<number | ''>('');
    const [bodyFat, setBodyFat] = useState<number | ''>('');

    const handleSubmit = () => {
        if (!weight) { alert('체중을 입력하세요.'); return; }
        const data: Omit<BodyMeasurement, 'id'|'createdAt'> = { date, weight: +weight };
        if (bodyFat) data.bodyFat = +bodyFat;
        onSave(data);
    };
    
    useEffect(() => {
        if(isOpen) {
            setDate(new Date().toISOString().split('T')[0]);
            setWeight('');
            setBodyFat('');
        }
    }, [isOpen]);

    return (
         <Modal isOpen={isOpen} onClose={onClose} title="신체 정보 기록 추가">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">측정일</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">체중 (kg)</label>
                    <input type="number" value={weight} onChange={e => setWeight(e.target.value === '' ? '' : +e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">체지방률 (%)</label>
                    <input type="number" value={bodyFat} onChange={e => setBodyFat(e.target.value === '' ? '' : +e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600"/>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">취소</button>
                    <button onClick={handleSubmit} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">저장</button>
                </div>
            </div>
        </Modal>
    );
};


export default MemberDetailView;
