import { useState } from 'react';
import { Seo } from '../components/Seo';
import { CoachingFormDialog } from '../components/CoachingFormDialog';

export function Coaching() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Seo title="Coaching" path="/coaching" />
      <main className="flex min-h-[40vh] flex-col items-center justify-center py-20">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-foreground px-8 py-4 text-[16px] font-medium text-canvas hover:bg-foreground/90 active:scale-[0.97] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card theme-transition"
        >
          Book a Session
        </button>
      </main>
      <CoachingFormDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
