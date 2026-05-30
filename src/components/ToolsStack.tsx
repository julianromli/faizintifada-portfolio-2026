import { m } from 'motion/react';
import { isThemeAwareToolIcon, THEME_AWARE_TOOL_ICONS } from './tool-icons';

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

export function ToolsStack() {
  return (
    <section className="flex flex-col items-center justify-center overflow-visible">
      <m.div 
        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] as const }}
        className="text-center mb-12 sm:mb-16"
      >
        <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-4">Tools I Use</h2>
        <p className="text-lg text-muted">The tools I reach for when designing and building digital products.</p>
      </m.div>
      
      <m.div 
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] as const }}
        className="flex items-center justify-center px-4 [&>*+*]:-ml-4 sm:[&>*+*]:-ml-8"
      >
        {TOOLS.map((tool, index) => {
          const borderClass = tool.borderClass ?? 'border-4 border-card';
          const ThemeIcon = isThemeAwareToolIcon(tool.id) ? THEME_AWARE_TOOL_ICONS[tool.id] : null;
          const iconClassName = 'w-12 h-12 sm:w-16 sm:h-16 text-foreground drop-shadow-sm';

          return (
            <m.div
              key={tool.id}
              className={`relative group w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl ${borderClass} shadow-elevated flex items-center justify-center cursor-pointer ${tool.bg} origin-bottom theme-transition`}
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
              {ThemeIcon ? (
                <ThemeIcon className={iconClassName} />
              ) : (
                <img
                  src={tool.icon}
                  alt={tool.name}
                  className={`${iconClassName} object-contain ${tool.imgClassName ?? ''}`.trim()}
                />
              )}

              {/* Tooltip */}
              <div className="absolute -top-14 bg-foreground text-canvas text-[13px] font-medium px-3.5 py-2 rounded-xl opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 ease-out pointer-events-none whitespace-nowrap shadow-xl flex flex-col items-center">
                {tool.name}
                <div className="absolute -bottom-1 size-2.5 bg-foreground rotate-45 rounded-sm"></div>
              </div>
            </m.div>
          );
        })}
      </m.div>
    </section>
  );
}