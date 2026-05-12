import { Outlet } from 'react-router-dom';
import AdminHeader from '../Admin/AdminHeader';
import AdminSidebar from '../Admin/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminHeader />
      <div className="admin-layout__body" style={{ display: 'flex' }}>
        <AdminSidebar />
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}