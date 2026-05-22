import { Outlet } from 'react-router-dom';
import AdminHeader from '../Admin/AdminHeader';
import AdminSidebar from '../Admin/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminHeader />
      <div className="admin-layout__body">
        <AdminSidebar />
        <main className="admin-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}