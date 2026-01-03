'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface EconomicEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  importance: 'low' | 'medium' | 'high';
  currency?: string;
  country?: string;
  actual_value?: string;
  forecast_value?: string;
  previous_value?: string;
}

export default function CalendarAdminPage() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EconomicEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    importance: 'medium' as 'low' | 'medium' | 'high',
    currency: '',
    country: '',
    actual_value: '',
    forecast_value: '',
    previous_value: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('economic_events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const supabase = createClient();
      
      if (editingEvent) {
        // Update existing event
        const { error } = await supabase
          .from('economic_events')
          .update({
            title: formData.title,
            description: formData.description,
            date: formData.date,
            importance: formData.importance,
            currency: formData.currency || null,
            country: formData.country || null,
            actual_value: formData.actual_value || null,
            forecast_value: formData.forecast_value || null,
            previous_value: formData.previous_value || null,
          })
          .eq('id', editingEvent.id);

        if (error) throw error;
        toast.success('Event updated successfully');
      } else {
        // Create new event
        const { error } = await supabase
          .from('economic_events')
          .insert({
            title: formData.title,
            description: formData.description,
            date: formData.date,
            importance: formData.importance,
            currency: formData.currency || null,
            country: formData.country || null,
            actual_value: formData.actual_value || null,
            forecast_value: formData.forecast_value || null,
            previous_value: formData.previous_value || null,
          });

        if (error) throw error;
        toast.success('Event created successfully');
      }

      setShowForm(false);
      setEditingEvent(null);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    }
  };

  const handleEdit = (event: EconomicEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date.slice(0, 16), // Remove seconds for datetime-local input
      importance: event.importance,
      currency: event.currency || '',
      country: event.country || '',
      actual_value: event.actual_value || '',
      forecast_value: event.forecast_value || '',
      previous_value: event.previous_value || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('economic_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      importance: 'medium',
      currency: '',
      country: '',
      actual_value: '',
      forecast_value: '',
      previous_value: '',
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEvent(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Calendar Admin</h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Event
            </button>
          </div>
        </div>

        {showForm && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingEvent ? 'Edit Event' : 'Add New Event'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Event title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Event description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Importance
                  </label>
                  <select
                    value={formData.importance}
                    onChange={(e) => setFormData({ ...formData, importance: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="USD, EUR, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="United States, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Previous Value
                  </label>
                  <input
                    type="text"
                    value={formData.previous_value}
                    onChange={(e) => setFormData({ ...formData, previous_value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="175K"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forecast Value
                  </label>
                  <input
                    type="text"
                    value={formData.forecast_value}
                    onChange={(e) => setFormData({ ...formData, forecast_value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="180K"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Value
                  </label>
                  <input
                    type="text"
                    value={formData.actual_value}
                    onChange={(e) => setFormData({ ...formData, actual_value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="182K"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button type="submit" className="btn-primary">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
                <button type="button" onClick={handleCancel} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {events.map(event => (
            <div key={event.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <span className={`badge ${
                      event.importance === 'high' ? 'bg-red-100 text-red-700' :
                      event.importance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {event.importance.toUpperCase()}
                    </span>
                    {event.currency && (
                      <span className="text-sm text-gray-500">{event.currency}</span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-2">{event.description}</p>
                  <div className="text-sm text-gray-500 mb-2">
                    {new Date(event.date).toLocaleString()}
                  </div>
                  {(event.forecast_value || event.previous_value || event.actual_value) && (
                    <div className="grid grid-cols-3 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
                      {event.previous_value && (
                        <div>
                          <span className="text-gray-500">Previous:</span>
                          <span className="ml-1 font-medium">{event.previous_value}</span>
                        </div>
                      )}
                      {event.forecast_value && (
                        <div>
                          <span className="text-gray-500">Forecast:</span>
                          <span className="ml-1 font-medium">{event.forecast_value}</span>
                        </div>
                      )}
                      {event.actual_value && (
                        <div>
                          <span className="text-gray-500">Actual:</span>
                          <span className="ml-1 font-medium text-green-600">{event.actual_value}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(event)}
                    className="p-2 text-gray-500 hover:text-primary-600"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 text-gray-500 hover:text-red-600"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12">
            <CalendarDaysIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500">Create your first calendar event to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
