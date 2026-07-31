import { notFound } from "next/navigation";
import { getTestimonialById } from "@/lib/testimonials";
import { TestimonialForm } from "@/components/admin/testimonials/testimonial-form";

export const dynamic = "force-dynamic";

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getTestimonialById(id);
  if (!result.success) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Edit Testimonial</h2>
        <p className="text-muted-foreground mt-1 text-sm">Update testimonial details.</p>
      </div>
      <TestimonialForm testimonial={result.data} />
    </div>
  );
}
