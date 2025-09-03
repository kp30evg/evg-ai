'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { CalendarView } from '@/components/calendar/CalendarView';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';

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

export default function CalendarPage() {
  const { userId, orgId } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [todaysEvents, setTodaysEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'book' | 'availability' | 'stats'>('dashboard');

  // Load calendar events
  useEffect(() => {
    if (orgId) {
      loadEvents();
    }
  }, [orgId]);

  // Update today's and upcoming events when events change
  useEffect(() => {
    if (events.length > 0) {
      loadTodaysEvents();
      loadUpcomingEvents();
    }
  }, [events]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/calendar/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      const fetchedEvents: Event[] = data.events.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        attendees: event.attendees || [],
        location: event.location || '',
        status: event.status
      }));
      
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      // Use console.log instead of toast since toast isn't imported
      console.log('Failed to load calendar events');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTodaysEvents = async () => {
    // Filter events for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= today && eventDate < tomorrow;
    });

    setTodaysEvents(todayEvents);
  };

  const loadUpcomingEvents = async () => {
    // Get events for the next 7 days
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcoming = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= now && eventDate <= nextWeek;
    });

    // Sort by date
    upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    setUpcomingEvents(upcoming.slice(0, 5)); // Show only next 5 events
  };

  const handleCreateEvent = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEditEvent = () => {
    setModalMode('edit');
  };

  const handleSaveEvent = async (eventData: Event) => {
    try {
      if (modalMode === 'create') {
        // Create new event
        const newEvent = {
          ...eventData,
          id: Date.now().toString() // Simple ID generation for demo
        };
        setEvents(prev => [...prev, newEvent]);
        console.log('Event created successfully');
      } else if (modalMode === 'edit' && selectedEvent) {
        // Update existing event
        setEvents(prev => prev.map(e => 
          e.id === selectedEvent.id ? { ...eventData, id: selectedEvent.id } : e
        ));
        console.log('Event updated successfully');
      }
      
      setIsModalOpen(false);
      loadTodaysEvents();
      loadUpcomingEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      console.error('Failed to save event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      console.log('Event deleted successfully');
      setIsModalOpen(false);
      loadTodaysEvents();
      loadUpcomingEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      console.error('Failed to delete event');
    }
  };

  const handleGoogleSync = async () => {
    try {
      setIsLoading(true);
      
      // This would normally call the Google Calendar sync API
      const response = await fetch('/api/calendar/google/sync', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Synced ${result.importedCount || 0} events from Google Calendar`);
        loadEvents(); // Reload events
      } else {
        const error = await response.json();
        console.error(error.error || 'Failed to sync with Google Calendar');
      }
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error);
      console.error('Failed to sync with Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-[#1D5238] rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded" style={{clipPath: 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)'}}></div>
          </div>
          <span className="text-sm font-medium text-[#1D5238] bg-[#E6F4EC] px-3 py-1 rounded-full">Smart Scheduling</span>
        </div>
        <h1 className="text-gray-900 mb-2" style={{fontSize: '48px', lineHeight: '52px', fontWeight: 700}}>Let's Get Your Day in <span style={{color: '#1D5238'}}>Order.</span></h1>
        <p className="text-gray-600" style={{fontSize: '18px', lineHeight: '28px'}}>Create beautiful, professional booking experiences that your clients will love. No more back-and-forth emails or scheduling stress.</p>
      </div>

      {/* Tab Navigation */}
      <div className="px-6">
        <div className="flex items-center" style={{gap: '4px', paddingTop: '24px'}}>
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'calendar', label: 'Calendar' },
            { key: 'book', label: 'Book Meeting' },
            { key: 'availability', label: 'Availability' },
            { key: 'stats', label: 'Stats' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`transition-colors ${
                activeTab === tab.key 
                  ? 'text-[#1D5238] bg-[#E6F4EC]' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                lineHeight: '20px',
                fontWeight: activeTab === tab.key ? 600 : 500,
                borderRadius: '8px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                  <div className="w-6 h-6 bg-gray-400 rounded" style={{clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 100%, 0% 100%)'}}></div>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">{events.length || '23'}</div>
                <div className="text-gray-600 font-medium">Meetings this week</div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="w-12 h-12 bg-[#E6F4EC] rounded-xl flex items-center justify-center mb-4">
                  <div className="w-6 h-6 border-2 border-[#1D5238] rounded-full"></div>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">0.0h</div>
                <div className="text-gray-600 font-medium">Scheduled today</div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                  <div className="w-6 h-6 text-yellow-600">⭐</div>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">98%</div>
                <div className="text-gray-600 font-medium">Client satisfaction</div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Your Meeting Types */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Your Meeting Types</h2>
                  <Button variant="outline" className="text-sm">Manage All</Button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { name: 'Quick Chat', duration: '15 min', desc: 'Perfect for brief check-ins and quick questions.', bookings: '12 bookings this week', popular: true },
                    { name: 'Strategy Call', duration: '30 min', desc: 'Deep-dive conversations about projects and planning.', bookings: '8 bookings this week' },
                    { name: 'Team Sync', duration: '45 min', desc: 'Weekly team alignment and progress reviews.', bookings: '3 bookings this week' },
                    { name: 'Discovery Session', duration: '60 min', desc: 'Comprehensive sessions for new client onboarding.', bookings: '2 bookings this week' }
                  ].map((meeting) => (
                    <div key={meeting.name} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-sm transition-shadow cursor-pointer">
                      {meeting.popular && (
                        <div className="inline-block bg-[#1D5238] text-white text-xs font-medium px-2 py-1 rounded-full mb-3">Popular</div>
                      )}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <div className="w-6 h-6 bg-gray-400 rounded"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{meeting.name}</h3>
                            <span className="text-sm text-gray-500">{meeting.duration}</span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{meeting.desc}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{meeting.bookings}</span>
                            <Button variant="outline" size="sm" className="text-xs">Configure</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Your Week */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Your Week</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">‹</Button>
                    <span className="text-sm font-medium">Sep 1-7</span>
                    <Button variant="outline" size="sm">›</Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-6">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                    <div key={day} className={`text-center p-3 rounded-lg cursor-pointer ${
                      index === 2 ? 'bg-[#1D5238] text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                      <div className="text-xs font-medium">{day}</div>
                      <div className="text-lg font-bold">{index + 1}</div>
                      {index < 5 && <div className="w-2 h-2 bg-current rounded-full mx-auto mt-1 opacity-60"></div>}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">Wed's Schedule</h4>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add time
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { time: '09:30', title: 'Sprint Planning', duration: '90-min' },
                      { time: '13:00', title: 'Lunch Meeting', duration: '60-min' },
                      { time: '15:30', title: 'Code Review', duration: '30-min' }
                    ].map((event) => (
                      <div key={event.time} className="flex items-center gap-3">
                        <div className="text-sm font-medium text-gray-600 w-12">{event.time}</div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{event.title}</div>
                          <div className="text-xs text-gray-500">{event.duration}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            events={events}
            onCreateEvent={handleCreateEvent}
            onEventClick={handleEventClick}
            workspaceId={orgId || ''}
          />
        )}

        {activeTab === 'book' && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Book a Meeting</h3>
            <p className="text-gray-600">Meeting booking interface coming soon...</p>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Availability</h3>
            <p className="text-gray-600">Availability settings coming soon...</p>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Stats</h3>
            <p className="text-gray-600">Statistics dashboard coming soon...</p>
          </div>
        )}
      </div>

      {/* Event Modal - Temporarily disabled */}
      {isModalOpen && (
        <div>Event Modal would show here</div>
      )}
    </div>
  );
}