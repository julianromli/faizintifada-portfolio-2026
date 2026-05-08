import { Hero } from '../components/Hero';
import { FeaturedProjects } from '../components/FeaturedProjects';
import { AboutSection } from '../components/AboutSection';
import { ToolsStack } from '../components/ToolsStack';

export function Home() {
  return (
    <main className="space-y-32">
      <Hero />
      <FeaturedProjects />
      <ToolsStack />
      <AboutSection />
    </main>
  );
}
