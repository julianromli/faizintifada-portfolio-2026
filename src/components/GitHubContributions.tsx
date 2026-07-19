import { ArrowRight } from '@phosphor-icons/react';
import { useMemo } from 'react';
import type { GithubContribution } from './unlumen-ui/github-graph';
import { GithubGraph } from './unlumen-ui/github-graph';
import { useGitHubContributions } from '../hooks/useGitHubContributions';

export function GitHubContributions() {
  const { contributions, loading, error } = useGitHubContributions();

  const data = useMemo((): GithubContribution[] | null => {
    if (!contributions?.weeks.length) return null;
    return contributions.weeks.flatMap((week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
      })),
    );
  }, [contributions]);

  if (loading || error || !contributions || !data || data.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
          className="group flex items-center gap-x-2 text-[15px] font-medium text-muted theme-transition hover:text-foreground"
        >
          <span>View GitHub</span>
          <ArrowRight size={16} className="text-muted theme-transition group-hover:text-foreground" />
        </a>
      </div>

      <div className="overflow-x-auto rounded-[1rem] border border-border bg-card p-5 theme-transition sm:p-6">
        <GithubGraph
          account={contributions.username}
          data={data}
          months={12}
          showAccount={false}
          showLegend
          animation="wave"
          ambientEffect="twinkle"
          cellSize={14}
          cellGap={3}
          className="mx-auto"
        />
      </div>
    </section>
  );
}
