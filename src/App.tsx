import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { BodyOverlayScrollbars } from './components/BodyOverlayScrollbars';
import { LazyMotionProvider } from './components/LazyMotionProvider';

const Home = lazy(() => import('./pages/Home').then((mod) => ({ default: mod.Home })));
const Projects = lazy(() => import('./pages/Projects').then((mod) => ({ default: mod.Projects })));
const Coaching = lazy(() => import('./pages/Coaching').then((mod) => ({ default: mod.Coaching })));
const Speaking = lazy(() => import('./pages/Speaking').then((mod) => ({ default: mod.Speaking })));
const UiKit = lazy(() => import('./pages/UiKit').then((mod) => ({ default: mod.UiKit })));
const UiKitThankYou = lazy(() =>
  import('./pages/UiKitThankYou').then((mod) => ({ default: mod.UiKitThankYou })),
);
const ProjectDetail = lazy(() =>
  import('./pages/ProjectDetail').then((mod) => ({ default: mod.ProjectDetail })),
);
const NotFound = lazy(() => import('./pages/NotFound').then((mod) => ({ default: mod.NotFound })));
const AdminApp = lazy(() =>
  import('./pages/admin/AdminApp').then((mod) => ({ default: mod.AdminApp })),
);

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-shell py-4 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 font-sans theme-transition selection:bg-surface-nested">
      <div className="max-w-[1300px] mx-auto bg-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-14 lg:p-16 shadow-sm overflow-hidden border border-border theme-transition">
        <Navigation />
        {children}
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LazyMotionProvider>
      <Router>
        <BodyOverlayScrollbars />
        <Routes>
          <Route
            path="/admin/*"
            element={
              <Suspense
                fallback={<p className="py-12 text-[15px] text-muted animate-pulse">Loading…</p>}
              >
                <AdminApp />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <PublicShell>
                <Suspense
                  fallback={<p className="py-12 text-[15px] text-muted animate-pulse">Loading…</p>}
                >
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/speaking" element={<Speaking />} />
                    <Route path="/coaching" element={<Coaching />} />
                    <Route path="/ui" element={<UiKit />} />
                    <Route path="/ui/thank-you" element={<UiKitThankYou />} />
                    <Route path="/project/:slug" element={<ProjectDetail />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </PublicShell>
            }
          />
        </Routes>
      </Router>
    </LazyMotionProvider>
  );
}
