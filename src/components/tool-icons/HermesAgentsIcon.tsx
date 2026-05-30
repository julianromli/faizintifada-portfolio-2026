import hermesAgentsSvg from './hermes-agents.svg?raw';

type HermesAgentsIconProps = {
  className?: string;
};

/** Hermes Agents mark — uses currentColor for light/dark theme. */
export function HermesAgentsIcon({ className }: HermesAgentsIconProps) {
  const svg = hermesAgentsSvg.replace(
    '<svg fill="currentColor" width="100%" height="100%"',
    '<svg fill="currentColor" width="100%" height="100%" class="size-full"',
  );

  return (
    <span
      className={`inline-flex ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: svg }}
      aria-hidden
    />
  );
}
