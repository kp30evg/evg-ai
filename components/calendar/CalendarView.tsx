'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { Calendar, Clock, Users, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// // import { Badge } from '@/components/ui/badge';

interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  location?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface CalendarViewProps {
  events?: Event[];
  onCreateEvent?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
  workspaceId: string;
}

export function CalendarView({ events = [], onCreateEvent, onEventClick, workspaceId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<Event[]>(events);

  // Get calendar days for current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    return calendarEvents.filter(event => 
      isSameDay(new Date(event.startTime), date)
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleCreateEvent = () => {
    if (selectedDate && onCreateEvent) {
      onCreateEvent(selectedDate);
    }
  };

  const formatEventTime = (event: Event) => {
    const start = format(new Date(event.startTime), 'h:mm a');
    const end = format(new Date(event.endTime), 'h:mm a');
    return `${start} - ${end}`;
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Clean Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 h-8 px-3 text-xs"
            size="sm"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
            className="bg-[#1D5238] text-white border-[#1D5238] hover:bg-[#1D5238]/90 h-8 px-3 text-xs"
            size="sm"
          >
            Today
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 h-8 px-3 text-xs"
            size="sm"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Clean Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-50 p-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map(day => {
          const dayEvents = getEventsForDate(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`
                bg-white min-h-[80px] p-2 flex flex-col justify-start cursor-pointer transition-all duration-200 relative
                ${isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'}
                ${!isCurrentMonth ? 'text-gray-400 bg-gray-50/50' : ''}
                ${isCurrentDay ? 'bg-[#1D5238] text-white' : ''}
              `}
              onClick={() => handleDateClick(day)}
            >
              <div className={`
                text-sm font-medium mb-2
                ${isCurrentDay ? 'text-white' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
              `}>
                {format(day, 'd')}
              </div>
              
              {/* Events for this day */}
              <div className="space-y-1 flex-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className={`
                      text-xs px-2 py-1 rounded truncate cursor-pointer transition-colors duration-200
                      ${event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}
                      ${isCurrentDay ? 'bg-white/20 text-white' : ''}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    title={`${event.title} - ${formatEventTime(event)}`}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className={`text-xs text-center font-medium ${isCurrentDay ? 'text-white/80' : 'text-gray-500'}`}>
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
              
              {/* Event indicator dot */}
              {dayEvents.length > 0 && (
                <div className={`absolute bottom-2 right-2 w-2 h-2 rounded-full ${isCurrentDay ? 'bg-white/60' : 'bg-[#1D5238]'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}