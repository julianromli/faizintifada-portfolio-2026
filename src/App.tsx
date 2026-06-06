import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Seo } from './components/Seo';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { Coaching } from './pages/Coaching';
import { ProjectDetail } from './pages/ProjectDetail';
import { NotFound } from './pages/NotFound';
import { RequireAdmin } from './pages/admin/RequireAdmin';
import { BodyOverlayScrollbars } from './components/BodyOverlayScrollbars';
import { LazyMotionProvider } from './components/LazyMotionProvider';

const AdminLogin = lazy(() =>
  import('./pages/admin/AdminLogin').then((mod) => ({ default: mod.AdminLogin })),
);
const AdminProjectList = lazy(() =>
  import('./pages/admin/AdminProjectList').then((mod) => ({ default: mod.AdminProjectList })),
);
const AdminProjectForm = lazy(() =>
  import('./pages/admin/AdminProjectForm').then((mod) => ({ default: mod.AdminProjectForm })),
);
const AdminPageSettings = lazy(() =>
  import('./pages/admin/AdminPageSettings').then((mod) => ({ default: mod.AdminPageSettings })),
);
const AdminCoachingList = lazy(() =>
  import('./pages/admin/AdminCoachingList').then((mod) => ({ default: mod.AdminCoachingList })),
);

function AdminNoIndex() {
  const { pathname } = useLocation();
  if (!pathname.startsWith('/admin')) return null;
  return <Seo noIndex title="Admin" path={pathname} />;
}

function adminRoute(element: ReactNode) {
  return (
    <Suspense fallback={<p className="py-12 text-[15px] text-muted animate-pulse">Loading admin…</p>}>
      {element}
    </Suspense>
  );
}

export default function App() {
  return (
    <LazyMotionProvider>
    <Router>
      <BodyOverlayScrollbars />
      <AdminNoIndex />
      <div className="min-h-screen bg-shell py-4 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 font-sans theme-transition selection:bg-surface-nested">
        <div className="max-w-[1300px] mx-auto bg-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-14 lg:p-16 shadow-sm overflow-hidden border border-border theme-transition">
          
          <Navigation />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/coaching" element={<Coaching />} />
            <Route path="/project/:slug" element={<ProjectDetail />} />
            <Route path="/admin" element={adminRoute(<AdminLogin />)} />
            <Route
              path="/admin/projects"
              element={
                adminRoute(
                  <RequireAdmin>
                    <AdminProjectList />
                  </RequireAdmin>,
                )
              }
            />
            <Route
              path="/admin/projects/new"
              element={
                adminRoute(
                  <RequireAdmin>
                    <AdminProjectForm />
                  </RequireAdmin>,
                )
              }
            />
            <Route
              path="/admin/projects/edit/:slug"
              element={
                adminRoute(
                  <RequireAdmin>
                    <AdminProjectForm />
                  </RequireAdmin>,
                )
              }
            />
            <Route
              path="/admin/page"
              element={
                adminRoute(
                  <RequireAdmin>
                    <AdminPageSettings />
                  </RequireAdmin>,
                )
              }
            />
            <Route
              path="/admin/coaching"
              element={
                adminRoute(
                  <RequireAdmin>
                    <AdminCoachingList />
                  </RequireAdmin>,
                )
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          <Footer />

        </div>
      </div>
    </Router>
    </LazyMotionProvider>
  );
}
