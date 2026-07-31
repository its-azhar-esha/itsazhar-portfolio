import { getTestimonials } from "@/lib/testimonials";
import { TestimonialList } from "@/components/admin/testimonials/testimonial-list";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const result = await getTestimonials();
  const testimonials = result.success ? result.data : [];
  const error = result.success ? null : result.error;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Testimonials</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage testimonials shown in the animated carousel on the homepage.
        </p>
      </div>
      <TestimonialList testimonials={testimonials} error={error} />
    </div>
  );
}
