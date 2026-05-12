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
