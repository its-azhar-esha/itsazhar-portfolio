import { TestimonialForm } from "@/components/admin/testimonials/testimonial-form";

export const dynamic = "force-dynamic";

export default function NewTestimonialPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">New Testimonial</h2>
        <p className="text-muted-foreground mt-1 text-sm">Add a testimonial to the carousel.</p>
      </div>
      <TestimonialForm />
    </div>
  );
}
