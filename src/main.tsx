import {StrictMode, lazy, Suspense, type ComponentType} from 'react';
import {createRoot} from 'react-dom/client';
import {HelmetProvider} from 'react-helmet-async';
import App from './App.tsx';
import {ThemeProvider} from './components/ThemeProvider';
import {SoundProvider} from './components/SoundProvider';
import {TooltipProvider} from './components/ui/tooltip';
import 'overlayscrollbars/overlayscrollbars.css';
import './index.css';

const Agentation: ComponentType<{endpoint: string}> | null = import.meta.env.DEV
  ? lazy(() => import('agentation').then((m) => ({default: m.Agentation})))
  : null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <SoundProvider>
          <TooltipProvider>
            <App />
            {Agentation && (
              <Suspense fallback={null}>
                <Agentation endpoint="http://localhost:4747" />
              </Suspense>
            )}
          </TooltipProvider>
        </SoundProvider>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>,
);
