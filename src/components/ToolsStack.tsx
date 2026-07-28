import { useState } from 'react';
import { HandTap } from '@phosphor-icons/react';
import { m } from 'motion/react';
import { isThemeAwareToolIcon, THEME_AWARE_TOOL_ICONS } from './tool-icons';
import { EASE_OUT } from '../lib/motion';

type Tool = {
  id: string;
  name: string;
  bg: string;
  icon: string;
  rotate: number;
  borderClass?: string;
  imgClassName?: string;
};

const TOOLS: Tool[] = [
  { 
    id: 'figma', 
    name: 'Figma', 
    bg: 'bg-card',
    imgClassName: 'border-0',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg', 
    rotate: -21 
  },
  { 
    id: 'google-ai-studio', 
    name: 'Google AI Studio', 
    bg: 'bg-card', 
    icon: 'https://mh00j7jocs.ufs.sh/f/Qnr0iOx9K6xJeroJZ67v7EOcR6jGLWBNTApisPuaeDYMUbnI', 
    rotate: -15 
  },
  { 
    id: 'hermes-agents', 
    name: 'Hermes Agents', 
    bg: 'bg-card',
    borderClass: 'border-4 border-surface',
    icon: 'https://mh00j7jocs.ufs.sh/f/Qnr0iOx9K6xJzp8gzHQ01jPoxERhQSFJuI2qmrfb95LAUe3C', 
    rotate: -9 
  },
  { 
    id: 'davinci-resolve', 
    name: 'DaVinci Resolve', 
    bg: 'bg-card', 
    icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/DaVinci_Resolve_Studio.png', 
    rotate: -3 
  },
  { 
    id: 'obsidian', 
    name: 'Obsidian', 
    bg: 'bg-card', 
    icon: 'https://upload.wikimedia.org/wikipedia/commons/1/10/2023_Obsidian_logo.svg', 
    rotate: 3 
  },
  { 
    id: 'cursor', 
    name: 'Cursor', 
    bg: 'bg-card', 
    icon: '', 
    rotate: 9 
  },
  { 
    id: 'pi', 
    name: 'Pi Agent', 
    bg: 'bg-card', 
    icon: 'https://0nzst7ka0j.ufs.sh/f/octNiMKDR9jHClsVmeuAh4y2o59B1PJewTDsUE3rtVRxf7gI', 
    rotate: 15 
  },
  { 
    id: 'codex', 
    name: 'Codex', 
    bg: 'bg-card', 
    icon: 'https://mh00j7jocs.ufs.sh/f/Qnr0iOx9K6xJvzLF0kt3OERfomb5VsYrNqh3BI4C2GiPLp7z', 
    rotate: 21 
  },
];

const MOBILE_CARD = 68;
const MOBILE_GAP = 8;
const MOBILE_COLS = 4;
const MOBILE_MID = (TOOLS.length - 1) / 2;
const MOBILE_LABEL_SLOT = 26;
const SPRING = { type: 'spring' as const, stiffness: 380, damping: 28 };

function ToolIcon({
  tool,
  className,
}: {
  tool: Tool;
  className: string;
}) {
  const ThemeIcon = isThemeAwareToolIcon(tool.id) ? THEME_AWARE_TOOL_ICONS[tool.id] : null;

  if (ThemeIcon) {
    return <ThemeIcon className={className} />;
  }

  return (
    <img
      src={tool.icon}
      alt=""
      loading="lazy"
      decoding="async"
      className={`${className} object-contain ${tool.imgClassName ?? ''}`.trim()}
    />
  );
}

function MobileToolsTapFan() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full sm:hidden">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-controls="mobile-tools-fan"
        className="mx-auto flex w-full max-w-sm flex-col items-center rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <div
          id="mobile-tools-fan"
          className={`relative w-full ${
            expanded
              ? 'h-[196px]'
              : 'h-[120px]'
          }`}
        >
          {TOOLS.map((tool, index) => {
            const offset = index - MOBILE_MID;
            const col = index % MOBILE_COLS;
            const row = Math.floor(index / MOBILE_COLS);

            return (
              <m.div
                key={tool.id}
                className={`absolute top-2 left-1/2 flex items-center justify-center rounded-2xl border border-border bg-card shadow-tools-mobile origin-bottom theme-transition`}
                style={{
                  width: MOBILE_CARD,
                  height: MOBILE_CARD,
                  marginLeft: -MOBILE_CARD / 2,
                }}
                initial={false}
                animate={
                  expanded
                    ? {
                        x: (col - (MOBILE_COLS - 1) / 2) * (MOBILE_CARD + MOBILE_GAP),
                        y: row * (MOBILE_CARD + MOBILE_LABEL_SLOT),
                        rotate: 0,
                        zIndex: index + 1,
                      }
                    : {
                        x: offset * 18,
                        y: Math.abs(offset) * 2,
                        rotate: tool.rotate * 0.85,
                        zIndex: TOOLS.length - Math.abs(offset),
                      }
                }
                transition={SPRING}
              >
                <ToolIcon tool={tool} className="h-8 w-8 text-foreground drop-shadow-sm" />
                <m.span
                  className="pointer-events-none absolute top-full left-1/2 mt-1 w-[4.25rem] -translate-x-1/2 truncate text-center text-[10px] font-medium leading-tight text-foreground"
                  initial={false}
                  animate={{ opacity: expanded ? 1 : 0, y: expanded ? 0 : 4 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                >
                  {tool.name}
                </m.span>
                <span className="sr-only">{tool.name}</span>
              </m.div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col items-center gap-1">
          <m.span
            aria-hidden="true"
            animate={{ scale: expanded ? 0.92 : [1, 1.08, 1] }}
            transition={
              expanded
                ? { duration: 0.2 }
                : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
            }
            className="text-muted"
          >
            <HandTap className="size-5" weight="duotone" />
          </m.span>
          <span className="text-sm font-medium text-foreground">
            {expanded ? 'Tap to collapse' : 'Tap to expand'}
          </span>
          <span className="text-xs text-muted">
            {expanded ? 'Hide the full tool list' : 'Explore all tools I use'}
          </span>
        </div>
      </button>
    </div>
  );
}

function DesktopToolsFan() {
  return (
    <m.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: EASE_OUT }}
      className="hidden sm:flex items-center justify-center overflow-visible [&>*+*]:-ml-8"
    >
      {TOOLS.map((tool, index) => {
        const borderClass = tool.borderClass ?? 'border-4 border-card';

        return (
          <m.div
            key={tool.id}
            className={`relative group w-32 h-32 rounded-3xl ${borderClass} shadow-elevated flex items-center justify-center cursor-pointer ${tool.bg} origin-bottom theme-transition shrink-0`}
            initial={{ rotate: tool.rotate, y: 0 }}
            whileHover={{
              y: -24,
              rotate: 0,
              scale: 1.15,
              zIndex: 50,
              transition: { type: 'spring', stiffness: 400, damping: 20 },
            }}
            style={{ zIndex: TOOLS.length - Math.abs(3.5 - index) }}
          >
            <ToolIcon tool={tool} className="w-16 h-16 text-foreground drop-shadow-sm" />

            <div className="absolute -top-14 bg-foreground text-canvas text-[13px] font-medium px-3.5 py-2 rounded-xl opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-[opacity,transform] duration-200 ease-out pointer-events-none whitespace-nowrap shadow-xl flex flex-col items-center">
              {tool.name}
              <div className="absolute -bottom-1 size-2.5 bg-foreground rotate-45 rounded-sm"></div>
            </div>
          </m.div>
        );
      })}
    </m.div>
  );
}

export function ToolsStack() {
  return (
    <section className="flex w-full min-w-0 flex-col items-center justify-center">
      <m.div 
        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="text-center mb-12 sm:mb-16"
      >
        <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-4">Tools I Use</h2>
        <p className="text-lg text-muted">The tools I reach for when designing and building digital products.</p>
      </m.div>

      <MobileToolsTapFan />
      <DesktopToolsFan />
    </section>
  );
}
