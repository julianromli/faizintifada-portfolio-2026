import { IMAGES } from '../constants';

export interface Project {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  tags: string[];
  bgClass: string;
  imagePosition?: string;
  client?: string;
  role?: string;
  timeline?: string;
  liveUrl?: string;
  images?: string[];
}

export const projects: Project[] = [
  {
    slug: 'fintrack-dashboard',
    title: 'FinTrack Dashboard',
    description: 'SaaS dashboard for personal finance management.',
    longDescription: 'FinTrack is a comprehensive SaaS dashboard designed to help individuals and small businesses manage their finances effectively. The platform provides real-time insights into spending habits, budget tracking, and investment portfolio performance. Our goal was to create an intuitive and visually appealing interface that simplifies complex financial data.',
    image: IMAGES.project1,
    tags: ['Web Design', 'UI/UX'],
    bgClass: 'bg-blue-50',
    imagePosition: 'object-top',
    client: 'FinTrack Inc.',
    role: 'Lead Product Designer',
    timeline: '3 Months',
    liveUrl: 'https://fintrack.example.com',
    images: [
      IMAGES.project1,
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    slug: 'lumiere-studio',
    title: 'Lumière Studio',
    description: 'Creative portfolio website for a photography studio.',
    longDescription: 'Lumière Studio needed a digital presence that reflected their minimalist and elegant approach to photography. We designed and developed a bespoke portfolio website that puts their stunning imagery front and center. The site features smooth page transitions, a custom masonry gallery, and a seamless booking experience.',
    image: IMAGES.project2,
    tags: ['Web Design', 'Development'],
    bgClass: 'bg-[#f4f2ef]',
    imagePosition: 'object-center',
    client: 'Lumière Photography',
    role: 'Frontend Developer & Designer',
    timeline: '6 Weeks',
    liveUrl: 'https://lumiere.example.com',
    images: [
      IMAGES.project2,
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  {
    slug: 'taskly-mobile-app',
    title: 'Taskly Mobile App',
    description: 'Task management app to boost productivity and focus.',
    longDescription: 'Taskly is a mobile application designed to help users organize their daily tasks and improve productivity. We focused on creating a distraction-free user interface with intuitive gestures for task management. The app includes features like Pomodoro timers, habit tracking, and detailed productivity analytics.',
    image: IMAGES.project3,
    tags: ['UI/UX', 'Mobile Design'],
    bgClass: 'bg-purple-50',
    imagePosition: 'object-center',
    client: 'Taskly Startup',
    role: 'UI/UX Designer',
    timeline: '2 Months',
    liveUrl: 'https://taskly.example.com',
    images: [
      IMAGES.project3,
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop'
    ]
  }
];
