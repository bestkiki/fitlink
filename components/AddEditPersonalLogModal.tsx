import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { PersonalExerciseLog, ExerciseSet } from '../App';
import { TrashIcon } from './icons';

interface AddEditPersonalLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<PersonalExerciseLog, 'id' | 'createdAt'>) => void;
    log: PersonalExerciseLog | null;
}

const AddEditPersonalLogModal: React.FC<AddEditPersonalLogModalProps> = ({ isOpen, onClose, onSave, log }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [exerciseName, setExerciseName] = useState('');
    const [sets, setSets] = useState<ExerciseSet[]>([{ reps: 10, weight: 0 }]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (log) {
            setDate(log.date);
            setExerciseName(log.exerciseName);
            // Ensure sets is always an array, even if firebase returns null/undefined
            setSets(log.sets && log.sets.length > 0 ? log.sets : [{ reps: 10, weight: 0 }]);
        } else {
            // Reset for new entry
            setDate(new Date().toISOString().split('T')[0]);
            setExerciseName('');
            setSets([{ reps: 10, weight: 0 }]);
        }
        setIsSaving(false);
    }, [log, isOpen]);

    const handleSetChange = (index: number, field: keyof ExerciseSet, value: number) => {
        const newSets = [...sets];
        newSets[index] = { ...newSets[index], [field]: Math.max(0, value) }; // Ensure non-negative values
        setSets(newSets);
    };

    const addSet = () => {
        const lastSet = sets[sets.length - 1] || { reps: 10, weight: 0 };
        setSets([...sets, { ...lastSet }]);
    };
    
    const removeSet = (index: number) => {
        if (sets.length > 1) {
            setSets(sets.filter((_, i) => i !== index));
        } else {
            alert("최소 1개의 세트는 필요합니다.");
        }
    };

    const handleSubmit = async () => {
        if (!exerciseName.trim()) {
            alert('운동 이름을 입력해주세요.');
            return;
        }
        if (sets.some(s => s.reps == null || s.weight == null)) {
            alert('모든 세트의 무게와 횟수를 입력해주세요.');
            return;
        }
        
        setIsSaving(true);
        await onSave({ date, exerciseName: exerciseName.trim(), sets });
        setIsSaving(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={log ? "개인 운동 기록 수정" : "개인 운동 기록 추가"}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">날짜</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-secondary"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">운동 이름</label>
                    <input type="text" value={exerciseName} onChange={e => setExerciseName(e.target.value)} placeholder="예: 벤치 프레스" className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-secondary"/>
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
                     <button onClick={addSet} className="mt-3 text-secondary text-sm font-semibold hover:underline">+ 세트 추가</button>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                    <button onClick={onClose} disabled={isSaving} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                        취소
                    </button>
                    <button onClick={handleSubmit} disabled={isSaving} className="bg-secondary hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? '저장 중...' : '저장하기'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddEditPersonalLogModal;
