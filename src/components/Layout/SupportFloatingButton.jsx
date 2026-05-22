import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { BsChatDotsFill } from 'react-icons/bs';
import '../../styles/components/ChatFloatingButton.css';

export default function SupportFloatingButton() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <button
      className="chat-floating-button"
      onClick={() => navigate('/chat')}
      aria-label={t('chat')}
    >
      <BsChatDotsFill size={26} color="#fff" />
    </button>
  );
}