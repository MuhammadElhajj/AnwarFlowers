import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  doc, updateDoc, serverTimestamp, getDoc, getDocs,
  where, increment
} from 'firebase/firestore';
import { db } from '../services/firebase';
import Header from '../components/Layout/Header';
import { FiSend, FiSmile, FiArrowLeft, FiGift } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/chat.css';

const EMOJI_LIST = ['😀','😂','😍','😢','😡','👍','👎','❤️','🔥','🎉','🌸','😎','🥳','😭','😅','🤔','🙏','💪','✨','🌟'];

export default function ChatPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [chatId, setChatId] = useState(null);
  const [adminInfo, setAdminInfo] = useState({ name: t('admin'), photo: null, lastSeen: t('online') });
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const initChat = async () => {
      try {
        const chatsSnap = await getDocs(
          query(collection(db, 'chats'), where('userId', '==', user.uid))
        );
        if (!chatsSnap.empty) {
          setChatId(chatsSnap.docs[0].id);
        } else {
          const newChatRef = await addDoc(collection(db, 'chats'), {
            userId: user.uid,
            userName: user.displayName || (user.firstName + ' ' + user.lastName),
            userEmail: user.email,
            lastMessage: '',
            updatedAt: serverTimestamp()
          });
          setChatId(newChatRef.id);
        }
      } catch (err) {
        console.error(t('chatInitFailed'), err);
      }
    };
    initChat();
  }, [user, t]);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const adminSnap = await getDoc(doc(db, 'users', 'adminIdPlaceholder'));
        if (adminSnap.exists()) {
          const data = adminSnap.data();
          setAdminInfo({
            name: (data.firstName + ' ' + data.lastName) || t('admin'),
            photo: data.profileImage || null,
            lastSeen: t('online')
          });
        }
      } catch (e) {}
    };
    fetchAdmin();
  }, [t]);

  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp'));
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    if (chatId && user) {
      updateDoc(doc(db, 'chats', chatId), { unreadUser: 0 }).catch(console.error);
    }
  }, [chatId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = newMsg.trim();
    if (!text) return;

    let activeChatId = chatId;
    if (!activeChatId) {
      try {
        const snap = await getDocs(query(collection(db, 'chats'), where('userId', '==', user.uid)));
        if (!snap.empty) {
          activeChatId = snap.docs[0].id;
          setChatId(activeChatId);
        } else {
          const newRef = await addDoc(collection(db, 'chats'), {
            userId: user.uid,
            userName: user.displayName || (user.firstName + ' ' + user.lastName),
            userEmail: user.email,
            lastMessage: '',
            updatedAt: serverTimestamp()
          });
          activeChatId = newRef.id;
          setChatId(activeChatId);
        }
      } catch (e) {
        console.error(e);
        return;
      }
    }

    try {
      await addDoc(collection(db, 'chats', activeChatId, 'messages'), {
        senderId: user.uid,
        text: text,
        timestamp: serverTimestamp()
      });
      await updateDoc(doc(db, 'chats', activeChatId), {
        lastMessage: text,
        unreadAdmin: increment(1),
        updatedAt: serverTimestamp()
      });
      setNewMsg('');
      setShowEmoji(false);
      inputRef.current?.focus();
    } catch (err) {
      console.error(t('sendMessageFailed'), err);
    }
  };

  const insertEmoji = (emoji) => {
    setNewMsg(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return '';
    return timestamp.toDate().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-full-page">
      <Header />
      <div className="dashboard-bg" />

      <div className="whatsapp-chat-header chat-header-fixed">
        <button
          className="chat-back-btn"
          onClick={() => navigate(-1)}
          aria-label={t('back')}
        >
          <FiArrowLeft size={22} />
        </button>
        <div className="whatsapp-chat-avatar">
          {adminInfo.photo ? (
            <img src={adminInfo.photo} alt={t('admin')} />
          ) : (
            <div className="avatar-placeholder">
              <FiGift size={24} />
            </div>
          )}
        </div>
        <div className="whatsapp-chat-info">
          <h3>{adminInfo.name}</h3>
          <span>{adminInfo.lastSeen}</span>
        </div>
      </div>

      <div className="whatsapp-messages-area">
        {messages.length === 0 && (
          <p className="empty-chat-message">{t('startConversation')}</p>
        )}
        {messages.map(m => (
          <div
            key={m.id}
            className={`whatsapp-bubble ${m.senderId === user.uid ? 'sent' : 'received'}`}
          >
            <p>{m.text}</p>
            <span className="whatsapp-time">{formatTime(m.timestamp)}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="whatsapp-input-area chat-input-fixed">
        <button
          className="emoji-toggle-btn"
          onClick={() => setShowEmoji(!showEmoji)}
          type="button"
          aria-label={t('emoji')}
        >
          <FiSmile size={22} />
        </button>
        <input
          ref={inputRef}
          type="text"
          className="whatsapp-input"
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          placeholder={t('typeMessage')}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        {newMsg.trim() ? (
          <button className="send-btn" onClick={sendMessage} type="button" aria-label={t('send')}>
            <FiSend size={20} />
          </button>
        ) : null}
      </div>

      {showEmoji && (
        <div className="emoji-picker-panel emoji-panel-fixed">
          {EMOJI_LIST.map(emo => (
            <button key={emo} className="emoji-item" onClick={() => insertEmoji(emo)} type="button">
              {emo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}