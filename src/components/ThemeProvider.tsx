import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext } from '../hooks/useTheme';
import { getStoredTheme, setTheme as persistTheme, type Theme } from '../lib/theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());

  // persistTheme writes localStorage and applies the class to <html>, so keeping
  // it here means the state updaters below stay pure.
  useEffect(() => {
    persistTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
