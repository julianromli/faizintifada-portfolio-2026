import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Check, CaretUpDown } from '@phosphor-icons/react';

export interface SelectOption {
  value: string;
  label: string;
  /** Optional leading icon element (e.g. a Phosphor icon). */
  icon?: React.ReactNode;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  id?: string;
  name?: string;
  disabled?: boolean;
  placeholder?: string;
  'aria-label'?: string;
  className?: string;
}

/**
 * Accessible custom dropdown that fully respects the app's light/dark tokens —
 * unlike a native <select>, whose expanded option list is rendered by the OS and
 * can't be themed. Keyboard: Up/Down to move, Enter/Space to select, Esc to close,
 * Home/End to jump, type-ahead to match by first letter.
 */
export function Select({
  value,
  onChange,
  options,
  id,
  name,
  disabled = false,
  placeholder = 'Select…',
  'aria-label': ariaLabel,
  className = '',
}: SelectProps) {
  const generatedId = useId();
  const listboxId = `${id ?? generatedId}-listbox`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);
  const typeaheadRef = useRef<{ query: string; timer: number | null }>({
    query: '',
    timer: null,
  });

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [disabled, selectedIndex]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, close]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (open && activeIndex >= 0) {
      optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, activeIndex]);

  function commit(index: number) {
    const opt = options[index];
    if (opt) {
      onChange(opt.value);
    }
    close();
    buttonRef.current?.focus();
  }

  function handleTypeahead(char: string) {
    const state = typeaheadRef.current;
    state.query += char.toLowerCase();
    if (state.timer) window.clearTimeout(state.timer);
    state.timer = window.setTimeout(() => {
      state.query = '';
    }, 600);

    const match = options.findIndex((o) => o.label.toLowerCase().startsWith(state.query));
    if (match >= 0) {
      setActiveIndex(match);
      if (!open) onChange(options[match]!.value);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;

    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        openMenu();
        return;
      }
      if (e.key.length === 1 && /\S/.test(e.key)) {
        handleTypeahead(e.key);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0) commit(activeIndex);
        break;
      case 'Escape':
        e.preventDefault();
        close();
        buttonRef.current?.focus();
        break;
      case 'Tab':
        close();
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          handleTypeahead(e.key);
        }
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        ref={buttonRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-transparent px-4 py-2.5 text-left text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 disabled:opacity-60 theme-transition"
      >
        <span className={`flex min-w-0 items-center gap-2 ${selected ? '' : 'text-muted'}`}>
          {selected?.icon}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <CaretUpDown size={16} className="shrink-0 text-muted" aria-hidden />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
          }
          tabIndex={-1}
          className="absolute z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-border bg-card p-1.5 shadow-elevated focus:outline-none"
        >
          {options.map((opt, index) => {
            const isSelected = opt.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={opt.value}
                id={`${listboxId}-opt-${index}`}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                role="option"
                aria-selected={isSelected}
                onClick={() => commit(index)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-[14px] theme-transition ${
                  isActive ? 'bg-surface text-foreground' : 'text-foreground'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {opt.icon}
                  <span className="truncate">{opt.label}</span>
                </span>
                {isSelected ? (
                  <Check size={16} weight="bold" className="shrink-0 text-foreground" aria-hidden />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
