/**
 * Events Page - Browse and manage events
 */
import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Badge, Button, Select, Spinner, EmptyState, Modal, Input, TextArea } from '../../components/common';
import { eventsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    CalendarIcon,
    MapPinIcon,
    UsersIcon,
    PlusIcon,
    VideoCameraIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

export default function Events() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [myEvents, setMyEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('browse');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_type: 'WORKSHOP',
        start_datetime: '',
        end_datetime: '',
        is_online: false,
        location: '',
        meeting_link: '',
        max_attendees: '',
    });
    const [saving, setSaving] = useState(false);

    const eventTypes = [
        { value: 'WORKSHOP', label: 'Workshop' },
        { value: 'SEMINAR', label: 'Seminar' },
        { value: 'WEBINAR', label: 'Webinar' },
        { value: 'CONFERENCE', label: 'Conference' },
        { value: 'MEETUP', label: 'Meetup' },
        { value: 'OTHER', label: 'Other' },
    ];

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const [allEvents, userEvents] = await Promise.all([
                eventsAPI.listEvents(),
                eventsAPI.getMyEvents(),
            ]);
            setEvents(allEvents.data.results || allEvents.data);
            setMyEvents(userEvents.data.results || userEvents.data);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCreateEvent = async () => {
        setSaving(true);
        try {
            await eventsAPI.createEvent({
                ...formData,
                max_attendees: formData.max_attendees || null,
            });
            setShowCreateModal(false);
            setFormData({
                title: '',
                description: '',
                event_type: 'WORKSHOP',
                start_datetime: '',
                end_datetime: '',
                is_online: false,
                location: '',
                meeting_link: '',
                max_attendees: '',
            });
            fetchEvents();
        } catch (error) {
            console.error('Failed to create event:', error);
            alert('Failed to create event. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleJoin = async (eventId) => {
        try {
            const response = await eventsAPI.joinEvent(eventId);
            setEvents(prev => prev.map(event =>
                event.id === eventId
                    ? { ...event, is_attending: response.data.attending }
                    : event
            ));
        } catch (error) {
            console.error('Failed to join event:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const displayEvents = activeTab === 'browse' ? events : myEvents;

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Events</h1>
                    <p className="text-slate-500 mt-1">Discover workshops, seminars, and networking opportunities</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <PlusIcon className="w-5 h-5" />
                    Create Event
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('browse')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'browse'
                            ? 'border-[#1e3a5f] text-[#1e3a5f]'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Browse Events
                </button>
                <button
                    onClick={() => setActiveTab('my')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'my'
                            ? 'border-[#1e3a5f] text-[#1e3a5f]'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    My Events
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Spinner size="lg" />
                </div>
            ) : displayEvents.length === 0 ? (
                <EmptyState
                    icon={CalendarIcon}
                    title={activeTab === 'browse' ? "No upcoming events" : "You haven't created any events"}
                    description={activeTab === 'browse'
                        ? "Check back later for new events"
                        : "Create your first event to engage with the community"
                    }
                    action={() => setShowCreateModal(true)}
                    actionLabel="Create Event"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayEvents.map((event) => (
                        <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Event Image/Header */}
                            <div className="h-32 bg-gradient-to-br from-[#1e3a5f] to-[#3b5998] flex items-center justify-center">
                                {event.is_online ? (
                                    <VideoCameraIcon className="w-12 h-12 text-white/50" />
                                ) : (
                                    <CalendarIcon className="w-12 h-12 text-white/50" />
                                )}
                            </div>

                            <div className="p-5">
                                <div className="flex items-start justify-between mb-2">
                                    <Badge variant="primary">{event.event_type}</Badge>
                                    {event.is_online && <Badge variant="info">Online</Badge>}
                                </div>

                                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">{event.title}</h3>

                                <div className="space-y-2 text-sm text-slate-500 mb-4">
                                    <p className="flex items-center gap-2">
                                        <ClockIcon className="w-4 h-4" />
                                        {formatDate(event.start_datetime)}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        {event.is_online ? (
                                            <>
                                                <VideoCameraIcon className="w-4 h-4" />
                                                Online Event
                                            </>
                                        ) : (
                                            <>
                                                <MapPinIcon className="w-4 h-4" />
                                                {event.location || 'Location TBD'}
                                            </>
                                        )}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <UsersIcon className="w-4 h-4" />
                                        {event.attendee_count || 0} attending
                                        {event.max_attendees && ` / ${event.max_attendees} max`}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-slate-400">
                                        By {event.organizer?.display_name || event.organizer?.username}
                                    </p>
                                    {activeTab === 'browse' && (
                                        <Button
                                            variant={event.is_attending ? 'secondary' : 'primary'}
                                            size="sm"
                                            onClick={() => handleJoin(event.id)}
                                        >
                                            {event.is_attending ? 'Leave' : 'Join'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Event Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create Event"
                size="lg"
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <Input
                        label="Event Title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Teaching Strategies Workshop"
                        required
                    />

                    <TextArea
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe your event..."
                        rows={3}
                    />

                    <Select
                        label="Event Type"
                        name="event_type"
                        value={formData.event_type}
                        onChange={handleChange}
                        options={eventTypes}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Date & Time"
                            name="start_datetime"
                            type="datetime-local"
                            value={formData.start_datetime}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="End Date & Time"
                            name="end_datetime"
                            type="datetime-local"
                            value={formData.end_datetime}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="is_online"
                            checked={formData.is_online}
                            onChange={handleChange}
                            className="rounded"
                        />
                        <span className="text-sm text-slate-700">This is an online event</span>
                    </label>

                    {formData.is_online ? (
                        <Input
                            label="Meeting Link"
                            name="meeting_link"
                            type="url"
                            value={formData.meeting_link}
                            onChange={handleChange}
                            placeholder="https://zoom.us/..."
                        />
                    ) : (
                        <Input
                            label="Location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Event venue address"
                        />
                    )}

                    <Input
                        label="Max Attendees (Optional)"
                        name="max_attendees"
                        type="number"
                        value={formData.max_attendees}
                        onChange={handleChange}
                        placeholder="Leave empty for unlimited"
                    />

                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateEvent} loading={saving}>
                            Create Event
                        </Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
