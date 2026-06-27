export interface CoachingTestimonial {
  id: number;
  name: string;
  role: string;
  rating: number;
  experience: string;
  outcome?: string;
  agreedToPublish: boolean;
  createdAt: number;
}

/** Public form payload (no id/createdAt; honeypot is sent separately and never stored). */
export interface CoachingTestimonialInput {
  name: string;
  role: string;
  rating: number;
  experience: string;
  outcome?: string;
  agreedToPublish: boolean;
}
