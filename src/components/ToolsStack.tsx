import { motion } from 'motion/react';

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
    bg: 'bg-[#FAFAFA]',
    imgClassName: 'border-0',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg', 
    rotate: -21 
  },
  { 
    id: 'google-ai-studio', 
    name: 'Google AI Studio', 
    bg: 'bg-[#FAFAFA]', 
    icon: 'https://mh00j7jocs.ufs.sh/f/Qnr0iOx9K6xJeroJZ67v7EOcR6jGLWBNTApisPuaeDYMUbnI', 
    rotate: -15 
  },
  { 
    id: 'hermes-agents', 
    name: 'Hermes Agents', 
    bg: 'bg-[#FAFAFA]',
    borderClass: 'border-4 border-[#F5F5F5]',
    icon: 'https://mh00j7jocs.ufs.sh/f/Qnr0iOx9K6xJzp8gzHQ01jPoxERhQSFJuI2qmrfb95LAUe3C', 
    rotate: -9 
  },
  { 
    id: 'davinci-resolve', 
    name: 'DaVinci Resolve', 
    bg: 'bg-[#FAFAFA]', 
    icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/DaVinci_Resolve_Studio.png', 
    rotate: -3 
  },
  { 
    id: 'obsidian', 
    name: 'Obsidian', 
    bg: 'bg-[#FAFAFA]', 
    icon: 'https://upload.wikimedia.org/wikipedia/commons/1/10/2023_Obsidian_logo.svg', 
    rotate: 3 
  },
  { 
    id: 'cursor', 
    name: 'Cursor', 
    bg: 'bg-[#FAFAFA]', 
    icon: 'https://mh00j7jocs.ufs.sh/f/Qnr0iOx9K6xJ8y11lI5HNL9CO2WPxU8zlIhd0i7GsmceFJDy', 
    rotate: 9 
  },
  { 
    id: 'pi', 
    name: 'Pi Agent', 
    bg: 'bg-[#222222]', 
    icon: 'https://camo.githubusercontent.com/0a417ac08f65d3a99f29136b4ce9461da31d19d15099dfeaba8db96a30ad3193/68747470733a2f2f70692e6465762f6c6f676f2d6175746f2e737667', 
    rotate: 15 
  },
  { 
    id: 'codex', 
    name: 'Codex', 
    bg: 'bg-[#FAFAFA]', 
    icon: 'https://mh00j7jocs.ufs.sh/f/Qnr0iOx9K6xJvzLF0kt3OERfomb5VsYrNqh3BI4C2GiPLp7z', 
    rotate: 21 
  },
];

export function ToolsStack() {
  return (
    <section className="flex flex-col items-center justify-center overflow-visible">
      <motion.div 
        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] as const }}
        className="text-center mb-12 sm:mb-16"
      >
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900 mb-4">Tools I Use</h2>
        <p className="text-lg text-gray-500">My favorite stack for designing and building digital experiences.</p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] as const }}
        className="flex items-center justify-center -space-x-4 sm:-space-x-8 px-4"
      >
        {TOOLS.map((tool, index) => {
          const borderClass = tool.borderClass ?? 'border-4 border-white';
          return (
            <motion.div
              key={tool.id}
              className={`relative group w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl ${borderClass} shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center cursor-pointer ${tool.bg} origin-bottom`}
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
              <img
                src={tool.icon}
                alt={tool.name}
                className={`w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-sm ${tool.imgClassName ?? ''}`.trim()}
              />

              {/* Tooltip */}
              <div className="absolute -top-14 bg-gray-900 text-white text-[13px] font-medium px-3.5 py-2 rounded-xl opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 ease-out pointer-events-none whitespace-nowrap shadow-xl flex flex-col items-center">
                {tool.name}
                {/* Tooltip Arrow */}
                <div className="absolute -bottom-1 w-2.5 h-2.5 bg-gray-900 rotate-45 rounded-sm"></div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}