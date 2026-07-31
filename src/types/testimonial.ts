export const TESTIMONIAL_STATUSES = ["draft", "published"] as const;

export type TestimonialStatus = (typeof TESTIMONIAL_STATUSES)[number];

export interface DbTestimonial {
  id: string;
  name: string;
  role: string;
  company: string | null;
  quote: string;
  rating: number;
  avatar: string | null;
  display_order: number;
  status: TestimonialStatus;
  created_at: string;
  updated_at: string;
}

export type CreateTestimonialInput = Omit<DbTestimonial, "id" | "created_at" | "updated_at">;
export type UpdateTestimonialInput = Partial<
  Omit<DbTestimonial, "id" | "created_at" | "updated_at">
>;

export interface PublicTestimonial {
  name: string;
  role: string;
  company: string | null;
  quote: string;
  rating: number;
  avatar: string | null;
}
