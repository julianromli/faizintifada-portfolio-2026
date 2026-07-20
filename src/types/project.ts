export interface ProjectSummary {
  slug: string;
  title: string;
  image: string;
  tags: string[];
  bgClass: string;
  imagePosition?: string;
  featured?: boolean;
  sortOrder?: number;
}

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
  /** Included in API JSON for CMS / ordering */
  featured?: boolean;
  /** Included in API JSON for CMS / ordering */
  sortOrder?: number;
}
