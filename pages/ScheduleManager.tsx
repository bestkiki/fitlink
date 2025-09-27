import React, { useState, useEffect, useMemo } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db } from '../firebase';
import { UserProfile, Availability, Appointment } from '../App';
import { ArrowLeftIcon, PlusCircleIcon, TrashIcon, CheckCircleIcon, ClockIcon } from '../components/icons';
import CalendarGrid from '../components/CalendarGrid';
import AddAvailabilityModal from '../components/AddAvailabilityModal';
import Modal from '../components/Modal';

interface ScheduleManagerProps {
    user: firebase.User;
    onBack: () => void;
}

// Simple modal for inputting cancellation reason
const ReasonInputModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    title: string;
}> = ({ isOpen, onClose, onSubmit, title }) => {
    const [reason, setReason] = useState('');
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <textarea
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="회원에게 전달될 사유를 입력해주세요. (선택 사항)"
                ></textarea>
                <div className="flex justify-end">
                    <button
                        onClick={() => onSubmit(reason)}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg"
                    >
                        확인
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const ScheduleManager: React.FC<ScheduleManagerProps> = ({ user, onBack }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [availabilities, setAvailabilities] = useState<Availability[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    
    const [isAddAvailabilityModalOpen, setIsAddAvailabilityModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
    const [availabilityToDelete, setAvailabilityToDelete] = useState<Availability | null>(null);
    
    const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
    const [reasonModalConfig, setReasonModalConfig] = useState<{ title: string; action: 'reject' | 'cancel' } | null>(null);

    useEffect(() => {
        const availUnsub = db.collection('users').doc(user.uid).collection('availabilities')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Availability));
                setAvailabilities(data);
            });

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
        setSelectedDate(date);
        setIsAddAvailabilityModalOpen(true);
    };

    const handleConfirmAppointment = async () => {
        if (!viewingAppointment) return;
        const appointmentRef = db.collection('users').doc(user.uid).collection('appointments').doc(viewingAppointment.id);
        const memberRef = db.collection('users').doc(viewingAppointment.memberId);

        try {
            await db.runTransaction(async transaction => {
                transaction.update(appointmentRef, { status: 'confirmed' });
                transaction.update(memberRef, { usedSessions: firebase.firestore.FieldValue.increment(1) });
            });
            
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
    
    const handleRejectOrCancel = async (reason: string) => {
        if (!viewingAppointment || !reasonModalConfig) return;

        const isRejecting = reasonModalConfig.action === 'reject';
        const appointmentRef = db.collection('users').doc(user.uid).collection('appointments').doc(viewingAppointment.id);
        const availabilityRef = db.collection('users').doc(user.uid).collection('availabilities').doc();
        const memberRef = db.collection('users').doc(viewingAppointment.memberId);

        try {
            await db.runTransaction(async transaction => {
                if (isRejecting) {
                    transaction.delete(appointmentRef);
                } else { // Cancelling confirmed appointment
                    transaction.update(appointmentRef, { status: 'cancelled_by_trainer', cancellationReason: reason });
                    // Refund session
                    transaction.update(memberRef, { usedSessions: firebase.firestore.FieldValue.increment(-1) });
                }
                // Re-create availability slot
                transaction.set(availabilityRef, {
                    startTime: viewingAppointment.startTime,
                    endTime: viewingAppointment.endTime
                });
            });

            await db.collection('notifications').add({
                userId: viewingAppointment.memberId,
                message: `트레이너가 ${viewingAppointment.startTime.toDate().toLocaleString('ko-KR')} 예약을 취소했습니다. 사유: ${reason || '지정되지 않음'}`,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

        } catch (error) {
            console.error(`Error ${isRejecting ? 'rejecting' : 'cancelling'} appointment:`, error);
            alert("작업에 실패했습니다.");
        } finally {
            setIsReasonModalOpen(false);
            setViewingAppointment(null);
            setReasonModalConfig(null);
        }
    };

    const handleDeleteAvailability = async () => {
        if (!availabilityToDelete) return;
        try {
            await db.collection('users').doc(user.uid).collection('availabilities').doc(availabilityToDelete.id).delete();
            setAvailabilityToDelete(null);
        } catch (error) {
            console.error("Error deleting availability:", error);
            alert("예약 가능 시간 삭제에 실패했습니다.");
        }
    };

    const calendarEvents = useMemo(() => {
        const availabilityEvents = availabilities.map(avail => ({
            date: avail.startTime.toDate(),
            title: avail.startTime.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            color: 'green' as const,
            onClick: () => setAvailabilityToDelete(avail)
        }));

        const appointmentEvents = appointments.map(appt => {
            let color: 'blue' | 'orange' | 'yellow' = 'blue';
            if (appt.status === 'pending') color = 'yellow';
            else if (appt.status.startsWith('cancelled')) color = 'orange';

            return {
                date: appt.startTime.toDate(),
                title: `${appt.memberName.substring(0, 5)}`,
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
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">스케줄 관리</h1>
                        <p className="text-gray-400">예약 가능 시간을 설정하고, 회원 예약을 관리하세요.</p>
                    </div>
                     <button onClick={() => handleDateClick(new Date())} className="flex items-center space-x-2 bg-primary/80 hover:bg-primary text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm">
                        <PlusCircleIcon className="w-5 h-5"/>
                        <span>오늘 시간 추가</span>
                    </button>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mb-4">
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>예약 가능</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>예약 대기</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>예약 확정</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-secondary mr-2"></span>예약 취소</div>
                </div>
                <CalendarGrid 
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    events={calendarEvents}
                    onDateClick={handleDateClick}
                />
            </div>
            <AddAvailabilityModal 
                isOpen={isAddAvailabilityModalOpen}
                onClose={() => setIsAddAvailabilityModalOpen(false)}
                selectedDate={selectedDate}
                trainerId={user.uid}
            />
            {viewingAppointment && (
                <Modal isOpen={!!viewingAppointment} onClose={() => setViewingAppointment(null)} title="예약 상세 정보">
                    <div className="space-y-3 text-gray-300">
                       <p><span className="font-semibold w-20 inline-block text-gray-400">회원:</span> {viewingAppointment.memberName}</p>
                       <p><span className="font-semibold w-20 inline-block text-gray-400">연락처:</span> {viewingAppointment.memberEmail}</p>
                       <p><span className="font-semibold w-20 inline-block text-gray-400">일시:</span> {viewingAppointment.startTime.toDate().toLocaleString('ko-KR')}</p>
                       <p><span className="font-semibold w-20 inline-block text-gray-400">상태:</span> 
                           <span className={`${
                               viewingAppointment.status === 'pending' ? 'text-yellow-400' :
                               viewingAppointment.status.startsWith('cancelled') ? 'text-secondary' : 'text-primary'
                           }`}>
                               {viewingAppointment.status}
                           </span>
                       </p>
                        {viewingAppointment.cancellationReason && (
                            <div className="bg-dark p-3 rounded-md">
                                <p className="font-semibold text-gray-400 text-sm">취소 사유</p>
                                <p>{viewingAppointment.cancellationReason}</p>
                            </div>
                        )}
                    </div>
                    {viewingAppointment.status === 'pending' && (
                         <div className="flex justify-end pt-6 space-x-3">
                            <button onClick={() => { setReasonModalConfig({ title: '예약 거절 사유 입력', action: 'reject' }); setIsReasonModalOpen(true); }} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg">거절</button>
                            <button onClick={handleConfirmAppointment} className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">
                                <CheckCircleIcon className="w-5 h-5" />
                                <span>승인</span>
                            </button>
                        </div>
                    )}
                    {viewingAppointment.status === 'confirmed' && (
                         <div className="flex justify-end pt-6">
                            <button onClick={() => { setReasonModalConfig({ title: '예약 취소 사유 입력', action: 'cancel' }); setIsReasonModalOpen(true); }} className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                <TrashIcon className="w-5 h-5" />
                                <span>수업 취소</span>
                            </button>
                        </div>
                    )}
                </Modal>
            )}
             {availabilityToDelete && (
                <Modal isOpen={!!availabilityToDelete} onClose={() => setAvailabilityToDelete(null)} title="예약 가능 시간 삭제">
                    <p className="text-gray-300">
                        <span className="font-bold text-primary">{availabilityToDelete.startTime.toDate().toLocaleString('ko-KR')}</span>
                        <br/>
                        이 예약 가능 시간을 삭제하시겠습니까?
                    </p>
                     <p className="mt-2 text-sm text-gray-400">
                        이 시간은 더 이상 회원에게 노출되지 않습니다.
                    </p>
                    <div className="flex justify-end space-x-3 pt-6">
                        <button onClick={() => setAvailabilityToDelete(null)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">취소</button>
                        <button onClick={handleDeleteAvailability} className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg">
                            <TrashIcon className="w-5 h-5" />
                            <span>삭제</span>
                        </button>
                    </div>
                </Modal>
            )}
            {reasonModalConfig && (
                 <ReasonInputModal 
                    isOpen={isReasonModalOpen}
                    onClose={() => setIsReasonModalOpen(false)}
                    onSubmit={handleRejectOrCancel}
                    title={reasonModalConfig.title}
                 />
            )}
        </>
    );
};

export default ScheduleManager;