import React, { useState, useEffect, useMemo } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db } from '../firebase';
import { Availability, Appointment } from '../App';
import { ArrowLeftIcon, TrashIcon, CheckCircleIcon } from '../components/icons';
import CalendarGrid from '../components/CalendarGrid';
import AddAvailabilityModal from '../components/AddAvailabilityModal';
import Modal from '../components/Modal';

interface ScheduleManagerProps {
    user: firebase.User;
    onBack: () => void;
}

const ScheduleManager: React.FC<ScheduleManagerProps> = ({ user, onBack }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [availabilities, setAvailabilities] = useState<Availability[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);
    const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
    const [cancellationReason, setCancellationReason] = useState('');

    useEffect(() => {
        // Fetch availabilities
        const availUnsub = db.collection('users').doc(user.uid).collection('availabilities')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Availability));
                setAvailabilities(data);
            });

        // Fetch appointments
        const apptUnsub = db.collection('users').doc(user.uid).collection('appointments')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
                setAppointments(data);
            });

        return () => {
            availUnsub();
            apptUnsub();
        };
    }, [user.uid]);

    const handleDateClick = (date: Date) => {
        setSelectedDateForModal(date);
        setIsAddModalOpen(true);
    };
    
    const handleDeleteAvailability = async (availabilityId: string) => {
        if (window.confirm('이 가능 시간을 삭제하시겠습니까?')) {
            await db.collection('users').doc(user.uid).collection('availabilities').doc(availabilityId).delete();
        }
    };
    
    const handleConfirmAppointment = async () => {
        if (!viewingAppointment) return;
        
        const appointmentRef = db.collection('users').doc(user.uid).collection('appointments').doc(viewingAppointment.id);
        const memberRef = db.collection('users').doc(viewingAppointment.memberId);

        try {
            await db.runTransaction(async (transaction) => {
                transaction.update(appointmentRef, { status: 'confirmed' });
                // Increment member's used sessions
                transaction.update(memberRef, { usedSessions: firebase.firestore.FieldValue.increment(1) });
            });
            
            // Notify member
            await db.collection('notifications').add({
                userId: viewingAppointment.memberId,
                message: `트레이너가 ${viewingAppointment.startTime.toDate().toLocaleString('ko-KR')} 예약을 확정했습니다.`,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

            setViewingAppointment(null);
        } catch (error) {
            console.error("Error confirming appointment:", error);
            alert("예약 확정에 실패했습니다.");
        }
    };
    
    const handleCancelAppointment = async () => {
        if (!viewingAppointment || !cancellationReason.trim()) {
            alert("취소 사유를 입력해주세요.");
            return;
        }

        const appointmentRef = db.collection('users').doc(user.uid).collection('appointments').doc(viewingAppointment.id);
        const availabilityRef = db.collection('users').doc(user.uid).collection('availabilities').doc();

        try {
            await db.runTransaction(async (transaction) => {
                // If it was a confirmed appointment that got cancelled, we need to decrement usedSessions
                if (viewingAppointment.status === 'confirmed') {
                     const memberRef = db.collection('users').doc(viewingAppointment.memberId);
                     transaction.update(memberRef, { usedSessions: firebase.firestore.FieldValue.increment(-1) });
                }

                // Update appointment status and reason
                transaction.update(appointmentRef, { 
                    status: 'cancelled_by_trainer',
                    cancellationReason: cancellationReason.trim()
                });
                // Re-create an availability slot
                transaction.set(availabilityRef, {
                    startTime: viewingAppointment.startTime,
                    endTime: viewingAppointment.endTime,
                });
            });

            // Notify member
             await db.collection('notifications').add({
                userId: viewingAppointment.memberId,
                message: `트레이너가 ${viewingAppointment.startTime.toDate().toLocaleString('ko-KR')} 예약을 취소했습니다. 사유: ${cancellationReason.trim()}`,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

            setViewingAppointment(null);
            setCancellationReason('');

        } catch (error) {
            console.error("Error cancelling appointment:", error);
            alert("예약 취소에 실패했습니다.");
        }
    };

    const calendarEvents = useMemo(() => {
        const availabilityEvents = availabilities.map(avail => ({
            date: avail.startTime.toDate(),
            title: avail.startTime.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            color: 'green' as const,
            onClick: () => {
                if(window.confirm('이 가능 시간을 삭제하시겠습니까?')) {
                     handleDeleteAvailability(avail.id)
                }
            }
        }));

        const appointmentEvents = appointments.map(appt => {
            let color: 'blue' | 'orange' | 'yellow' = 'blue';
            if (appt.status === 'pending') color = 'yellow';
            else if (appt.status.startsWith('cancelled')) color = 'orange';

            return {
                date: appt.startTime.toDate(),
                title: `${appt.memberName} - ${appt.startTime.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`,
                color,
                onClick: () => setViewingAppointment(appt)
            }
        });

        return [...availabilityEvents, ...appointmentEvents];
    }, [availabilities, appointments]);


    return (
        <>
            <div className="container mx-auto px-6 py-12">
                <button onClick={onBack} className="flex items-center space-x-2 text-primary mb-6 hover:underline">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>대시보드로 돌아가기</span>
                </button>
                <h1 className="text-3xl font-bold mb-2">스케줄 관리</h1>
                <p className="text-gray-400 mb-6">예약 가능 시간을 추가하고, 확정된 수업 일정을 확인하세요.</p>
                
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mb-4">
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>예약 가능</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>승인 대기</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>예약 확정</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span>취소된 예약</div>
                </div>

                <CalendarGrid 
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    events={calendarEvents}
                    onDateClick={handleDateClick}
                />
            </div>
            
            <AddAvailabilityModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                selectedDate={selectedDateForModal}
                trainerId={user.uid}
            />

            {viewingAppointment && (
                <Modal isOpen={!!viewingAppointment} onClose={() => { setViewingAppointment(null); setCancellationReason(''); }} title="예약 상세 정보">
                    <div className="space-y-3 text-gray-300">
                        <p><span className="font-semibold w-20 inline-block text-gray-400">회원:</span> <span className="font-bold">{viewingAppointment.memberName}</span></p>
                        <p><span className="font-semibold w-20 inline-block text-gray-400">연락처:</span> {viewingAppointment.memberEmail}</p>
                        <p><span className="font-semibold w-20 inline-block text-gray-400">일시:</span> <span className="font-bold">{viewingAppointment.startTime.toDate().toLocaleString('ko-KR')}</span></p>
                        <p><span className="font-semibold w-20 inline-block text-gray-400">상태:</span> 
                           <span className={`font-bold ${
                               viewingAppointment.status === 'pending' ? 'text-yellow-400' :
                               viewingAppointment.status.startsWith('cancelled') ? 'text-orange-400' : 'text-primary'
                           }`}>
                               {viewingAppointment.status === 'pending' && '승인 대기중'}
                               {viewingAppointment.status === 'confirmed' && '예약 확정'}
                               {viewingAppointment.status === 'cancelled_by_member' && '회원이 취소'}
                               {viewingAppointment.status === 'cancelled_by_trainer' && '트레이너가 취소'}
                           </span>
                       </p>
                       {(viewingAppointment.status === 'pending' || viewingAppointment.status === 'confirmed') && (
                           <div className="pt-4 border-t border-gray-700">
                                <label htmlFor="cancellation-reason" className="block text-sm font-medium text-gray-300 mb-1">취소 사유 (취소 시 필수)</label>
                                <input
                                    type="text"
                                    id="cancellation-reason"
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                    placeholder="예: 개인 사정"
                                    className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                           </div>
                       )}
                    </div>
                    <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-700">
                        <button onClick={() => { setViewingAppointment(null); setCancellationReason(''); }} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">닫기</button>
                        {(viewingAppointment.status === 'pending' || viewingAppointment.status === 'confirmed') && (
                            <button onClick={handleCancelAppointment} disabled={!cancellationReason.trim()} className="flex items-center space-x-2 bg-red-600/80 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                <TrashIcon className="w-5 h-5" />
                                <span>예약 취소</span>
                            </button>
                        )}
                        {viewingAppointment.status === 'pending' && (
                            <button onClick={handleConfirmAppointment} className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">
                                <CheckCircleIcon className="w-5 h-5"/>
                                <span>예약 확정</span>
                            </button>
                        )}
                    </div>
                </Modal>
            )}
        </>
    );
};

export default ScheduleManager;
