import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db } from '../firebase';
import { Notification } from '../App';
import { ArrowLeftIcon, ClockIcon } from '../components/icons';

interface MessageHistoryProps {
    user: firebase.User;
    onBack: () => void;
}

const MessageHistory: React.FC<MessageHistoryProps> = ({ user, onBack }) => {
    const [messages, setMessages] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = db.collection('notifications')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
                setMessages(data);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching messages:", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [user.uid]);

    const timeSince = (date: firebase.firestore.Timestamp): string => {
        if (!date) return '';
        const seconds = Math.floor((new Date().getTime() - date.toDate().getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "년 전";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "달 전";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "일 전";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "시간 전";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "분 전";
        return "방금 전";
    };


    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center space-x-2 text-secondary mb-6 hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>대시보드로 돌아가기</span>
            </button>
            <h1 className="text-3xl font-bold mb-2">메시지 내역</h1>
            <p className="text-gray-400 mb-6">트레이너가 보낸 메시지와 알림을 확인합니다.</p>

            <div className="bg-dark-accent p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
                {loading ? (
                    <p>메시지를 불러오는 중...</p>
                ) : messages.length > 0 ? (
                    <div className="space-y-4">
                        {messages.map(msg => (
                             <div key={msg.id} className={`p-4 rounded-md ${msg.read ? 'bg-dark' : 'bg-primary/10 border border-primary/50'}`}>
                                 <p className={`text-sm ${msg.read ? 'text-gray-300' : 'text-white'}`}>{msg.message}</p>
                                 <p className="text-xs text-gray-500 mt-2 flex items-center">
                                     <ClockIcon className="w-3 h-3 mr-1" />
                                     {timeSince(msg.createdAt)}
                                 </p>
                             </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">받은 메시지가 없습니다.</p>
                )}
            </div>
        </div>
    );
};

export default MessageHistory;
