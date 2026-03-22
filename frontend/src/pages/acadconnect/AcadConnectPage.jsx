import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/Sidebar';
import { Card, Tabs, Spinner, Avatar, Button } from '../../components/common';
import AcadConnectButton from '../../components/acadconnect/AcadConnectButton';
import { acadConnectAPI } from '../../services/acadConnectAPI';
import { MapPinIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const TABS = [
    { id: 'connections', label: 'My Connections' },
    { id: 'requests', label: 'Requests' },
    { id: 'suggestions', label: 'Suggestions' }
];

export default function AcadConnectPage() {
    const [activeTab, setActiveTab] = useState('connections');
    const [connections, setConnections] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        // Since AcadConnectButton modifies state independently, we refetch to keep data fresh when swapping tabs
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'connections') {
                const res = await acadConnectAPI.getConnections();
                setConnections(res.data.results || res.data);
            } else if (activeTab === 'requests') {
                const [receivedRes, sentRes] = await Promise.all([
                    acadConnectAPI.getReceivedRequests(),
                    acadConnectAPI.getSentRequests()
                ]);
                setReceivedRequests(receivedRes.data.results || receivedRes.data);
                setSentRequests(sentRes.data.results || sentRes.data);
            } else if (activeTab === 'suggestions') {
                const res = await acadConnectAPI.getSuggestions();
                setSuggestions(res.data.results || res.data);
            }
        } catch (error) {
            console.error('Error fetching AcadConnect data:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderUserCard = (user, extraBtn = null) => {
        const title = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
        const subtitle = user.headline || 'Educator';
        const displayInst = user.current_institution_name;

        return (
            <Card key={user.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link to={`/teachers/${user.id}`} className="shrink-0">
                    <Avatar src={user.profile_photo_url || user.profile_photo} name={title} size="lg" />
                </Link>
                <div className="flex-1 min-w-0">
                    <Link to={`/teachers/${user.id}`}>
                        <h4 className="font-semibold text-slate-900 hover:text-blue-600 truncate">{title}</h4>
                    </Link>
                    <p className="text-sm text-slate-600 truncate">{subtitle}</p>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                        {displayInst && (
                            <span className="flex items-center gap-1">
                                <BuildingOfficeIcon className="w-3.5 h-3.5" />
                                {displayInst}
                            </span>
                        )}
                        {(user.city || user.state) && (
                            <span className="flex items-center gap-1">
                                <MapPinIcon className="w-3.5 h-3.5" />
                                {[user.city, user.state].filter(Boolean).join(', ')}
                            </span>
                        )}
                    </div>
                    {user.mutual_connections > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                            {user.mutual_connections} mutual connection{user.mutual_connections !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
                <div className="shrink-0 w-full sm:w-auto mt-3 sm:mt-0 flex flex-col sm:flex-row gap-2">
                    {extraBtn}
                    <div onClick={() => {
                        // refetch the lists so that when user interacts (accepts, withdraws) it disappears 
                        // It gets messy to manage all arrays individually, so we can lazily refetch in the background.
                        setTimeout(fetchData, 1500);
                    }}>
                        <AcadConnectButton userId={user.id} />
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">AcadConnect</h1>
                    <p className="text-slate-500 mt-1">
                        Grow and manage your professional educational network.
                    </p>
                </div>

                <div className="mb-6">
                    <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeTab === 'connections' && (
                            <>
                                {connections.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        No connections yet. Go to Suggestions to find people you know.
                                    </div>
                                ) : (
                                    connections.map(conn => renderUserCard(conn.connected_user, 
                                        <span className="text-xs text-slate-400 self-center hidden sm:inline mr-2">Connected {new Date(conn.connected_since).toLocaleDateString()}</span>
                                    ))
                                )}
                            </>
                        )}

                        {activeTab === 'requests' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Received Requests</h3>
                                    {receivedRequests.length === 0 ? (
                                        <p className="text-sm text-slate-500 border border-dashed border-slate-200 p-8 rounded-xl text-center">No pending received requests.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {receivedRequests.map(req => (
                                                <div key={req.id}>
                                                    {renderUserCard(req.sender)}
                                                    {req.message && (
                                                        <div className="ml-16 sm:ml-20 mt-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 italic border border-slate-100 relative">
                                                            <div className="absolute -top-2 left-4 w-4 h-4 bg-slate-50 border-t border-l border-slate-100 transform rotate-45"></div>
                                                            "{req.message}"
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Sent Requests</h3>
                                    {sentRequests.length === 0 ? (
                                        <p className="text-sm text-slate-500 border border-dashed border-slate-200 p-8 rounded-xl text-center">No pending sent requests.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {sentRequests.map(req => renderUserCard(req.receiver))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'suggestions' && (
                            <>
                                {suggestions.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        No new suggestions at the moment.
                                    </div>
                                ) : (
                                    suggestions.map(user => renderUserCard(user))
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
