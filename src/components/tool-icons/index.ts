import type { ComponentType } from 'react';
import { CursorIcon } from '../CursorIcon';
import { GoogleAiStudioIcon } from './GoogleAiStudioIcon';
import { HermesAgentsIcon } from './HermesAgentsIcon';
import { PiAgentIcon } from './PiAgentIcon';

type ThemeAwareIconProps = {
  className?: string;
};

export const THEME_AWARE_TOOL_ICONS: Record<string, ComponentType<ThemeAwareIconProps>> = {
  'google-ai-studio': GoogleAiStudioIcon,
  'hermes-agents': HermesAgentsIcon,
  cursor: CursorIcon,
  pi: PiAgentIcon,
};

export function isThemeAwareToolIcon(id: string): id is keyof typeof THEME_AWARE_TOOL_ICONS {
  return id in THEME_AWARE_TOOL_ICONS;
}

export type { ThemeAwareIconProps };
