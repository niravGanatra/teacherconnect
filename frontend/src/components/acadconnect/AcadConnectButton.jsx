import { useState, useEffect, useRef } from 'react';
import { UserPlus, Clock, Check, ChevronDown } from 'lucide-react';
import { acadConnectAPI } from '../../services/acadConnectAPI';

export default function AcadConnectButton({ userId, initialStatus, onStatusChange }) {
    const [status, setStatus] = useState(initialStatus || 'not_connected');
    const [requestId, setRequestId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPopover, setShowPopover] = useState(false);
    const [message, setMessage] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const popoverRef = useRef(null);

    useEffect(() => {
        if (onStatusChange) {
            onStatusChange(status);
        }
    }, [status, onStatusChange]);

    useEffect(() => {
        let isMounted = true;
        if (!initialStatus && userId) {
            acadConnectAPI.getConnectionStatus(userId)
                .then(res => {
                    if (isMounted) {
                        setStatus(res.data.status);
                        setRequestId(res.data.request_id);
                    }
                })
                .catch(err => console.error('Failed to get connection status', err));
        }
        return () => { isMounted = false; };
    }, [userId, initialStatus]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setShowPopover(false);
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSendRequest = async () => {
        setLoading(true);
        try {
            // Optimistic UI
            setStatus('request_sent');
            setShowPopover(false);
            const res = await acadConnectAPI.sendRequest(userId, message);
            setRequestId(res.data.id);
        } catch (error) {
            console.error(error);
            setStatus('not_connected'); // revert on error
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!requestId) return;
        setLoading(true);
        try {
            setStatus('connected');
            await acadConnectAPI.acceptRequest(requestId);
        } catch (error) {
            console.error(error);
            setStatus('request_received');
        } finally {
            setLoading(false);
        }
    };

    const handleDecline = async () => {
        if (!requestId) return;
        setLoading(true);
        try {
            setStatus('not_connected');
            await acadConnectAPI.declineRequest(requestId);
        } catch (error) {
            console.error(error);
            setStatus('request_received');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!requestId) return;
        setLoading(true);
        try {
            setStatus('not_connected');
            await acadConnectAPI.withdrawRequest(requestId);
        } catch (error) {
            console.error(error);
            setStatus('request_sent');
        } finally {
            setLoading(false);
            setShowDropdown(false);
        }
    };

    const handleRemove = async () => {
        setLoading(true);
        try {
            setStatus('not_connected');
            await acadConnectAPI.removeConnection(userId);
        } catch (error) {
            console.error(error);
            setStatus('connected');
        } finally {
            setLoading(false);
            setShowDropdown(false);
        }
    };

    if (status === 'self') return null;

    return (
        <div className="relative inline-block" ref={popoverRef}>
            {status === 'not_connected' && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPopover(!showPopover);
                    }}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
                >
                    <UserPlus className="w-4 h-4" /> Connect
                </button>
            )}

            {status === 'request_sent' && (
                <div className="flex items-center relative">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowDropdown(!showDropdown);
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition"
                    >
                        <Clock className="w-4 h-4" /> Request Sent <ChevronDown className="w-4 h-4" />
                    </button>
                    {showDropdown && (
                        <div className="absolute top-full mt-1 right-0 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-10">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleWithdraw();
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 transition"
                            >
                                Withdraw Request
                            </button>
                        </div>
                    )}
                </div>
            )}

            {status === 'request_received' && (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAccept();
                        }}
                        disabled={loading}
                        className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition"
                    >
                        <Check className="w-4 h-4" /> Accept
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDecline();
                        }}
                        disabled={loading}
                        className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition"
                    >
                        Decline
                    </button>
                </div>
            )}

            {status === 'connected' && (
                <div className="flex items-center relative">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowDropdown(!showDropdown);
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition"
                    >
                        <Check className="w-4 h-4" /> Connected <ChevronDown className="w-4 h-4" />
                    </button>
                    {showDropdown && (
                        <div className="absolute top-full mt-1 right-0 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-10">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRemove();
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 transition"
                            >
                                Remove Connection
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Connect Popover */}
            {showPopover && status === 'not_connected' && (
                <div className="absolute top-full mt-2 right-0 md:left-0 md:right-auto w-72 p-4 bg-white border border-slate-200 shadow-xl rounded-lg z-20">
                    <h3 className="font-medium text-slate-900 mb-2">Send Connection Request</h3>
                    <textarea
                        className="w-full h-24 p-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3 resize-none"
                        placeholder="Add an optional message..."
                        maxLength={300}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowPopover(false);
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSendRequest();
                            }}
                            disabled={loading}
                            className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            Send Request
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
