import { Hero } from '../components/Hero';
import { Seo } from '../components/Seo';
import { FeaturedProjects } from '../components/FeaturedProjects';
import { AboutSection } from '../components/AboutSection';
import { ToolsStack } from '../components/ToolsStack';
import { LatestVideos } from '../components/LatestVideos';
import { GitHubContributions } from '../components/GitHubContributions';
import { personSchema } from '../lib/seo';

export function Home() {
  return (
    <>
      <Seo jsonLd={personSchema()} />
      <main className="space-y-32">
      <Hero />
      <FeaturedProjects />
      <LatestVideos />
      <GitHubContributions />
      <ToolsStack />
      <AboutSection />
    </main>
    </>
  );
}
