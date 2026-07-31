export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ensureUniqueSlug(slug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(slug)) return slug;
  let counter = 1;
  while (existingSlugs.includes(`${slug}-${counter}`)) {
    counter++;
  }
  return `${slug}-${counter}`;
}
