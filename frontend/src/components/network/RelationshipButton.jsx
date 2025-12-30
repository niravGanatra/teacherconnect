/**
 * RelationshipButton Component
 * Smart adaptive button that shows different states based on relationship.
 */
import { useState } from 'react';
import { Button, Modal } from '../common';
import { networkAPI } from '../../services/api';
import {
    UserPlusIcon,
    UserMinusIcon,
    CheckIcon,
    XMarkIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon,
    EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';

const RELATIONSHIP_STATUS = {
    NONE: 'NONE',
    FOLLOWING: 'FOLLOWING',
    PENDING_SENT: 'PENDING_SENT',
    PENDING_RECEIVED: 'PENDING_RECEIVED',
    CONNECTED: 'CONNECTED',
};

export default function RelationshipButton({
    targetUserId,
    targetUserName = 'this user',
    initialStatus = RELATIONSHIP_STATUS.NONE,
    initialIsFollowing = false,
    connectionRequestId = null,
    onStatusChange = () => { },
    compact = false,
}) {
    const [status, setStatus] = useState(initialStatus);
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [requestId, setRequestId] = useState(connectionRequestId);
    const [loading, setLoading] = useState(false);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [note, setNote] = useState('');

    const handleConnect = async (withNote = false) => {
        setLoading(true);
        try {
            const response = await networkAPI.sendConnectionRequest(
                targetUserId,
                withNote ? note : ''
            );

            if (response.data.connected) {
                setStatus(RELATIONSHIP_STATUS.CONNECTED);
                setIsFollowing(true);
            } else {
                setStatus(RELATIONSHIP_STATUS.PENDING_SENT);
                setRequestId(response.data.request?.id);
            }
            onStatusChange(status);
        } catch (error) {
            console.error('Failed to send connection request:', error);
            alert(error.response?.data?.error || 'Failed to send connection request');
        } finally {
            setLoading(false);
            setShowConnectModal(false);
            setNote('');
        }
    };

    const handleWithdraw = async () => {
        if (!requestId) return;
        setLoading(true);
        try {
            await networkAPI.requestAction(requestId, 'WITHDRAW');
            setStatus(RELATIONSHIP_STATUS.NONE);
            setRequestId(null);
            onStatusChange(RELATIONSHIP_STATUS.NONE);
        } catch (error) {
            console.error('Failed to withdraw request:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!requestId) return;
        setLoading(true);
        try {
            await networkAPI.requestAction(requestId, 'ACCEPT');
            setStatus(RELATIONSHIP_STATUS.CONNECTED);
            setIsFollowing(true);
            onStatusChange(RELATIONSHIP_STATUS.CONNECTED);
        } catch (error) {
            console.error('Failed to accept request:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!requestId) return;
        setLoading(true);
        try {
            await networkAPI.requestAction(requestId, 'REJECT');
            setStatus(RELATIONSHIP_STATUS.NONE);
            setRequestId(null);
            onStatusChange(RELATIONSHIP_STATUS.NONE);
        } catch (error) {
            console.error('Failed to reject request:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        setLoading(true);
        try {
            const response = await networkAPI.toggleFollow(targetUserId);
            setIsFollowing(response.data.following);
        } catch (error) {
            console.error('Failed to toggle follow:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveConnection = async () => {
        if (!confirm('Remove this connection?')) return;
        setLoading(true);
        try {
            await networkAPI.removeConnection(targetUserId);
            setStatus(RELATIONSHIP_STATUS.NONE);
            onStatusChange(RELATIONSHIP_STATUS.NONE);
        } catch (error) {
            console.error('Failed to remove connection:', error);
        } finally {
            setLoading(false);
            setShowDropdown(false);
        }
    };

    // Render based on status
    const renderButtons = () => {
        switch (status) {
            case RELATIONSHIP_STATUS.NONE:
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="primary"
                            size={compact ? 'sm' : 'md'}
                            onClick={() => setShowConnectModal(true)}
                            disabled={loading}
                            className="flex items-center gap-1"
                        >
                            <UserPlusIcon className="w-4 h-4" />
                            Connect
                        </Button>
                        <Button
                            variant="outline"
                            size={compact ? 'sm' : 'md'}
                            onClick={handleFollow}
                            disabled={loading}
                            className="flex items-center gap-1"
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </Button>
                    </div>
                );

            case RELATIONSHIP_STATUS.FOLLOWING:
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="primary"
                            size={compact ? 'sm' : 'md'}
                            onClick={() => setShowConnectModal(true)}
                            disabled={loading}
                            className="flex items-center gap-1"
                        >
                            <UserPlusIcon className="w-4 h-4" />
                            Connect
                        </Button>
                        <Button
                            variant="outline"
                            size={compact ? 'sm' : 'md'}
                            onClick={handleFollow}
                            disabled={loading}
                            className="flex items-center gap-1"
                        >
                            Following ✓
                        </Button>
                    </div>
                );

            case RELATIONSHIP_STATUS.PENDING_SENT:
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size={compact ? 'sm' : 'md'}
                            disabled
                            className="flex items-center gap-1 opacity-70"
                        >
                            <ClockIcon className="w-4 h-4" />
                            Pending
                        </Button>
                        <Button
                            variant="ghost"
                            size={compact ? 'sm' : 'md'}
                            onClick={handleWithdraw}
                            disabled={loading}
                            className="text-slate-500 hover:text-red-600"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </Button>
                    </div>
                );

            case RELATIONSHIP_STATUS.PENDING_RECEIVED:
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="primary"
                            size={compact ? 'sm' : 'md'}
                            onClick={handleAccept}
                            disabled={loading}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                            <CheckIcon className="w-4 h-4" />
                            Accept
                        </Button>
                        <Button
                            variant="ghost"
                            size={compact ? 'sm' : 'md'}
                            onClick={handleReject}
                            disabled={loading}
                            className="text-slate-500 hover:text-red-600"
                        >
                            Ignore
                        </Button>
                    </div>
                );

            case RELATIONSHIP_STATUS.CONNECTED:
                return (
                    <div className="flex items-center gap-2 relative">
                        <Button
                            variant="primary"
                            size={compact ? 'sm' : 'md'}
                            className="flex items-center gap-1"
                        >
                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            Message
                        </Button>
                        <div className="relative">
                            <Button
                                variant="outline"
                                size={compact ? 'sm' : 'md'}
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="px-2"
                            >
                                <EllipsisHorizontalIcon className="w-5 h-5" />
                            </Button>
                            {showDropdown && (
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-20">
                                    <button
                                        onClick={handleRemoveConnection}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        Remove Connection
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            {renderButtons()}

            {/* Connect Modal */}
            {showConnectModal && (
                <Modal
                    isOpen={showConnectModal}
                    onClose={() => {
                        setShowConnectModal(false);
                        setNote('');
                    }}
                    title="Send Connection Request"
                >
                    <div className="p-4">
                        <p className="text-slate-600 mb-4">
                            You can add a note to personalize your invitation to{' '}
                            <span className="font-medium text-slate-800">{targetUserName}</span>.
                        </p>

                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Hi! I'd like to connect with you..."
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows={3}
                        />

                        <div className="flex justify-end gap-3 mt-4">
                            <Button
                                variant="outline"
                                onClick={() => handleConnect(false)}
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Send without note'}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => handleConnect(true)}
                                disabled={loading || !note.trim()}
                            >
                                {loading ? 'Sending...' : 'Add note & send'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}

export { RELATIONSHIP_STATUS };
