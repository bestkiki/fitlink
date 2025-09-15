import React, { useState, useEffect, useRef } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { db } from '../firebase';
import { Notification } from '../App';
import { BellIcon, ClockIcon } from './icons';

interface NotificationsBellProps {
    user: firebase.User;
}

const NotificationsBell: React.FC<NotificationsBellProps> = ({ user }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = db.collection('notifications')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .onSnapshot(snapshot => {
                const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
                setNotifications(notifs);
            });

        return () => unsubscribe();
    }, [user.uid]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleToggle = () => setIsOpen(!isOpen);

    const handleMarkAsRead = async (id: string) => {
        await db.collection('notifications').doc(id).update({ read: true });
    };

    const timeSince = (date: firebase.firestore.Timestamp): string => {
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
        <div className="relative" ref={dropdownRef}>
            <button onClick={handleToggle} className="relative text-gray-300 hover:text-white transition-colors p-2">
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-dark-accent rounded-lg shadow-xl border border-gray-700 z-50">
                    <div className="p-3 border-b border-gray-700">
                        <h3 className="font-semibold text-white">알림</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`p-3 border-b border-gray-700/50 hover:bg-dark cursor-pointer ${!notif.read ? 'bg-primary/10' : ''}`}
                                    onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                                >
                                    <p className={`text-sm ${notif.read ? 'text-gray-400' : 'text-white'}`}>{notif.message}</p>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                                        <ClockIcon className="w-3 h-3 mr-1" />
                                        {timeSince(notif.createdAt)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-sm text-gray-400">새로운 알림이 없습니다.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsBell;
