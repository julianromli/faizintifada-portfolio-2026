import type { Testimonial } from '../types/testimonial';

/** Seed data (no id) — matches former hardcoded Hero testimonials. */
export const seedTestimonials: Omit<Testimonial, 'id'>[] = [
  {
    quote:
      'Faiz is an exceptional designer with a keen eye for detail and user experience. His work is creative, functional, and always top-notch. Highly recommended!',
    name: 'Alya',
    role: 'Co Founder of Sprrint',
    avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=5',
    sortOrder: 0,
  },
  {
    quote:
      'Working with Faiz was a game-changer for our app. He perfectly captured our brand identity and delivered something beyond our wildest expectations.',
    name: 'Marcus Chen',
    role: 'CEO of Nova Tech',
    avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=8',
    sortOrder: 1,
  },
  {
    quote:
      'Brilliant execution and communication. The final UI was pixel-perfect and dev-ready. Will definitely collaborate again on future projects.',
    name: 'Elena Rodriguez',
    role: 'Engineering Manager',
    avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=12',
    sortOrder: 2,
  },
  {
    quote:
      "A true artist wrapped in a developer's mindset. Faiz gets both the aesthetic nuance and the technical implementation right every single time.",
    name: 'James Doe',
    role: 'Lead Product Designer',
    avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=4',
    sortOrder: 3,
  },
];
