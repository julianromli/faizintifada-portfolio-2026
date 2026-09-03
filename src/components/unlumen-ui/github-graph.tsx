import * as React from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { useTheme } from '../../hooks/useTheme';

export type GithubGraphVariant = 'github' | 'graphite' | 'ocean' | 'violet';
export type GithubGraphAnimation = 'wave' | 'scan' | 'cascade';
export type GithubGraphAmbientEffect = 'none' | 'tide' | 'drift' | 'twinkle';

export type GithubContribution = {
  date: string;
  count: number;
  level?: number;
};

export type GithubContributionCell = GithubContribution & {
  level: number;
};

export type GithubContributionWeek = GithubContributionCell[];

export interface GithubGraphProps {
  /** GitHub username, with or without a leading @. @default "shadcn" */
  account?: string;
  /** Number of recent calendar months to display. @default 6 */
  months?: number;
  /** Color treatment for contribution levels. @default "github" */
  variant?: GithubGraphVariant;
  /** Entrance choreography for graph cells. @default "wave" */
  animation?: GithubGraphAnimation;
  /** Animation multiplier; higher values reveal the graph faster. @default 1 */
  animationSpeed?: number;
  /** Size of each contribution cell in pixels. @default 18 */
  cellSize?: number;
  /** Space between contribution cells in pixels. @default 4 */
  cellGap?: number;
  /** Corner radius of contribution cells in pixels. @default 3 */
  cellRadius?: number;
  /** Shows the contribution-level legend. @default false */
  showLegend?: boolean;
  /** Shows the account name above the graph. @default true */
  showAccount?: boolean;
  /** Persistent, subtle motion pattern applied to graph cells. @default "twinkle" */
  ambientEffect?: GithubGraphAmbientEffect;
  /** Strength of the persistent cell motion. @default 0.65 */
  ambientIntensity?: number;
  /** Optional preloaded contributions, which bypass the public fetch. */
  data?: GithubContribution[];
  className?: string;
}

type ResourceState =
  | { status: 'loading' }
  | { status: 'ready'; contributions: GithubContribution[] }
  | { status: 'error'; message: string };

const CONTRIBUTIONS_ENDPOINT = 'https://github-contributions-api.jogruber.de/v4';

const VARIANTS: Record<GithubGraphVariant, [string, string, string, string, string]> = {
  github: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  graphite: ['#eeeeee', '#cccccc', '#969696', '#5f5f5f', '#171717'],
  ocean: ['#e6f5ff', '#b4e2ff', '#62bdf5', '#2585d8', '#124e93'],
  violet: ['#f2eaff', '#dcc5ff', '#b486ff', '#8355df', '#52269c'],
};

const DARK_VARIANTS: Partial<Record<GithubGraphVariant, [string, string, string, string, string]>> = {
  github: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  graphite: ['#161b22', '#3a3a36', '#5f5f5f', '#969696', '#e6e5e0'],
};

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function dateFromISO(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function fallbackLevel(count: number, maxCount: number): number {
  if (!Number.isFinite(count) || count <= 0 || maxCount <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / maxCount) * 4)));
}

/** Returns a valid GitHub handle without its optional @ prefix. */
function normalizeGithubAccount(account: string): string | null {
  const normalized = account.trim().replace(/^@+/, '');
  return /^(?!-)[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(normalized) ? normalized : null;
}

/** Builds Sunday-first calendar columns and fills missing dates with level zero. */
function buildContributionWeeks(contributions: GithubContribution[]): GithubContributionWeek[] {
  const valid = contributions
    .map((item) => ({ ...item, parsedDate: dateFromISO(item.date) }))
    .filter((item): item is GithubContribution & { parsedDate: Date } => item.parsedDate !== null && Number.isFinite(item.count))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (valid.length === 0) return [];

  const maxCount = Math.max(0, ...valid.map((item) => item.count));
  const byDate = new Map(valid.map((item) => [item.date, item]));
  const firstDate = valid[0]!.parsedDate;
  const lastDate = valid[valid.length - 1]!.parsedDate;
  const startDate = addDays(firstDate, -firstDate.getUTCDay());
  const endDate = addDays(lastDate, 6 - lastDate.getUTCDay());
  const cells: GithubContributionCell[] = [];

  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    const key = isoDate(date);
    const contribution = byDate.get(key);
    const count = Math.max(0, contribution?.count ?? 0);
    const explicitLevel = contribution?.level;
    const level =
      Number.isInteger(explicitLevel) && explicitLevel! >= 0 && explicitLevel! <= 4
        ? count === 0
          ? 0
          : explicitLevel!
        : fallbackLevel(count, maxCount);

    cells.push({ date: key, count, level });
  }

  return Array.from({ length: Math.ceil(cells.length / 7) }, (_, index) => cells.slice(index * 7, index * 7 + 7));
}

function selectRecentContributions(contributions: GithubContribution[], months: number): GithubContribution[] {
  const parsed = contributions
    .map((contribution) => ({
      contribution,
      date: dateFromISO(contribution.date),
    }))
    .filter((item): item is { contribution: GithubContribution; date: Date } => item.date !== null);
  const latest = parsed.reduce<Date | null>((current, item) => (!current || item.date > current ? item.date : current), null);

  if (!latest) return [];

  const start = new Date(latest);
  start.setUTCMonth(start.getUTCMonth() - Math.max(1, Math.min(12, Math.round(months))));
  return parsed.filter((item) => item.date >= start).map((item) => item.contribution);
}

const CONTRIBUTION_DATE_FORMATTER = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
});

function formatContributionLabel(contribution: GithubContributionCell): string {
  const date = CONTRIBUTION_DATE_FORMATTER.format(dateFromISO(contribution.date) ?? new Date());
  const label = contribution.count === 1 ? 'contribution' : 'contributions';
  return `${contribution.count} ${label} · ${date}`;
}

function getCellDelay(animation: GithubGraphAnimation, weekIndex: number, dayIndex: number, speed: number): number {
  const step =
    animation === 'wave' ? weekIndex * 0.026 + dayIndex * 0.016 : animation === 'scan' ? weekIndex * 0.03 : (weekIndex + dayIndex * 2) * 0.018;
  return step / Math.max(speed, 0.1);
}

function getAmbientCellMotion(
  effect: GithubGraphAmbientEffect,
  intensity: number,
  weekIndex: number,
  dayIndex: number,
  entranceDelay: number,
  reducedMotion: boolean | null,
) {
  if (reducedMotion || effect === 'none') {
    return {
      animate: { opacity: 1, scale: 1 },
      transition: {
        opacity: { duration: 0.14, delay: entranceDelay },
        scale: { type: 'spring' as const, stiffness: 900, damping: 32 },
      },
    };
  }

  const strength = Math.min(1, Math.max(0, intensity));
  const seed = ((weekIndex * 17 + dayIndex * 31) % 11) / 10;
  const isTide = effect === 'tide';
  const isDrift = effect === 'drift';
  const duration = isTide ? 3.2 : isDrift ? 3.8 + seed : 2 + seed * 1.4;
  const delay = entranceDelay + (isTide ? (weekIndex + dayIndex * 1.8) * 0.055 : seed * 0.85);
  const lowOpacity = 1 - (isTide ? 0.24 : isDrift ? 0.16 : 0.34) * strength;
  const smallScale = 1 - (isTide ? 0.07 : isDrift ? 0.04 : 0.08) * strength;

  return {
    animate: {
      opacity: isDrift ? [1, lowOpacity, 1 - 0.06 * strength, 1] : [1, lowOpacity, 1],
      scale: isDrift ? [1, smallScale, 1 + 0.025 * strength, 1] : [1, smallScale, 1],
    },
    transition: {
      opacity: {
        duration,
        delay,
        ease: 'easeInOut' as const,
        repeat: Infinity,
      },
      scale: { duration, delay, ease: 'easeInOut' as const, repeat: Infinity },
    },
  };
}

function LoadingGraph({
  cellSize,
  cellGap,
  cellRadius,
  months,
}: Pick<GithubGraphProps, 'cellSize' | 'cellGap' | 'cellRadius' | 'months'>) {
  const weekCount = Math.ceil((Math.max(1, months ?? 3) * 31 + 6) / 7);

  return (
    <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max" style={{ gap: cellGap }} aria-label="Loading contributions">
        {Array.from({ length: weekCount }, (_, week) => (
          <div key={week} className="grid grid-rows-7" style={{ gap: cellGap }}>
            {Array.from({ length: 7 }, (_, day) => (
              <span
                key={day}
                className="animate-pulse bg-surface"
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: cellRadius,
                  animationDelay: `${(week + day) * 12}ms`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** True while `ref`'s element is near or inside the viewport. */
function useOnScreen(ref: React.RefObject<HTMLElement | null>): boolean {
  const [onScreen, setOnScreen] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setOnScreen(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry?.isIntersecting ?? false),
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return onScreen;
}

/** Roving tabindex over the week/day grid: one tab stop, arrow keys move within it. */
function useRovingGridFocus(weeks: GithubContributionWeek[]) {
  const [focusedCell, setFocusedCell] = React.useState({ weekIndex: 0, dayIndex: 0 });
  const gridRef = React.useRef<HTMLDivElement>(null);

  const handleFocusCell = React.useCallback((weekIndex: number, dayIndex: number) => {
    setFocusedCell({ weekIndex, dayIndex });
  }, []);

  const onGridKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const { weekIndex, dayIndex } = focusedCell;
      const lastWeek = weeks.length - 1;
      if (lastWeek < 0) return;

      let nextWeek = weekIndex;
      let nextDay = dayIndex;

      switch (event.key) {
        case 'ArrowRight':
          nextWeek = Math.min(lastWeek, weekIndex + 1);
          break;
        case 'ArrowLeft':
          nextWeek = Math.max(0, weekIndex - 1);
          break;
        case 'ArrowDown':
          nextDay = Math.min(6, dayIndex + 1);
          break;
        case 'ArrowUp':
          nextDay = Math.max(0, dayIndex - 1);
          break;
        case 'Home':
          nextWeek = 0;
          break;
        case 'End':
          nextWeek = lastWeek;
          break;
        default:
          return;
      }

      // Clamp to a week that actually has this day (the last week can be short).
      while (nextWeek >= 0 && !weeks[nextWeek]?.[nextDay]) nextWeek -= 1;
      if (nextWeek < 0) return;

      event.preventDefault();
      setFocusedCell({ weekIndex: nextWeek, dayIndex: nextDay });
      gridRef.current
        ?.querySelector<HTMLButtonElement>(`[data-cell="${nextWeek}-${nextDay}"]`)
        ?.focus();
    },
    [focusedCell, weeks],
  );

  return { focusedCell, gridRef, handleFocusCell, onGridKeyDown };
}

interface ContributionCellProps {
  contribution: GithubContributionCell;
  weekIndex: number;
  dayIndex: number;
  color: string;
  cellSize: number;
  cellRadius: number;
  /** 0 when this cell is outside the hover wave; drives the brightness filter. */
  waveStrength: number;
  /** Roving tabindex: exactly one cell in the grid is tabbable at a time. */
  isTabbable: boolean;
  ambientEffect: GithubGraphAmbientEffect;
  ambientIntensity: number;
  entranceDelay: number;
  reducedMotion: boolean | null;
  onFocusCell: (weekIndex: number, dayIndex: number) => void;
  onShowTooltip: (
    element: HTMLButtonElement,
    contribution: GithubContributionCell,
    weekIndex: number,
    dayIndex: number,
    pointer?: { clientX: number; clientY: number },
  ) => void;
  onHideTooltip: () => void;
}

/** Memoized so a hover only re-renders the cells whose waveStrength actually changed. */
const ContributionCell = React.memo(function ContributionCell({
  contribution,
  weekIndex,
  dayIndex,
  color,
  cellSize,
  cellRadius,
  waveStrength,
  isTabbable,
  ambientEffect,
  ambientIntensity,
  entranceDelay,
  reducedMotion,
  onFocusCell,
  onShowTooltip,
  onHideTooltip,
}: ContributionCellProps) {
  const label = formatContributionLabel(contribution);
  const ambientMotion = React.useMemo(
    () =>
      getAmbientCellMotion(
        ambientEffect,
        ambientIntensity,
        weekIndex,
        dayIndex,
        entranceDelay,
        reducedMotion,
      ),
    [ambientEffect, ambientIntensity, weekIndex, dayIndex, entranceDelay, reducedMotion],
  );
  const filter = `brightness(${1 + waveStrength * 0.45}) saturate(${1 + waveStrength * 0.2})`;

  return (
    <m.button
      type="button"
      role="gridcell"
      aria-label={label}
      data-cell={`${weekIndex}-${dayIndex}`}
      tabIndex={isTabbable ? 0 : -1}
      className="relative outline-none ring-offset-2 ring-offset-card transition-shadow focus-visible:ring-2 focus-visible:ring-foreground/60"
      style={{
        width: cellSize,
        height: cellSize,
        borderRadius: cellRadius,
      }}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.35, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0, filter }}
      transition={{
        opacity: { duration: 0.14, delay: entranceDelay },
        y: {
          type: 'spring',
          stiffness: 520,
          damping: 28,
          delay: entranceDelay,
        },
        scale: { type: 'spring', stiffness: 900, damping: 32 },
        filter: { duration: 0.08, ease: 'easeOut' },
      }}
      onMouseEnter={(event) =>
        onShowTooltip(event.currentTarget, contribution, weekIndex, dayIndex, event)
      }
      onFocus={(event) => {
        onFocusCell(weekIndex, dayIndex);
        onShowTooltip(event.currentTarget, contribution, weekIndex, dayIndex);
      }}
      onBlur={onHideTooltip}
    >
      <m.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundColor: color,
          borderRadius: cellRadius,
        }}
        animate={ambientMotion.animate}
        transition={ambientMotion.transition}
      />
    </m.button>
  );
});

export function GithubGraph({
  account = 'shadcn',
  months = 6,
  variant = 'github',
  animation = 'wave',
  animationSpeed = 1,
  cellSize = 18,
  cellGap = 4,
  cellRadius = 3,
  showLegend = false,
  showAccount = true,
  ambientEffect = 'twinkle',
  ambientIntensity = 0.65,
  data,
  className,
}: GithubGraphProps) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const normalizedAccount = React.useMemo(() => normalizeGithubAccount(account), [account]);
  const [resource, setResource] = React.useState<ResourceState>({
    status: 'loading',
  });
  const [hoveredContribution, setHoveredContribution] = React.useState<{
    contribution: GithubContributionCell;
    left: number;
    top: number;
    originLeft: number;
    originTop: number;
    placement: 'above' | 'below';
    weekIndex: number;
    dayIndex: number;
  } | null>(null);
  const colors = (theme === 'dark' ? DARK_VARIANTS[variant] : undefined) ?? VARIANTS[variant];
  const resolvedCellRadius = Math.max(0, Math.min(cellRadius, Math.max(0, cellSize) / 2));

  React.useEffect(() => {
    if (data) {
      setResource({ status: 'ready', contributions: data });
      return;
    }

    if (!normalizedAccount) {
      setResource({
        status: 'error',
        message: 'Enter a valid GitHub username.',
      });
      return;
    }

    const controller = new AbortController();
    setResource({ status: 'loading' });

    fetch(`${CONTRIBUTIONS_ENDPOINT}/${normalizedAccount}?y=last`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('GitHub account not found.');
        const payload = (await response.json()) as {
          contributions?: GithubContribution[];
        };
        if (!Array.isArray(payload.contributions)) {
          throw new Error('No public contributions were returned.');
        }
        return payload.contributions;
      })
      .then((contributions) => {
        if (!controller.signal.aborted) {
          setResource({ status: 'ready', contributions });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResource({
          status: 'error',
          message: error instanceof Error ? error.message : 'Could not load contributions.',
        });
      });

    return () => controller.abort();
  }, [data, normalizedAccount]);

  const weeks = React.useMemo(() => {
    if (resource.status !== 'ready') return [];
    return buildContributionWeeks(selectRecentContributions(resource.contributions, months));
  }, [months, resource]);
  const animationKey = `${normalizedAccount ?? account}-${months}-${variant}-${animation}-${cellSize}-${cellGap}`;

  const showTooltip = React.useCallback(
    (
      element: HTMLButtonElement,
      contribution: GithubContributionCell,
      weekIndex: number,
      dayIndex: number,
      pointer?: { clientX: number; clientY: number },
    ) => {
      const cellRect = element.getBoundingClientRect();
      const placement = cellRect.top > 56 ? 'above' : 'below';
      const left = Math.min(Math.max(cellRect.left + cellRect.width / 2, 96), window.innerWidth - 96);
      setHoveredContribution({
        contribution,
        left,
        top: placement === 'above' ? cellRect.top - 9 : cellRect.bottom + 9,
        originLeft: pointer?.clientX ?? left,
        originTop: pointer?.clientY ?? cellRect.top + cellRect.height / 2,
        placement,
        weekIndex,
        dayIndex,
      });
    },
    [],
  );

  const hideTooltip = React.useCallback(() => setHoveredContribution(null), []);

  // The ambient cell effect loops forever, so only run it while the graph is on
  // screen — otherwise ~365 infinite animations keep the main thread busy for as
  // long as the page is open.
  const containerRef = React.useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(containerRef);
  const activeAmbientEffect = onScreen ? ambientEffect : 'none';

  const { focusedCell, gridRef, handleFocusCell, onGridKeyDown } = useRovingGridFocus(weeks);

  return (
    <div
      ref={containerRef}
      className={cn('w-fit max-w-full', className)}
      aria-busy={resource.status === 'loading'}
    >
      {showAccount && (
        <p className="mb-5 text-lg font-medium tracking-tight text-foreground">@{normalizedAccount ?? account}</p>
      )}

      {resource.status === 'loading' && (
        <LoadingGraph cellSize={cellSize} cellGap={cellGap} cellRadius={resolvedCellRadius} months={months} />
      )}

      {resource.status === 'error' && <p className="text-sm text-muted">{resource.message}</p>}

      {resource.status === 'ready' && weeks.length > 0 && (
        <div className="overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div
            ref={gridRef}
            className="relative flex min-w-max"
            style={{ gap: cellGap }}
            role="grid"
            aria-label={`GitHub contributions for ${normalizedAccount ?? account}`}
            onKeyDown={onGridKeyDown}
            onMouseLeave={hideTooltip}
          >
            {weeks.map((week, weekIndex) => (
              <div key={`${animationKey}-${weekIndex}`} className="grid grid-rows-7" style={{ gap: cellGap }} role="row">
                {week.map((contribution, dayIndex) => {
                  const entranceDelay = reducedMotion ? 0 : getCellDelay(animation, weekIndex, dayIndex, animationSpeed);
                  const distance = hoveredContribution
                    ? Math.hypot(weekIndex - hoveredContribution.weekIndex, dayIndex - hoveredContribution.dayIndex)
                    : Infinity;
                  return (
                    <ContributionCell
                      key={`${animationKey}-${contribution.date}`}
                      contribution={contribution}
                      weekIndex={weekIndex}
                      dayIndex={dayIndex}
                      color={colors[contribution.level]}
                      cellSize={cellSize}
                      cellRadius={resolvedCellRadius}
                      waveStrength={Math.max(0, 1 - distance / 3)}
                      isTabbable={
                        focusedCell.weekIndex === weekIndex && focusedCell.dayIndex === dayIndex
                      }
                      ambientEffect={activeAmbientEffect}
                      ambientIntensity={ambientIntensity}
                      entranceDelay={entranceDelay}
                      reducedMotion={reducedMotion}
                      onFocusCell={handleFocusCell}
                      onShowTooltip={showTooltip}
                      onHideTooltip={hideTooltip}
                    />
                  );
                })}
              </div>
            ))}
            <AnimatePresence>
              {hoveredContribution && (
                <m.span
                  className="pointer-events-none fixed left-0 top-0 z-50"
                  style={{ transformOrigin: '0% 0%' }}
                  initial={{
                    opacity: 0,
                    scale: 0.92,
                    x: hoveredContribution.originLeft,
                    y: hoveredContribution.originTop,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: hoveredContribution.left,
                    y: hoveredContribution.top,
                  }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{
                    opacity: { duration: 0.12 },
                    scale: { duration: 0.12 },
                    x: { type: 'spring', stiffness: 620, damping: 42 },
                    y: { type: 'spring', stiffness: 620, damping: 42 },
                  }}
                >
                  <span
                    role="tooltip"
                    className={cn(
                      'block -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-3 py-1.5 text-sm font-medium text-card ring-1 ring-foreground/15',
                      hoveredContribution.placement === 'above' && '-translate-y-full',
                    )}
                  >
                    {formatContributionLabel(hoveredContribution.contribution)}
                  </span>
                </m.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {showLegend && resource.status === 'ready' && (
        <div className="mt-4 flex items-center gap-1.5 text-[13px] font-medium text-muted" aria-label="Contribution activity legend">
          <span>Less</span>
          {colors.map((color, level) => (
            <span
              key={color}
              className="border border-foreground/[0.03]"
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: color,
                borderRadius: resolvedCellRadius,
              }}
              aria-label={`Level ${level}`}
            />
          ))}
          <span>More</span>
        </div>
      )}
    </div>
  );
}
