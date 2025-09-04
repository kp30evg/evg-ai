'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { CalendarView } from '@/components/calendar/CalendarView';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Calendar, Clock, Star, Users, Video, MessageSquare, FileText, ChevronLeft, ChevronRight, CalendarDays, CalendarClock, CheckCircle2 } from 'lucide-react';
import OAuthConnectionPrompt from '@/components/oauth/OAuthConnectionPrompt';
import { trpc } from '@/lib/trpc/client';

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
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCalendarConnection, setHasCalendarConnection] = useState(false);
  const [hasSyncedData, setHasSyncedData] = useState(false);
  const [todaysEvents, setTodaysEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'book' | 'availability' | 'stats'>('dashboard');

  // Check OAuth connection status
  const { data: oauthStatus, isLoading: checkingAuth } = trpc.oauth.checkConnection.useQuery(
    { service: 'calendar' },
    { 
      enabled: !!userId && !!orgId,
      refetchInterval: false 
    }
  );
  
  // Check if we have any calendar data synced
  const { data: calendarData } = trpc.unified.executeCommand.useMutation().data;

  // Load calendar events when connected
  useEffect(() => {
    const checkCalendarStatus = async () => {
      if (oauthStatus?.connected) {
        // Check if we have synced calendar data
        try {
          const response = await fetch('/api/calendar/events');
          if (response.ok) {
            const data = await response.json();
            if (data.events && data.events.length > 0) {
              setHasCalendarConnection(true);
              setHasSyncedData(true);
              loadEvents();
            } else {
              // Connected but no data - trigger sync
              setHasCalendarConnection(true);
              setHasSyncedData(false);
              // Redirect to syncing page
              router.push('/mail/syncing?return=/dashboard/calendar');
            }
          }
        } catch (error) {
          console.error('Error checking calendar status:', error);
        }
      } else {
        setHasCalendarConnection(false);
        setHasSyncedData(false);
      }
      setIsLoading(false);
    };
    
    checkCalendarStatus();
  }, [oauthStatus, orgId, router]);

  const handleConnectCalendar = () => {
    // For now, use the same Gmail OAuth which includes calendar scope
    // In production, you might want separate calendar-specific OAuth
    window.location.href = '/api/auth/gmail/connect?return=/dashboard/calendar';
  };

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
      console.log('Failed to load calendar events');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTodaysEvents = async () => {
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
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcoming = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= now && eventDate <= nextWeek;
    });

    upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    setUpcomingEvents(upcoming.slice(0, 5));
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
        const newEvent = {
          ...eventData,
          id: Date.now().toString()
        };
        setEvents(prev => [...prev, newEvent]);
        console.log('Event created successfully');
      } else if (modalMode === 'edit' && selectedEvent) {
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
    }
  };

  const handleGoogleSync = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/calendar/google/sync', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Synced ${result.importedCount || 0} events from Google Calendar`);
        loadEvents();
      } else {
        const error = await response.json();
        console.error(error.error || 'Failed to sync with Google Calendar');
      }
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking auth
  if (checkingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking connection status...</p>
        </div>
      </div>
    );
  }

  // Show connection prompt if not connected
  if (!hasCalendarConnection) {
    return (
      <div className="min-h-screen bg-white">
        <OAuthConnectionPrompt 
          type="calendar" 
          onConnect={handleConnectCalendar}
          userEmail={oauthStatus?.userEmail}
        />
      </div>
    );
  }

  // Main calendar interface (only shown when connected)
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200" style={{padding: '16px 24px'}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#E6F4EC] rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-[#1D5238]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-gray-900" style={{fontSize: '24px', fontWeight: 600}}>EverCal</h1>
                <span className="text-xs font-medium text-[#1D5238] bg-[#E6F4EC] px-2 py-1 rounded-full">Smart Scheduling</span>
              </div>
              <p className="text-gray-600 text-sm">Professional booking experiences that your clients will love</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{paddingLeft: '24px', paddingRight: '24px'}}>
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
      <div style={{padding: '24px'}}>
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3" style={{gap: '24px'}}>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                  <CalendarDays className="h-6 w-6 text-gray-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">{events.length || '43'}</div>
                <div className="text-gray-600 font-medium">Meetings this week</div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="w-12 h-12 bg-[#E6F4EC] rounded-xl flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-[#1D5238]" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">0.0h</div>
                <div className="text-gray-600 font-medium">Scheduled today</div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="w-12 h-12 bg-[#E6F4EC] rounded-xl flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-[#1D5238]" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">98%</div>
                <div className="text-gray-600 font-medium">Client satisfaction</div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3" style={{gap: '32px'}}>
              {/* Your Meeting Types */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Your Meeting Types</h2>
                  <Button variant="outline" className="text-sm">Manage All</Button>
                </div>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  {[
                    { name: 'Quick Chat', duration: '15 min', desc: 'Perfect for brief check-ins and quick questions.', bookings: '12 bookings this week', popular: true },
                    { name: 'Strategy Call', duration: '30 min', desc: 'Deep-dive conversations about projects and planning.', bookings: '8 bookings this week' },
                    { name: 'Team Sync', duration: '45 min', desc: 'Weekly team alignment and progress reviews.', bookings: '3 bookings this week' },
                    { name: 'Discovery Session', duration: '60 min', desc: 'Comprehensive sessions for new client onboarding.', bookings: '2 bookings this week' }
                  ].map((meeting) => (
                    <div key={meeting.name} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow cursor-pointer">
                      {meeting.popular && (
                        <div className="inline-block bg-[#1D5238] text-white text-xs font-medium rounded-full" style={{padding: '4px 8px', marginBottom: '12px'}}>Popular</div>
                      )}
                      <div className="flex items-start" style={{gap: '16px'}}>
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          {meeting.name === 'Quick Chat' && <MessageSquare className="h-6 w-6 text-gray-600" />}
                          {meeting.name === 'Strategy Call' && <Video className="h-6 w-6 text-gray-600" />}
                          {meeting.name === 'Team Sync' && <Users className="h-6 w-6 text-gray-600" />}
                          {meeting.name === 'Discovery Session' && <FileText className="h-6 w-6 text-gray-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center" style={{gap: '8px', marginBottom: '8px'}}>
                            <h3 className="font-semibold text-gray-900">{meeting.name}</h3>
                            <span className="text-sm text-gray-500">{meeting.duration}</span>
                          </div>
                          <p className="text-gray-600 text-sm" style={{marginBottom: '12px'}}>{meeting.desc}</p>
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
                  <div className="flex items-center" style={{gap: '8px'}}>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">Sep 1-7</span>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-7" style={{gap: '4px', marginBottom: '24px'}}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                    <div key={day} className={`text-center p-3 rounded-lg cursor-pointer ${
                      index === 2 ? 'bg-[#1D5238] text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                      <div className="text-xs font-medium">{day}</div>
                      <div className="text-lg font-bold">{index + 1}</div>
                      {index < 5 && <CheckCircle2 className="w-3 h-3 mx-auto mt-1 opacity-60" />}
                    </div>
                  ))}
                </div>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">Wed's Schedule</h4>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Add time
                    </Button>
                  </div>
                  
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
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
            <div className="w-16 h-16 bg-[#E6F4EC] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Video className="h-8 w-8 text-[#1D5238]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Book a Meeting</h3>
            <p className="text-gray-600">Meeting booking interface coming soon...</p>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#E6F4EC] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-[#1D5238]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Availability</h3>
            <p className="text-gray-600">Availability settings coming soon...</p>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#E6F4EC] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-[#1D5238]" />
            </div>
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