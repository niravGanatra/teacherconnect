import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Check, CheckCheck, Edit, ArrowLeft, MoreVertical, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAcadTalk } from '../../hooks/useAcadTalk';
import { acadTalkAPI } from '../../services/acadTalkAPI';
import StartConversationModal from '../../components/acadtalk/StartConversationModal';
const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};

const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
};

const isThisWeek = (date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
};

const formatMessageTime = (dateString) => {
  const date = new Date(dateString);
  if (isToday(date)) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatMessageDateGroup = (dateString) => {
  const date = new Date(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date)) return date.toLocaleDateString([], { weekday: 'long' });
  return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
};

const AcadTalkPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    conversations,
    activeConversation,
    messages,
    loading,
    hasMoreMessages,
    selectConversation,
    loadMoreMessages,
    sendMessage,
    deleteMessage
  } = useAcadTalk(user);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isMobileViewList, setIsMobileViewList] = useState(true);
  const [showOptionsId, setShowOptionsId] = useState(null);
  
  const textareaRef = useRef(null);
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetUserId = params.get('target');
    if (targetUserId && conversations.length > 0 && !activeConversation) {
      const existing = conversations.find(c => c.other_participant.id === targetUserId);
      if (existing) {
        handleSelectConversation(existing);
        navigate('/acadtalk', { replace: true });
      } else {
        acadTalkAPI.startConversation(targetUserId).then(res => {
          handleSelectConversation(res.data);
          navigate('/acadtalk', { replace: true });
        }).catch(err => {
          console.error("Could not start conversation from URL params:", err);
          navigate('/acadtalk', { replace: true });
        });
      }
    }
  }, [location.search, conversations, activeConversation, navigate]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [messageInput]);

  const handleSelectConversation = (conv) => {
    selectConversation(conv);
    setIsMobileViewList(false);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeConversation) return;
    
    try {
      await sendMessage(activeConversation.id, messageInput);
      setMessageInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      console.error("Failed to send", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.other_participant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] w-full flex bg-white dark:bg-gray-900 overflow-hidden">
      
      {/* LEFT PANEL */}
      <div className={`${isMobileViewList ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
          <h1 className="text-xl font-bold dark:text-white">AcadTalk</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:text-blue-400"
            title="Start Conversation"
          >
            <Edit size={18} />
          </button>
        </div>
        
        <div className="p-3 bg-white dark:bg-gray-900">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 text-sm">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">No conversations found.</div>
          ) : (
            filteredConversations.map(conv => (
              <button 
                key={conv.id} 
                onClick={() => handleSelectConversation(conv)}
                className={`w-full p-3 flex items-start text-left border-b border-gray-100 dark:border-gray-800 transition-colors ${activeConversation?.id === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <div className="relative mr-3 shrink-0">
                  <img src={conv.other_participant.avatar_url || '/default-avatar.png'} alt={conv.other_participant.name} className="w-12 h-12 rounded-full object-cover bg-gray-200" />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${conv.other_participant.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`text-sm truncate pr-2 ${conv.unread_count > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-800 dark:text-gray-200'}`}>
                      {conv.other_participant.name}
                    </h3>
                    <span className="text-xs text-gray-400 shrink-0">
                      {conv.last_message_at ? formatMessageTime(conv.last_message_at) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-xs truncate mr-2 ${conv.last_message?.is_deleted ? 'italic text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {conv.last_message ? conv.last_message.content : 'Started a conversation'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={`${!isMobileViewList ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-white dark:bg-gray-900`}>
        {activeConversation ? (
          <>
            <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center bg-white dark:bg-gray-900 z-10 shrink-0">
              <button 
                className="mr-3 md:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                onClick={() => setIsMobileViewList(true)}
              >
                <ArrowLeft size={20} />
              </button>
              <img src={activeConversation.other_participant.avatar_url || '/default-avatar.png'} alt={activeConversation.other_participant.name} className="w-10 h-10 rounded-full object-cover mr-3 bg-gray-200 shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">{activeConversation.other_participant.name}</h2>
                <div className="flexItems-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <span className="truncate hidden sm:inline">{activeConversation.other_participant.role} {activeConversation.other_participant.institution && `• ${activeConversation.other_participant.institution}`}</span>
                  <span className="mx-1.5 hidden sm:inline">•</span>
                  <span className="text-blue-500 font-medium truncate shrink-0">Connected via AcadConnect</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse bg-slate-50 dark:bg-gray-900/50">
              {messages.map((msg, index) => {
                const isOwn = msg.sender_id === user.id;
                const showDateHeader = index === messages.length - 1 || 
                  new Date(messages[index].sent_at).toDateString() !== new Date(messages[index + 1].sent_at).toDateString();
                
                return (
                  <React.Fragment key={msg.id}>
                    <div className={`flex flex-col group mb-4 ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div className={`relative max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 ${isOwn ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm'}`}>
                        {msg.is_deleted ? (
                          <div className={`italic text-sm ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>This message was deleted</div>
                        ) : (
                          <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                        )}
                        
                        <div className={`flex items-center justify-end text-[10px] mt-1 gap-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                          <span>{format(new Date(msg.sent_at), 'h:mm a')}</span>
                          {isOwn && !msg.is_deleted && (
                            msg.is_read ? <CheckCheck size={12} className="text-white drop-shadow-sm" /> : <Check size={12} />
                          )}
                        </div>

                        {isOwn && !msg.is_deleted && (
                           <div className="absolute top-1/2 -translate-y-1/2 -left-8 md:-left-10 opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="relative">
                               <button onClick={() => setShowOptionsId(showOptionsId === msg.id ? null : msg.id)} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                                 <MoreVertical size={16} />
                               </button>
                               {showOptionsId === msg.id && (
                                 <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 py-1 w-28 overflow-hidden">
                                   <button 
                                     onClick={() => { deleteMessage(msg.id); setShowOptionsId(null); }}
                                     className="w-full flex items-center px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                   >
                                     <Trash2 size={14} className="mr-2"/> Delete
                                   </button>
                                 </div>
                               )}
                             </div>
                           </div>
                        )}
                      </div>
                    </div>
                    
                    {showDateHeader && (
                      <div className="w-full flex justify-center mb-6 mt-4">
                        <span className="bg-gray-200/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm">
                          {formatMessageDateGroup(msg.sent_at)}
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
              
              {hasMoreMessages && (
                <div className="w-full flex justify-center my-4">
                  <button onClick={loadMoreMessages} className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-4 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm font-medium">
                    Load earlier messages
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-3 md:p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-4xl mx-auto relative">
                <textarea
                  ref={textareaRef}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white resize-none max-h-[120px] min-h-[44px]"
                  rows="1"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center h-[44px] w-[44px] shadow-sm shadow-blue-600/20"
                >
                  <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
                </button>
                {messageInput.length > 1500 && (
                   <div className={`absolute -top-6 right-16 text-xs ${messageInput.length > 2000 ? 'text-red-500 font-bold' : 'text-gray-400 font-medium'}`}>
                     {messageInput.length} / 2000
                   </div>
                )}
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-slate-50 dark:bg-gray-900">
            <div className="w-20 h-20 bg-blue-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-100 dark:border-gray-700">
              <MessageSquare size={36} className="text-blue-500 dark:text-gray-500 offset-y-[-2px]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Your Conversations</h2>
            <p className="text-sm text-gray-500">Select a conversation or start a new one.</p>
          </div>
        )}
      </div>

      <StartConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectUser={async (userId) => {
           setIsModalOpen(false);
           try {
             const res = await acadTalkAPI.startConversation(userId);
             handleSelectConversation(res.data);
           } catch (e) {
             alert(e.response?.data?.error || e.message || 'Error starting conversation');
           }
        }}
      />
    </div>
  );
};

export default AcadTalkPage;
