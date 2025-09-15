import React, { useState, useEffect, useMemo } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db } from '../firebase';
import { UserProfile, Availability, Appointment } from '../App';
import { ArrowLeftIcon, TrashIcon } from '../components/icons';
import CalendarGrid from '../components/CalendarGrid';
import Modal from '../components/Modal';

interface BookingCalendarProps {
    user: firebase.User;
    userProfile: UserProfile;
    onBack: () => void;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ user, userProfile, onBack }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [availabilities, setAvailabilities] = useState<Availability[]>([]);
    const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
    
    const [slotToBook, setSlotToBook] = useState<Availability | null>(null);
    const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

    const trainerId = userProfile.trainerId;

    useEffect(() => {
        if (!trainerId) return;

        const availUnsub = db.collection('users').doc(trainerId).collection('availabilities')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Availability));
                setAvailabilities(data);
            });

        const apptUnsub = db.collection('users').doc(trainerId).collection('appointments')
            .where('memberId', '==', user.uid)
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
                setMyAppointments(data);
            });

        return () => {
            availUnsub();
            apptUnsub();
        };
    }, [trainerId, user.uid]);

    const handleBookSlot = async () => {
        if (!slotToBook || !trainerId) return;

        const availabilityRef = db.collection('users').doc(trainerId).collection('availabilities').doc(slotToBook.id);
        const appointmentRef = db.collection('users').doc(trainerId).collection('appointments').doc();

        try {
            await db.runTransaction(async (transaction) => {
                const availDoc = await transaction.get(availabilityRef);
                if (!availDoc.exists) {
                    throw "선택한 시간을 다른 회원이 먼저 예약했습니다.";
                }

                transaction.delete(availabilityRef);
                transaction.set(appointmentRef, {
                    memberId: user.uid,
                    memberName: userProfile.name || user.email || '이름 미지정',
                    memberEmail: userProfile.email,
                    startTime: slotToBook.startTime,
                    endTime: slotToBook.endTime,
                    status: 'confirmed',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
            });

            // Notify trainer
            await db.collection('notifications').add({
                userId: trainerId,
                message: `${userProfile.name || user.email}님이 ${slotToBook.startTime.toDate().toLocaleString('ko-KR')} 수업을 예약했습니다.`,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

            setSlotToBook(null);
        } catch (error) {
            console.error("Error booking slot: ", error);
            alert(error || "예약에 실패했습니다. 페이지를 새로고침하고 다시 시도해주세요.");
            setSlotToBook(null);
        }
    };
    
    const handleCancelAppointment = async () => {
        if (!appointmentToCancel || !trainerId) return;

        const appointmentRef = db.collection('users').doc(trainerId).collection('appointments').doc(appointmentToCancel.id);
        const availabilityRef = db.collection('users').doc(trainerId).collection('availabilities').doc();

        try {
            await db.runTransaction(async (transaction) => {
                transaction.update(appointmentRef, { status: 'cancelled_by_member' });
                // Re-create the availability slot for the trainer
                transaction.set(availabilityRef, {
                    startTime: appointmentToCancel.startTime,
                    endTime: appointmentToCancel.endTime,
                });
            });
            
            // Notify trainer
            await db.collection('notifications').add({
                userId: trainerId,
                message: `${userProfile.name || user.email}님이 ${appointmentToCancel.startTime.toDate().toLocaleString('ko-KR')} 예약을 취소했습니다.`,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });

            setAppointmentToCancel(null);
        } catch (error) {
            console.error("Error cancelling appointment:", error);
            alert("예약 취소에 실패했습니다.");
            setAppointmentToCancel(null);
        }
    };
    

    const calendarEvents = useMemo(() => {
        const allBookedTimes = myAppointments.map(a => a.startTime.toMillis());
        const availableSlots = availabilities.filter(avail => !allBookedTimes.includes(avail.startTime.toMillis()));

        const availabilityEvents = availableSlots.map(avail => ({
            date: avail.startTime.toDate(),
            title: avail.startTime.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            color: 'green' as 'green',
            onClick: () => setSlotToBook(avail)
        }));

        const appointmentEvents = myAppointments.map(appt => {
            let color: 'blue' | 'orange' = 'blue';
            if (appt.status.startsWith('cancelled')) color = 'orange';

            return {
                date: appt.startTime.toDate(),
                title: appt.startTime.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                color,
                onClick: () => appt.status === 'confirmed' && setAppointmentToCancel(appt)
            }
        });

        return [...availabilityEvents, ...appointmentEvents];
    }, [availabilities, myAppointments]);

    if (!trainerId) {
        return (
            <div className="container mx-auto px-6 py-12">
                <button onClick={onBack} className="flex items-center space-x-2 text-secondary mb-6 hover:underline">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>대시보드로 돌아가기</span>
                </button>
                <div className="text-center p-8 bg-dark-accent rounded-lg">
                    <h2 className="text-xl font-bold text-white">담당 트레이너가 없습니다.</h2>
                    <p className="text-gray-400 mt-2">수업을 예약하려면 먼저 담당 트레이너가 배정되어야 합니다.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="container mx-auto px-6 py-12">
                <button onClick={onBack} className="flex items-center space-x-2 text-secondary mb-6 hover:underline">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>대시보드로 돌아가기</span>
                </button>
                <h1 className="text-3xl font-bold mb-2">수업 예약</h1>
                <p className="text-gray-400 mb-6">트레이너의 예약 가능 시간을 확인하고 수업을 예약하세요.</p>

                <div className="flex space-x-4 text-sm mb-4">
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>예약 가능</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>내 예약</div>
                    <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-secondary mr-2"></span>취소된 예약</div>
                </div>
                <CalendarGrid 
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    events={calendarEvents}
                    onDateClick={() => {}} // Member cannot create slots
                />
            </div>
            {slotToBook && (
                <Modal isOpen={!!slotToBook} onClose={() => setSlotToBook(null)} title="수업 예약 확인">
                    <p className="text-gray-300">
                        <span className="font-bold text-secondary">{slotToBook.startTime.toDate().toLocaleString('ko-KR')}</span>
                        <br/>
                        위 시간에 수업을 예약하시겠습니까?
                    </p>
                    <div className="flex justify-end space-x-3 pt-6">
                        <button onClick={() => setSlotToBook(null)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">취소</button>
                        <button onClick={handleBookSlot} className="bg-secondary hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg">예약</button>
                    </div>
                </Modal>
            )}
             {appointmentToCancel && (
                <Modal isOpen={!!appointmentToCancel} onClose={() => setAppointmentToCancel(null)} title="예약 취소 확인">
                    <p className="text-gray-300">
                        <span className="font-bold text-primary">{appointmentToCancel.startTime.toDate().toLocaleString('ko-KR')}</span>
                        <br/>
                        예약된 수업을 취소하시겠습니까?
                    </p>
                     <p className="mt-2 text-sm text-gray-400">
                        취소하면 트레이너에게 알림이 전송되며, 해당 시간은 다른 회원이 예약할 수 있게 됩니다.
                    </p>
                    <div className="flex justify-end space-x-3 pt-6">
                        <button onClick={() => setAppointmentToCancel(null)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">닫기</button>
                        <button onClick={handleCancelAppointment} className="flex items-center space-x-2 bg-red-600/80 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg">
                            <TrashIcon className="w-5 h-5" />
                            <span>예약 취소</span>
                        </button>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default BookingCalendar;
