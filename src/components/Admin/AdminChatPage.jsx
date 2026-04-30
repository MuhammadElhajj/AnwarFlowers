import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp, getDocs, increment
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { FiSend, FiSmile, FiSearch, FiArrowLeft } from 'react-icons/fi';

const EMOJI_LIST = ['😀','😂','😍','😢','😡','👍','👎','❤️','🔥','🎉','🌸','😎','🥳','😭','😅','🤔','🙏','💪','✨','🌟'];

export default function AdminChatPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [usersMap, setUsersMap] = useState({});
  const [mobileView, setMobileView] = useState('list');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // جلب المستخدمين
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const map = {};
        snap.docs.forEach(d => {
          const data = d.data();
          map[d.id] = {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            profileImage: data.profileImage || null,
            email: data.email || ''
          };
        });
        setUsersMap(map);
      } catch (err) {
        console.warn('تعذر جلب بيانات المستخدمين');
      }
    };
    fetchUsers();
  }, []);

  // الاشتراك بقائمة الدردشات
  useEffect(() => {
    const q = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // الاشتراك برسائل الدردشة المحددة
  useEffect(() => {
    if (!selectedChat) return;
    const q = query(collection(db, 'chats', selectedChat, 'messages'), orderBy('timestamp'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [selectedChat]);

  // تصفير غير المقروءة عند الفتح
  useEffect(() => {
    if (selectedChat) {
      updateDoc(doc(db, 'chats', selectedChat), { unreadAdmin: 0 }).catch(console.error);
    }
  }, [selectedChat]);

  // تمرير تلقائي
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendReply = async () => {
    if (!reply.trim() || !selectedChat) return;
    await addDoc(collection(db, 'chats', selectedChat, 'messages'), {
      senderId: user.uid,
      text: reply.trim(),
      timestamp: serverTimestamp()
    });
    await updateDoc(doc(db, 'chats', selectedChat), {
      lastMessage: reply.trim(),
      updatedAt: serverTimestamp()
    });
    setReply('');
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const insertEmoji = (emoji) => {
    setReply(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return '';
    return timestamp.toDate().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredChats = chats.filter(c => {
    const term = searchTerm.toLowerCase();
    const userData = usersMap[c.userId] || {};
    const userName = c.userName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || c.userEmail || '';
    return userName.toLowerCase().includes(term) || (c.userEmail || '').toLowerCase().includes(term);
  });

  const selectedChatData = chats.find(c => c.id === selectedChat);
  const selectedUserData = selectedChatData ? usersMap[selectedChatData.userId] : null;

  const handleSelectChat = (chatId) => {
    setSelectedChat(chatId);
    if (window.innerWidth <= 768) setMobileView('chat');
  };

  const handleBackToList = () => {
    setSelectedChat(null);
    setMobileView('list');
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main" style={{ display: 'flex', flexDirection: 'column', height: '100vh', height: '100dvh', padding: 0, marginRight: 0 }}>
        <AdminHeader />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', marginRight: window.innerWidth > 768 ? '280px' : 0 }}>
          <div className="admin-chat-modern" style={{ flex: 1, display: 'flex', height: 'auto', overflow: 'hidden' }}>
            {/* قائمة الدردشات */}
            <div className={`chats-list-modern ${mobileView === 'chat' ? 'hidden-mobile' : ''}`}>
              <div className="chats-list-header">
                <h2>💬 الدردشات</h2>
                <div className="search-box">
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="بحث عن مستخدم..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="chats-list-body">
                {filteredChats.map(c => {
                  const userData = usersMap[c.userId] || {};
                  const userName = c.userName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || c.userEmail || 'مستخدم';
                  const userPhoto = userData.profileImage || null;
                  const unread = c.unreadAdmin || 0;

                  return (
                    <div
                      key={c.id}
                      className={`chat-user-card ${selectedChat === c.id ? 'active' : ''}`}
                      onClick={() => handleSelectChat(c.id)}
                    >
                      <div className="user-avatar">
                        {userPhoto ? (
                          <img src={userPhoto} alt={userName} />
                        ) : (
                          <div className="avatar-placeholder">{userName.charAt(0)}</div>
                        )}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{userName}</div>
                        <div className="last-message">{c.lastMessage || 'بدون رسائل'}</div>
                      </div>
                      {unread > 0 && <span className="unread-badge">{unread}</span>}
                    </div>
                  );
                })}
                {filteredChats.length === 0 && <p className="no-chats">لا توجد دردشات</p>}
              </div>
            </div>

            {/* منطقة المحادثة */}
            <div className={`chat-conversation-modern ${mobileView === 'chat' ? 'show-mobile' : ''}`}>
              {selectedChat ? (
                <>
                  <div className="chat-top-bar">
                    <div className="user-info-bar">
                      <button className="back-btn" onClick={handleBackToList}>
                        <FiArrowLeft size={20} />
                      </button>
                      <div className="user-avatar">
                        {selectedUserData?.profileImage ? (
                          <img src={selectedUserData.profileImage} alt="" />
                        ) : (
                          <div className="avatar-placeholder">
                            {selectedUserData?.firstName?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="user-name">
                          {selectedUserData?.firstName || ''} {selectedUserData?.lastName || ''}
                        </div>
                        <div className="user-status">متصل الآن</div>
                      </div>
                    </div>
                  </div>

                  <div className="chat-messages-modern">
                    {messages.map(m => (
                      <div
                        key={m.id}
                        className={`chat-bubble-modern ${m.senderId === user.uid ? 'admin' : 'user'}`}
                      >
                        <p>{m.text}</p>
                        <span className="msg-time">{formatTime(m.timestamp)}</span>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="chat-input-bar">
                    <button className="emoji-btn" onClick={() => setShowEmoji(!showEmoji)}>
                      <FiSmile size={20} />
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      placeholder="اكتب رداً..."
                      onKeyDown={e => e.key === 'Enter' && sendReply()}
                    />
                    {reply.trim() && (
                      <button className="send-btn" onClick={sendReply}>
                        <FiSend size={20} />
                      </button>
                    )}
                    {showEmoji && (
                      <div className="emoji-picker-modern">
                        {EMOJI_LIST.map(emo => (
                          <button key={emo} onClick={() => insertEmoji(emo)}>{emo}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="no-chat-selected">
                  <div className="placeholder-icon">💬</div>
                  <h3>اختر محادثة من القائمة</h3>
                  <p>ستظهر هنا رسائل المستخدم المحدد</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}