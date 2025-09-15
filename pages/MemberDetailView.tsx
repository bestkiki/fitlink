import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import { Member } from './TrainerDashboard';
import { BodyMeasurement, ExerciseLog, ExerciseSet } from '../App';
import { ArrowLeftIcon, PlusCircleIcon, TrashIcon, PencilIcon, ChatBubbleIcon } from '../components/icons';
import ProgressChart from '../components/ProgressChart';

interface MemberDetailViewProps {
    member: Member;
    onBack: () => void;
    onEditProfile: () => void;
}

const MemberDetailView: React.FC<MemberDetailViewProps> = ({ member, onBack, onEditProfile }) => {
    const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
    const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageStatus, setMessageStatus] = useState('');

    // Forms State
    const [showAddMeasurement, setShowAddMeasurement] = useState(false);
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [newWeight, setNewWeight] = useState('');
    const [newBodyFat, setNewBodyFat] = useState('');

    const [showAddLog, setShowAddLog] = useState(false);
    const [newLogDate, setNewLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [newExerciseName, setNewExerciseName] = useState('');
    const [newSets, setNewSets] = useState<Partial<ExerciseSet>[]>([{ reps: undefined, weight: undefined }]);

    useEffect(() => {
        const unsubMeasurements = db.collection('users').doc(member.id).collection('bodyMeasurements')
            .orderBy('date', 'desc')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BodyMeasurement));
                setBodyMeasurements(data);
                setLoading(false);
            });

        const unsubLogs = db.collection('users').doc(member.id).collection('exerciseLogs')
            .orderBy('date', 'desc')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExerciseLog));
                setExerciseLogs(data);
            });
            
        return () => {
            unsubMeasurements();
            unsubLogs();
        };
    }, [member.id]);
    
    const handleAddMeasurement = async (e: React.FormEvent) => {
        e.preventDefault();
        const weight = newWeight ? parseFloat(newWeight) : undefined;
        const bodyFat = newBodyFat ? parseFloat(newBodyFat) : undefined;

        if (!weight && !bodyFat) {
            alert("체중 또는 체지방 중 하나는 입력해야 합니다.");
            return;
        }

        const newMeasurement = {
            date: newDate,
            ...(weight && { weight }),
            ...(bodyFat && { bodyFat }),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        try {
            await db.collection('users').doc(member.id).collection('bodyMeasurements').add(newMeasurement);
            setNewWeight('');
            setNewBodyFat('');
            setShowAddMeasurement(false);
        } catch (error) {
            console.error("Error adding measurement: ", error);
            alert("저장에 실패했습니다.");
        }
    };
    
    const handleAddSet = () => {
        setNewSets([...newSets, { reps: undefined, weight: undefined }]);
    };

    const handleSetChange = (index: number, field: keyof ExerciseSet, value: string) => {
        const updatedSets = [...newSets];
        const numValue = value ? parseFloat(value) : undefined;
        updatedSets[index] = { ...updatedSets[index], [field]: numValue };
        setNewSets(updatedSets);
    };

    const handleRemoveSet = (index: number) => {
        const updatedSets = newSets.filter((_, i) => i !== index);
        setNewSets(updatedSets);
    };

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExerciseName.trim() || newSets.length === 0) {
            alert("운동 이름과 최소 1개의 세트를 입력해야 합니다.");
            return;
        }

        const validSets = newSets.filter(s => s.reps && s.weight).map(s => s as ExerciseSet);
        if (validSets.length === 0) {
            alert("유효한 세트(횟수와 무게 모두 입력)가 하나 이상 있어야 합니다.");
            return;
        }
        
        const newLog = {
            date: newLogDate,
            exerciseName: newExerciseName,
            sets: validSets,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        try {
            await db.collection('users').doc(member.id).collection('exerciseLogs').add(newLog);
            setNewExerciseName('');
            setNewSets([{ reps: undefined, weight: undefined }]);
            setShowAddLog(false);
        } catch (error) {
            console.error("Error adding log:", error);
            alert("운동 기록 저장에 실패했습니다.");
        }
    };
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setMessageStatus('전송 중...');
        try {
            await db.collection('notifications').add({
                userId: member.id,
                message: `트레이너 메시지: "${message}"`,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            setMessage('');
            setMessageStatus('메시지가 성공적으로 전송되었습니다.');
        } catch (error) {
            console.error("Error sending message:", error);
            setMessageStatus('메시지 전송에 실패했습니다.');
        } finally {
            setTimeout(() => setMessageStatus(''), 3000);
        }
    };

    const groupedExerciseLogs = useMemo(() => {
        return exerciseLogs.reduce((acc, log) => {
            const date = log.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(log);
            return acc;
        }, {} as Record<string, ExerciseLog[]>);
    }, [exerciseLogs]);


    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center space-x-2 text-primary mb-6 hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>회원 목록으로 돌아가기</span>
            </button>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold">{member.name || '이름 미지정'}</h1>
                    <p className="text-gray-400">{member.email}</p>
                </div>
                <button onClick={onEditProfile} className="flex items-center space-x-2 bg-primary/20 hover:bg-primary/40 text-primary font-semibold py-2 px-4 rounded-lg transition-colors">
                    <PencilIcon className="w-5 h-5" />
                    <span>프로필 수정</span>
                </button>
            </div>
            
            {loading ? <p>데이터 로딩 중...</p> : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Graph */}
                    <div className="bg-dark-accent p-6 rounded-lg">
                        <h2 className="text-xl font-bold mb-4">성장 그래프</h2>
                        <ProgressChart measurements={bodyMeasurements} />
                    </div>
                     {/* Message Box */}
                    <div className="bg-dark-accent p-6 rounded-lg">
                        <h2 className="text-xl font-bold mb-4 flex items-center"><ChatBubbleIcon className="w-6 h-6 mr-2 text-primary"/>메시지 보내기</h2>
                        <form onSubmit={handleSendMessage}>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={`${member.name || '회원'}님에게 피드백이나 공지를 보낼 수 있습니다.`}
                                rows={3}
                                className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-sm text-gray-400 h-5">{messageStatus}</p>
                                <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">전송</button>
                            </div>
                        </form>
                    </div>
                    {/* Exercise Logs */}
                    <div className="bg-dark-accent p-6 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">운동 일지</h2>
                            <button onClick={() => setShowAddLog(!showAddLog)} className="flex items-center space-x-2 bg-primary/80 hover:bg-primary text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm">
                                <PlusCircleIcon className="w-5 h-5"/>
                                <span>운동 기록 추가</span>
                            </button>
                        </div>
                        
                        {showAddLog && (
                            <form onSubmit={handleAddLog} className="bg-dark p-4 rounded-md mb-4 space-y-4">
                               <div className="flex space-x-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-400 mb-1">날짜</label>
                                        <input type="date" value={newLogDate} onChange={e => setNewLogDate(e.target.value)} required className="w-full bg-dark-accent p-2 rounded-md text-white border border-gray-600"/>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-400 mb-1">운동 이름</label>
                                        <input type="text" value={newExerciseName} onChange={e => setNewExerciseName(e.target.value)} placeholder="예: 벤치프레스" required className="w-full bg-dark-accent p-2 rounded-md text-white border border-gray-600"/>
                                    </div>
                               </div>
                               <div>
                                   <label className="block text-sm font-medium text-gray-400 mb-2">세트</label>
                                   {newSets.map((set, index) => (
                                       <div key={index} className="flex items-center space-x-2 mb-2">
                                           <span className="text-gray-400">{index + 1}.</span>
                                           <input type="number" placeholder="무게(kg)" value={set.weight || ''} onChange={e => handleSetChange(index, 'weight', e.target.value)} className="w-full bg-dark-accent p-2 rounded-md text-white border border-gray-600"/>
                                           <input type="number" placeholder="횟수" value={set.reps || ''} onChange={e => handleSetChange(index, 'reps', e.target.value)} className="w-full bg-dark-accent p-2 rounded-md text-white border border-gray-600"/>
                                           <button type="button" onClick={() => handleRemoveSet(index)} className="p-2 text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5"/></button>
                                       </div>
                                   ))}
                                   <button type="button" onClick={handleAddSet} className="text-sm text-primary hover:underline mt-2">+ 세트 추가</button>
                               </div>
                               <button type="submit" className="w-full bg-primary text-white font-bold py-2 rounded-md mt-4">기록 저장</button>
                            </form>
                        )}
                        
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                             {Object.keys(groupedExerciseLogs).map(date => (
                                <div key={date}>
                                    <h3 className="font-semibold text-gray-300 my-2">{date}</h3>
                                    {groupedExerciseLogs[date].map(log => (
                                         <div key={log.id} className="bg-dark p-3 rounded-md mb-2">
                                            <p className="font-bold text-primary">{log.exerciseName}</p>
                                            <ul className="list-disc list-inside mt-1 text-sm text-gray-300">
                                              {log.sets.map((s, i) => (
                                                  <li key={i}>{s.weight} kg x {s.reps} 회</li>
                                              ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                             ))}
                        </div>

                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1 bg-dark-accent p-6 rounded-lg h-fit">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">신체 정보</h2>
                        <button onClick={() => setShowAddMeasurement(!showAddMeasurement)} className="p-2 text-primary hover:text-primary-dark">
                           <PlusCircleIcon className="w-6 h-6"/>
                        </button>
                    </div>

                     {showAddMeasurement && (
                        <form onSubmit={handleAddMeasurement} className="bg-dark p-4 rounded-md mb-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">측정일</label>
                                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required className="w-full bg-dark-accent p-2 rounded-md text-white border border-gray-600"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">체중 (kg)</label>
                                <input type="number" step="0.1" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="예: 75.5" className="w-full bg-dark-accent p-2 rounded-md text-white border border-gray-600"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">체지방률 (%)</label>
                                <input type="number" step="0.1" value={newBodyFat} onChange={e => setNewBodyFat(e.target.value)} placeholder="예: 18.2" className="w-full bg-dark-accent p-2 rounded-md text-white border border-gray-600"/>
                            </div>
                            <button type="submit" className="w-full bg-primary text-white font-bold py-2 rounded-md">저장</button>
                        </form>
                    )}

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                        {bodyMeasurements.map(m => (
                            <div key={m.id} className="bg-dark p-3 rounded-md text-sm">
                                <p className="font-semibold text-gray-300">{m.date}</p>
                                <div className="flex justify-between mt-1 text-gray-400">
                                   {m.weight && <span>체중: <span className="text-white">{m.weight} kg</span></span>}
                                   {m.bodyFat && <span>체지방: <span className="text-white">{m.bodyFat} %</span></span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default MemberDetailView;