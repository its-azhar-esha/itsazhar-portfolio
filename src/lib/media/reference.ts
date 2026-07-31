export const MEDIA_REF_PREFIX = "media:";

const MEDIA_REF_PATTERN = /^media:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isMediaReference(value: unknown): value is string {
  return typeof value === "string" && MEDIA_REF_PATTERN.test(value);
}

export function mediaReferenceId(value: string): string | null {
  return isMediaReference(value) ? value.slice(MEDIA_REF_PREFIX.length) : null;
}

export function toMediaReference(id: string): string {
  return `${MEDIA_REF_PREFIX}${id}`;
}
