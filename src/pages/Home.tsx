import { Hero } from '../components/Hero';
import { FeaturedProjects } from '../components/FeaturedProjects';
import { AboutSection } from '../components/AboutSection';
import { ToolsStack } from '../components/ToolsStack';
import { LatestVideos } from '../components/LatestVideos';
import { GitHubContributions } from '../components/GitHubContributions';

export function Home() {
  return (
    <main className="space-y-32">
      <Hero />
      <FeaturedProjects />
      <LatestVideos />
      <GitHubContributions />
      <ToolsStack />
      <AboutSection />
    </main>
  );
}
