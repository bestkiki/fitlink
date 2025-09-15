import React, { useState } from 'react';
import Modal from './Modal';
import firebase from 'firebase/compat/app';
import { db } from '../firebase';
import { ClockIcon } from './icons';

interface AddAvailabilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    trainerId: string;
}

const AddAvailabilityModal: React.FC<AddAvailabilityModalProps> = ({ isOpen, onClose, selectedDate, trainerId }) => {
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('18:00');
    const [slotDuration, setSlotDuration] = useState(60); // in minutes
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    if (!selectedDate) return null;

    const generateSlots = () => {
        const slots = [];
        const start = new Date(selectedDate);
        const [startH, startM] = startTime.split(':').map(Number);
        start.setHours(startH, startM, 0, 0);

        const end = new Date(selectedDate);
        const [endH, endM] = endTime.split(':').map(Number);
        end.setHours(endH, endM, 0, 0);

        let current = new Date(start);

        while (current.getTime() < end.getTime()) {
            const slotEnd = new Date(current.getTime() + slotDuration * 60000);
            if (slotEnd.getTime() > end.getTime()) break;
            slots.push({
                startTime: new Date(current),
                endTime: slotEnd,
            });
            current = slotEnd;
        }
        return slots;
    };

    const handleSave = async () => {
        const slots = generateSlots();
        if (slots.length === 0) {
            setError('생성될 슬롯이 없습니다. 시간과 간격을 확인해주세요.');
            return;
        }
        
        setIsSaving(true);
        setError('');

        try {
            const batch = db.batch();
            const collectionRef = db.collection('users').doc(trainerId).collection('availabilities');
            
            slots.forEach(slot => {
                const docRef = collectionRef.doc();
                batch.set(docRef, {
                    startTime: firebase.firestore.Timestamp.fromDate(slot.startTime),
                    endTime: firebase.firestore.Timestamp.fromDate(slot.endTime),
                });
            });

            await batch.commit();
            onClose();
        } catch (err) {
            console.error("Error saving availability:", err);
            setError('저장에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSaving(false);
        }
    };

    const slotsPreview = generateSlots();
    const formattedDate = selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="예약 가능 시간 추가">
            <div className="space-y-4">
                <p className="font-semibold text-lg text-primary">{formattedDate}</p>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-300 mb-1">시작 시간</label>
                        <input type="time" id="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600" />
                    </div>
                    <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-300 mb-1">종료 시간</label>
                        <input type="time" id="endTime" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600" />
                    </div>
                </div>
                <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-1">수업 시간 (분)</label>
                    <select id="duration" value={slotDuration} onChange={e => setSlotDuration(Number(e.target.value))} className="w-full bg-dark p-2 rounded-md text-white border border-gray-600">
                        <option value={30}>30분</option>
                        <option value={50}>50분</option>
                        <option value={60}>60분</option>
                        <option value={90}>90분</option>
                    </select>
                </div>
                
                <div className="bg-dark p-3 rounded-md max-h-40 overflow-y-auto">
                    <h4 className="font-semibold mb-2 text-gray-300">생성될 시간 슬롯 ({slotsPreview.length}개)</h4>
                    {slotsPreview.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 text-sm">
                        {slotsPreview.map((slot, i) => (
                            <div key={i} className="bg-dark-accent p-1.5 rounded text-center text-gray-300 flex items-center justify-center space-x-1">
                                <ClockIcon className="w-4 h-4 text-primary"/>
                                <span>{slot.startTime.toTimeString().substring(0, 5)}</span>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">설정에 맞는 시간 슬롯이 없습니다.</p>
                    )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button onClick={onClose} disabled={isSaving} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                        취소
                    </button>
                    <button onClick={handleSave} disabled={isSaving || slotsPreview.length === 0} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddAvailabilityModal;
