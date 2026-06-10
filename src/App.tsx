import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { Coaching } from './pages/Coaching';
import { ProjectDetail } from './pages/ProjectDetail';
import { NotFound } from './pages/NotFound';
import { AdminApp } from './pages/admin/AdminApp';
import { BodyOverlayScrollbars } from './components/BodyOverlayScrollbars';
import { LazyMotionProvider } from './components/LazyMotionProvider';

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
          <Route path="/admin/*" element={<AdminApp />} />
          <Route
            path="*"
            element={
              <PublicShell>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/coaching" element={<Coaching />} />
                  <Route path="/project/:slug" element={<ProjectDetail />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PublicShell>
            }
          />
        </Routes>
      </Router>
    </LazyMotionProvider>
  );
}
