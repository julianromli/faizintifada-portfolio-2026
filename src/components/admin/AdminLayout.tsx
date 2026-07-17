import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminMobileMenuButton, AdminSidebar } from './AdminSidebar';

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-shell font-sans antialiased theme-transition">
      <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="lg:pl-[240px]">
        <div className="flex min-h-screen flex-col p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-3 lg:hidden">
            <AdminMobileMenuButton onOpen={() => setMobileOpen(true)} />
            <span className="text-[14px] font-medium text-muted">Admin</span>
          </div>

          <div className="flex flex-1 flex-col rounded-2xl border border-border bg-card p-5 sm:p-6 lg:p-8 theme-transition">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
