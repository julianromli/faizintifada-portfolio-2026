import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Seo } from '../../components/Seo';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { RequireAdmin } from './RequireAdmin';

const AdminLogin = lazy(() =>
  import('./AdminLogin').then((mod) => ({ default: mod.AdminLogin })),
);
const AdminProjectList = lazy(() =>
  import('./AdminProjectList').then((mod) => ({ default: mod.AdminProjectList })),
);
const AdminProjectForm = lazy(() =>
  import('./AdminProjectForm').then((mod) => ({ default: mod.AdminProjectForm })),
);
const AdminPageSettings = lazy(() =>
  import('./AdminPageSettings').then((mod) => ({ default: mod.AdminPageSettings })),
);
const AdminTestimonials = lazy(() =>
  import('./AdminTestimonials').then((mod) => ({ default: mod.AdminTestimonials })),
);
const AdminCoachingList = lazy(() =>
  import('./AdminCoachingList').then((mod) => ({ default: mod.AdminCoachingList })),
);

function AdminNoIndex() {
  const { pathname } = useLocation();
  return <Seo noIndex title="Admin" path={pathname} />;
}

function adminRoute(element: ReactNode) {
  return (
    <Suspense fallback={<p className="py-12 text-[15px] text-muted animate-pulse">Loading admin…</p>}>
      {element}
    </Suspense>
  );
}

function ProtectedLayout() {
  return (
    <RequireAdmin>
      <AdminLayout />
    </RequireAdmin>
  );
}

export function AdminApp() {
  return (
    <>
      <AdminNoIndex />
      <Routes>
        <Route index element={adminRoute(<AdminLogin />)} />
        <Route element={<ProtectedLayout />}>
          <Route path="projects" element={adminRoute(<AdminProjectList />)} />
          <Route path="projects/new" element={adminRoute(<AdminProjectForm />)} />
          <Route path="projects/edit/:slug" element={adminRoute(<AdminProjectForm />)} />
          <Route path="page" element={adminRoute(<AdminPageSettings />)} />
          <Route path="testimonials" element={adminRoute(<AdminTestimonials />)} />
          <Route path="coaching" element={adminRoute(<AdminCoachingList />)} />
        </Route>
      </Routes>
    </>
  );
}
