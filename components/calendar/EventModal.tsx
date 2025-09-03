'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Calendar, Clock, Users, MapPin, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Event {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  location?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface EventModalProps {
  event?: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  defaultDate?: Date;
  mode: 'create' | 'edit' | 'view';
}

export function EventModal({ 
  event, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  defaultDate,
  mode 
}: EventModalProps) {
  const [formData, setFormData] = useState<Event>({
    title: '',
    description: '',
    startTime: defaultDate || new Date(),
    endTime: defaultDate || new Date(),
    attendees: [],
    location: '',
    status: 'pending'
  });
  
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime)
      });
    } else if (defaultDate) {
      const startTime = new Date(defaultDate);
      startTime.setHours(9, 0, 0, 0); // Default to 9 AM
      const endTime = new Date(defaultDate);
      endTime.setHours(10, 0, 0, 0); // Default to 10 AM
      
      setFormData({
        title: '',
        description: '',
        startTime,
        endTime,
        attendees: [],
        location: '',
        status: 'pending'
      });
    }
  }, [event, defaultDate]);

  const handleInputChange = (field: keyof Event, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateTimeChange = (field: 'startTime' | 'endTime', date: string, time: string) => {
    const dateTime = new Date(`${date}T${time}`);
    handleInputChange(field, dateTime);
  };

  const addAttendee = () => {
    if (attendeeEmail && !formData.attendees.includes(attendeeEmail)) {
      handleInputChange('attendees', [...formData.attendees, attendeeEmail]);
      setAttendeeEmail('');
    }
  };

  const removeAttendee = (email: string) => {
    handleInputChange('attendees', formData.attendees.filter(a => a !== email));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (event?.id && onDelete) {
      setIsLoading(true);
      try {
        await onDelete(event.id);
        onClose();
      } catch (error) {
        console.error('Error deleting event:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isReadOnly = mode === 'view';
  const isEditing = mode === 'edit';
  const isCreating = mode === 'create';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            <span>
              {isCreating ? 'Create Event' : isEditing ? 'Edit Event' : 'Event Details'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {isCreating ? 'Create a new calendar event' : 
             isEditing ? 'Edit event details' : 
             'View event information'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter event description"
              disabled={isReadOnly}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date & Time *</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  type="date"
                  value={format(formData.startTime, 'yyyy-MM-dd')}
                  onChange={(e) => handleDateTimeChange('startTime', e.target.value, format(formData.startTime, 'HH:mm'))}
                  disabled={isReadOnly}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={format(formData.startTime, 'HH:mm')}
                  onChange={(e) => handleDateTimeChange('startTime', format(formData.startTime, 'yyyy-MM-dd'), e.target.value)}
                  disabled={isReadOnly}
                  className="w-32"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date & Time *</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  type="date"
                  value={format(formData.endTime, 'yyyy-MM-dd')}
                  onChange={(e) => handleDateTimeChange('endTime', e.target.value, format(formData.endTime, 'HH:mm'))}
                  disabled={isReadOnly}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={format(formData.endTime, 'HH:mm')}
                  onChange={(e) => handleDateTimeChange('endTime', format(formData.endTime, 'yyyy-MM-dd'), e.target.value)}
                  disabled={isReadOnly}
                  className="w-32"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Enter location or meeting link"
              disabled={isReadOnly}
              className="mt-1"
            />
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleInputChange('status', value)}
              disabled={isReadOnly}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Attendees */}
          <div>
            <Label>Attendees</Label>
            
            {/* Add attendee input */}
            {!isReadOnly && (
              <div className="flex space-x-2 mt-2 mb-3">
                <Input
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  placeholder="Enter email address"
                  type="email"
                  className="flex-1"
                />
                <Button type="button" onClick={addAttendee} variant="outline">
                  Add
                </Button>
              </div>
            )}

            {/* Attendee list */}
            {formData.attendees.length > 0 ? (
              <div className="space-y-2 mt-2">
                {formData.attendees.map((email, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{email}</span>
                    </div>
                    {!isReadOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttendee(email)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">No attendees added</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div>
            {(isEditing || isCreating) && event?.id && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            
            {!isReadOnly && (
              <Button 
                type="button" 
                onClick={handleSave}
                disabled={isLoading || !formData.title.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Event'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}