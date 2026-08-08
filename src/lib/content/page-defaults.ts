import { DEFAULT_HOME_CONTENT } from "./defaults/home";
import { DEFAULT_PROJECTS_CONTENT } from "./defaults/projects";
import { DEFAULT_SERVICES_CONTENT } from "./defaults/services";
import { DEFAULT_CONTACT_CONTENT } from "./defaults/contact";
import { DEFAULT_BLOG_CONTENT } from "./defaults/blog";
import { DEFAULT_HUB_CONTENT } from "./defaults/hub";
import { DEFAULT_PLAYGROUND_CONTENT } from "./defaults/playground";
import { DEFAULT_SHARED_CONTENT } from "./defaults/shared";
import { DEFAULT_TERMS_CONTENT } from "./defaults/terms";

/** Maps a page content key to its default content object. */
export const PAGE_DEFAULTS: Record<string, Record<string, unknown>> = {
  home: DEFAULT_HOME_CONTENT as unknown as Record<string, unknown>,
  projects: DEFAULT_PROJECTS_CONTENT as unknown as Record<string, unknown>,
  services: DEFAULT_SERVICES_CONTENT as unknown as Record<string, unknown>,
  contact: DEFAULT_CONTACT_CONTENT as unknown as Record<string, unknown>,
  blog: DEFAULT_BLOG_CONTENT as unknown as Record<string, unknown>,
  hub: DEFAULT_HUB_CONTENT as unknown as Record<string, unknown>,
  playground: DEFAULT_PLAYGROUND_CONTENT as unknown as Record<string, unknown>,
  shared: DEFAULT_SHARED_CONTENT as unknown as Record<string, unknown>,
  terms: DEFAULT_TERMS_CONTENT as unknown as Record<string, unknown>,
};
