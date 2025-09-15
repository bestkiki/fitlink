import React from 'react';
import { ArrowLeftIcon } from './icons'; // Using ArrowLeftIcon for both directions

interface CalendarEvent {
    date: Date;
    title: string;
    color: 'green' | 'blue' | 'orange';
    onClick: () => void;
}

interface CalendarGridProps {
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    events: CalendarEvent[];
    onDateClick: (date: Date) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ currentDate, setCurrentDate, events, onDateClick }) => {
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();

    const getDaysInPrevMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
    const daysInPrevMonth = getDaysInPrevMonth(currentDate.getFullYear(), currentDate.getMonth());

    const calendarDays = [];

    // Previous month's days
    for (let i = 0; i < startDay; i++) {
        calendarDays.push({ day: daysInPrevMonth - startDay + 1 + i, isCurrentMonth: false });
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push({ day: i, isCurrentMonth: true });
    }

    // Next month's days
    const remainingCells = 42 - calendarDays.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingCells; i++) {
        calendarDays.push({ day: i, isCurrentMonth: false });
    }
    
    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const isSameDay = (d1: Date, d2: Date) => 
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    return (
        <div className="bg-dark-accent p-4 sm:p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-dark"><ArrowLeftIcon className="w-5 h-5" /></button>
                <h2 className="text-xl font-bold text-white">
                    {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                </h2>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-dark"><ArrowLeftIcon className="w-5 h-5 transform rotate-180" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {daysOfWeek.map(day => <div key={day} className="font-semibold text-gray-400 py-2">{day}</div>)}
                {calendarDays.map((calDay, index) => {
                    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), calDay.day);
                    const dayEvents = calDay.isCurrentMonth ? events.filter(e => isSameDay(e.date, dayDate)) : [];
                    const isToday = calDay.isCurrentMonth && isSameDay(new Date(), dayDate);

                    return (
                        <div
                            key={index}
                            className={`h-24 sm:h-32 p-1.5 border border-dark rounded-md flex flex-col ${calDay.isCurrentMonth ? 'bg-dark/50' : 'bg-dark/20 text-gray-600'} ${calDay.isCurrentMonth ? 'cursor-pointer hover:bg-dark' : 'cursor-default'}`}
                            onClick={() => calDay.isCurrentMonth && onDateClick(dayDate)}
                        >
                            <span className={`w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white font-bold' : ''}`}>{calDay.day}</span>
                            <div className="flex-grow overflow-y-auto text-xs mt-1 space-y-1">
                                {dayEvents.map((event, i) => {
                                    const colorClasses = {
                                        green: 'bg-green-500/80 hover:bg-green-500',
                                        blue: 'bg-blue-500/80 hover:bg-blue-500',
                                        orange: 'bg-secondary/80 hover:bg-secondary'
                                    };
                                    return (
                                        <button key={i} onClick={(e) => { e.stopPropagation(); event.onClick(); }} className={`w-full p-1 rounded ${colorClasses[event.color]} text-white truncate`}>
                                            {event.title}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarGrid;
