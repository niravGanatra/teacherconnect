import React, { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { acadConnectAPI } from '../../services/acadConnectAPI';

const StartConversationModal = ({ isOpen, onClose, onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setConnections([]);
      fetchConnections();
    }
  }, [isOpen]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError('');
      // Need a way to fetch connections. Let's assume acadConnectAPI has getConnections().
      // If it doesn't, we can fetch all and filter client side for now.
      const resp = await acadConnectAPI.getConnections();
      setConnections(resp.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load connections.');
    } finally {
      setLoading(false);
    }
  };

  const filteredConnections = connections.filter(conn => 
    conn.connected_user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.connected_user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Conversation</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 dark:bg-gray-900">
          <div className="relative">
            <input
              type="text"
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 dark:bg-gray-900">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-blue-500" size={24} />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">{error}</div>
          ) : filteredConnections.length === 0 ? (
            <div className="text-center text-gray-500 p-8">
              {searchQuery ? "No connections found matching your search." : "You don't have any connections yet. Connect with educators via AcadConnect first to send messages."}
            </div>
          ) : (
            <ul className="space-y-1">
              {filteredConnections.map((conn) => (
                <li key={conn.id}>
                  <button
                    onClick={() => onSelectUser(conn.connected_user.id)}
                    className="w-full flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                  >
                    <img
                      src={conn.connected_user.avatar_url || '/default-avatar.png'}
                      alt={conn.connected_user.name}
                      className="w-10 h-10 rounded-full object-cover mr-3 bg-gray-200"
                    />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">{conn.connected_user.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {conn.connected_user.role} {conn.connected_user.institution && `• ${conn.connected_user.institution}`}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartConversationModal;
