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
      alt={tool.name}
      loading="lazy"
      decoding="async"
      className={`${className} object-contain ${tool.imgClassName ?? ''}`.trim()}
    />
  );
}

function MobileToolsGrid() {
  return (
    <m.ul
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      className="grid w-full grid-cols-4 gap-3 sm:hidden"
      aria-label="Tools I use"
    >
      {TOOLS.map((tool, index) => {
        const borderClass = tool.borderClass ?? 'border-4 border-card';

        return (
          <m.li
            key={tool.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: index * 0.04, ease: EASE_OUT }}
            className="min-w-0"
          >
            <div
              className={`relative aspect-square w-full rounded-2xl ${borderClass} shadow-elevated flex items-center justify-center ${tool.bg} theme-transition`}
              title={tool.name}
            >
              <ToolIcon tool={tool} className="w-9 h-9 text-foreground drop-shadow-sm" />
              <span className="sr-only">{tool.name}</span>
            </div>
          </m.li>
        );
      })}
    </m.ul>
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

      <MobileToolsGrid />
      <DesktopToolsFan />
    </section>
  );
}
