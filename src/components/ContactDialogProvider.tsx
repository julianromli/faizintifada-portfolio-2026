import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { ContactChoiceDialog } from './ContactChoiceDialog';

interface ContactDialogContextValue {
  openContactDialog: () => void;
  closeContactDialog: () => void;
}

const ContactDialogContext = createContext<ContactDialogContextValue | null>(null);

export function ContactDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openContactDialog = useCallback(() => {
    setOpen(true);
  }, []);

  const closeContactDialog = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({ openContactDialog, closeContactDialog }),
    [openContactDialog, closeContactDialog],
  );

  return (
    <ContactDialogContext.Provider value={value}>
      {children}
      <ContactChoiceDialog open={open} onClose={closeContactDialog} />
    </ContactDialogContext.Provider>
  );
}

export function useContactDialog(): ContactDialogContextValue {
  const context = useContext(ContactDialogContext);
  if (!context) {
    throw new Error('useContactDialog must be used within ContactDialogProvider');
  }
  return context;
}
