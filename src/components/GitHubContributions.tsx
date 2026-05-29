import { ArrowRight } from '@phosphor-icons/react';
import type { GitHubContributionWeek } from '../types/github';
import { useGitHubContributions } from '../hooks/useGitHubContributions';

const monthFormatter = new Intl.DateTimeFormat('en', { month: 'short' });
const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const weekdayLabels = [
  { label: 'Mon', rowStart: 2 },
  { label: 'Wed', rowStart: 4 },
  { label: 'Fri', rowStart: 6 },
];
const legendColors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
const legendColorsDark = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

export function GitHubContributions() {
  const { contributions, loading, error } = useGitHubContributions();

  if (loading || error || !contributions || contributions.weeks.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">GitHub Contributions</h2>
          <p className="mt-2 text-[15px] font-medium text-muted">
            {contributions.totalContributions.toLocaleString()} contributions in the last year
          </p>
        </div>
        <a
          href={contributions.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-x-2 text-[15px] font-medium text-muted hover:text-foreground theme-transition group"
        >
          <span>View GitHub</span>
          <ArrowRight size={16} className="text-muted group-hover:text-foreground theme-transition" />
        </a>
      </div>

      <div className="rounded-[1rem] border border-border bg-card p-5 sm:p-6 overflow-x-auto theme-transition">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[36px_1fr] gap-x-3">
            <div />
            <div
              className="grid gap-[3px] text-[13px] font-medium text-muted"
              style={{ gridTemplateColumns: `repeat(${contributions.weeks.length}, minmax(0, 1fr))` }}
            >
              {contributions.weeks.map((week, index) => (
                <span key={getWeekKey(week, index)} className="h-5">
                  {getMonthLabel(contributions.weeks, index)}
                </span>
              ))}
            </div>

            <div className="grid grid-rows-7 gap-[3px] pt-[3px] text-[13px] font-medium text-muted">
              {weekdayLabels.map((weekday) => (
                <span key={weekday.label} style={{ gridRowStart: weekday.rowStart }}>
                  {weekday.label}
                </span>
              ))}
            </div>

            <div className="grid grid-flow-col grid-rows-7 gap-[3px] pt-[3px]">
              {contributions.weeks.flatMap((week, weekIndex) =>
                week.contributionDays.map((day) => (
                  <span
                    key={day.date}
                    title={`${day.contributionCount} contributions on ${formatDate(day.date)}`}
                    aria-label={`${day.contributionCount} contributions on ${formatDate(day.date)}`}
                    className="size-3.5 rounded-[3px] border border-foreground/[0.03]"
                    style={{
                      backgroundColor: day.color,
                      gridColumnStart: weekIndex + 1,
                      gridRowStart: day.weekday + 1,
                    }}
                  />
                )),
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[13px] font-medium text-muted">
            <a
              href="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/managing-contribution-settings-on-your-profile/viewing-contributions-on-your-profile"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground theme-transition"
            >
              Learn how GitHub counts contributions
            </a>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              {legendColors.map((color) => (
                <span
                  key={color}
                  className="size-3.5 rounded-[3px] border border-foreground/[0.03] dark:hidden"
                  style={{ backgroundColor: color }}
                />
              ))}
              {legendColorsDark.map((color) => (
                <span
                  key={color}
                  className="hidden size-3.5 rounded-[3px] border border-foreground/[0.03] dark:inline-block"
                  style={{ backgroundColor: color }}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getMonthLabel(weeks: GitHubContributionWeek[], index: number): string {
  const currentMonth = getWeekMonth(weeks[index]);
  const previousMonth = index > 0 ? getWeekMonth(weeks[index - 1]) : undefined;

  if (currentMonth === undefined || currentMonth === previousMonth) {
    return '';
  }

  return monthFormatter.format(new Date(`${currentMonth}-02T00:00:00`));
}

function getWeekMonth(week: GitHubContributionWeek): string | undefined {
  return week.contributionDays[0]?.date.slice(0, 7);
}

function getWeekKey(week: GitHubContributionWeek, index: number): string {
  return week.contributionDays[0]?.date ?? String(index);
}

function formatDate(value: string): string {
  return dateFormatter.format(new Date(`${value}T00:00:00`));
}
