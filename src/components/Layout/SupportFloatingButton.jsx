import { useNavigate } from 'react-router-dom';
import { BsChatDotsFill } from 'react-icons/bs'; // أو FiMessageCircle
import '../../styles/components/ChatFloatingButton.css';

export default function SupportFloatingButton() {
  const navigate = useNavigate();

  return (
    <button
      className="chat-floating-button"
      onClick={() => navigate('/chat')}
      aria-label="الدردشة"
    >
      <BsChatDotsFill size={26} color="#fff" />
    </button>
  );
}