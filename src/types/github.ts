export interface GitHubContributionDay {
  date: string;
  contributionCount: number;
  color: string;
  weekday: number;
}

export interface GitHubContributionWeek {
  contributionDays: GitHubContributionDay[];
}

export interface GitHubContributions {
  username: string;
  profileUrl: string;
  totalContributions: number;
  weeks: GitHubContributionWeek[];
}
