import type { GitHubContributions } from '../src/types/github.js';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const DEFAULT_GITHUB_USERNAME = 'faizintifada';

const CONTRIBUTIONS_QUERY = `
  query GitHubContributions($login: String!) {
    user(login: $login) {
      login
      url
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
              weekday
              color
            }
          }
        }
      }
    }
  }
`;

interface GitHubGraphQLResponse {
  data?: {
    user?: {
      login: string;
      url: string;
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: GitHubContributions['weeks'];
        };
      };
    } | null;
  };
  errors?: Array<{ message?: string }>;
}

export async function fetchGitHubContributions(): Promise<GitHubContributions> {
  const token = process.env.GITHUB_TOKEN?.trim();
  const username = process.env.GITHUB_USERNAME?.trim() || DEFAULT_GITHUB_USERNAME;

  if (!token) {
    throw new Error('GITHUB_TOKEN is not set');
  }

  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'faizintifada-portfolio',
    },
    body: JSON.stringify({
      query: CONTRIBUTIONS_QUERY,
      variables: { login: username },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed (${response.status})`);
  }

  const body = (await response.json()) as GitHubGraphQLResponse;
  if (body.errors?.length) {
    throw new Error(body.errors.map((error) => error.message).filter(Boolean).join('; '));
  }

  const user = body.data?.user;
  if (!user) {
    throw new Error(`GitHub user not found: ${username}`);
  }

  const calendar = user.contributionsCollection.contributionCalendar;

  return {
    username: user.login,
    profileUrl: user.url,
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks,
  };
}
