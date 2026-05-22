import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

export default function UserLayout() {
  const { user } = useAuth();
  const location = useLocation();

  const hideExtrasPaths = ['/', '/register'];
  const shouldShow = user && !hideExtrasPaths.includes(location.pathname);
  const showBottomNav = shouldShow && location.pathname !== '/chat';

  return (
    <div className="user-layout">
      {shouldShow && <Header />}
      <div className="user-layout__body">
        {shouldShow && <Sidebar />}
        <main className="user-layout__main">
          <Outlet />
        </main>
      </div>
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}