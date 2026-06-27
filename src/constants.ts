export const CONTACT_EMAIL = 'faizintifada@gmail.com';
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

export const CONTACT_CHANNELS = [
  { id: 'email', href: CONTACT_MAILTO, label: 'Email Faiz', external: false },
  { id: 'whatsapp', href: 'https://wa.me/628989004363', label: 'WhatsApp', external: true },
  {
    id: 'instagram',
    href: 'https://instagram.com/faizintifada',
    label: 'Instagram DM',
    external: true,
  },
] as const;

export const SOCIAL_LINKS = [
  {
    href: 'https://x.com/faizintifada_',
    label: 'X (Twitter)',
    icon: 'x' as const,
  },
  {
    href: 'https://instagram.com/faizintifada',
    label: 'Instagram',
    icon: 'instagram' as const,
  },
  {
    href: 'https://threads.com/faizintifada',
    label: 'Threads',
    icon: 'threads' as const,
  },
  {
    href: 'https://linkedin.com/in/faizintifada',
    label: 'LinkedIn',
    icon: 'linkedin' as const,
  },
  {
    href: 'https://youtube.com/@faizintifada',
    label: 'YouTube',
    icon: 'youtube' as const,
  },
] as const;

export const NAV_LINKS = [
  { to: '/#about', label: 'About' },
  { to: '/projects', label: 'Projects' },
  { to: '/ui', label: 'UI Kit' },
] as const;

// faiz-ui Starter Kit sales page (/ui). Checkout is handled server-side via
// POST /api/checkout (Mayar); see CheckoutDialog.
export const UI_KIT = {
  name: 'Faiz UI',
  tagline: 'The AI-agent starter kit you ship with, not from.',
  demoUrl: 'https://ui.faizintifada.com',
  price: { amount: 99000, original: 199000, currency: 'IDR' },
} as const;

export const IMAGES = {
  avatar: "https://mh00j7jocs.ufs.sh/f/Qnr0iOx9K6xJ2IcJW7L0gRb7VfrqtvwOY85P9oAypHuTnWCa",
  abstractTop: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop", // abstract liquid
  abstractMiddle: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=600&auto=format&fit=crop", // 3d shapes
  abstractBottom: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop", // white waves
  project1: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop", // dashboard
  project2: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop", // web/clean
  project3: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop", // mobile
};
