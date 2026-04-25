import { Hero } from '../components/Hero';
import { FeaturedProjects } from '../components/FeaturedProjects';
import { AboutSection } from '../components/AboutSection';

export function Home() {
  return (
    <main className="space-y-32">
      <Hero />
      <FeaturedProjects />
      <AboutSection />
    </main>
  );
}
