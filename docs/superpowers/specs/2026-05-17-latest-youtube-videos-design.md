# Latest YouTube Videos Section Design

## Summary

Add a new `Latest Videos` section to the portfolio homepage directly after `Featured Projects`. The section shows the latest videos from `youtube.com/@faizintifada`, visually matching the existing Featured Projects card/grid style, and opens videos on YouTube in a new tab.

The first implementation uses YouTube RSS through a server endpoint. This avoids client-side CORS issues and keeps the UI independent from RSS parsing. The server response shape should be stable enough to replace the RSS provider with the YouTube Data API later without changing the frontend component contract.

## Goals

- Show the latest YouTube videos automatically on the homepage.
- Match the visual language of `Featured Projects`.
- Default to 3 videos while keeping the limit configurable.
- Keep the public homepage clean by hiding the section if YouTube data cannot be loaded.
- Avoid exposing API keys or adding secrets for the first version.
- Preserve an upgrade path to YouTube Data API.

## Non-Goals

- Do not embed or play videos inline on the homepage.
- Do not add a database cache or scheduled sync in the first version.
- Do not create an internal video detail page.
- Do not expose YouTube API keys to the frontend.

## Architecture

Add a Hono endpoint:

```ts
GET /api/youtube/videos?limit=3
```

The endpoint fetches the YouTube RSS feed for the `@faizintifada` channel, parses XML server-side, normalizes entries, and returns JSON:

```ts
type YouTubeVideo = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  publishedAt: string;
};
```

The frontend adds a `useYouTubeVideos` hook that follows the existing `useProjects` pattern and uses the existing API URL helper. A new `LatestVideos` component calls the hook and renders video cards when data exists.

This feature should not add a new client-side data-fetching dependency. The hook should stay small and local unless the project already adopts a shared fetching library before implementation.

The homepage order becomes:

1. `Hero`
2. `FeaturedProjects`
3. `LatestVideos`
4. `ToolsStack`
5. `AboutSection`

## Server Behavior

- Fetch the YouTube RSS feed for `youtube.com/@faizintifada`.
- Parse feed entries into `YouTubeVideo[]`.
- Support a configurable `limit` query parameter.
- Default `limit` to `3`.
- Clamp invalid or excessive limits to a small safe range, such as `1` to `12`.
- Set short cache headers, targeting about 15 minutes.
- Return controlled JSON errors if fetching or parsing fails.
- Keep the RSS parsing/provider logic isolated so it can later be replaced by a YouTube Data API provider.

## Frontend Behavior

- Render a new section titled `Latest Videos`.
- Show a CTA labeled `View YouTube`.
- CTA opens `https://www.youtube.com/@faizintifada` in a new tab.
- Video cards open their YouTube video URLs in a new tab with `rel="noopener noreferrer"`.
- Use the same overall spacing, heading treatment, responsive grid, rounded media, title, and muted subtitle style as `Featured Projects`.
- Use published date as the card subtitle, formatted with `Intl.DateTimeFormat` or an existing local helper. Do not add a date formatting dependency for this feature.
- Prefer rendering nothing until data exists. If a loading skeleton is used, reuse the existing projects skeleton pattern and verify the loading-to-hidden transition does not create distracting layout shift.
- Hide the entire section if the request fails or returns an empty list.
- Keep `LatestVideos` and video cards as simple static React components. Do not define inline child components inside render.

## Error Handling

The server should treat YouTube fetch/parsing failures as controlled failures and return a structured error. The frontend should not show this error to visitors; it should simply omit the `Latest Videos` section.

If a feed entry lacks required data, skip that entry. If a thumbnail is missing but a video ID exists, derive the thumbnail URL from the YouTube video ID.

## Testing And Verification

- Run the project's typecheck/build verification after implementation.
- If test infrastructure exists for hooks or server routes, add focused tests for RSS parsing, limit clamping, and empty/error behavior.
- If React component tests exist, verify `LatestVideos` returns `null` on error or empty data and renders stable external YouTube links when data exists.
- Manually verify the homepage order and that the section appears after `Featured Projects`.
- Manually verify that video cards and the `View YouTube` CTA open in new tabs.
- Manually verify that an endpoint failure hides the section instead of showing a public error state.

## Open Decisions

No open product decisions remain for this design. Implementation can choose exact file names and helper boundaries based on existing project conventions.
