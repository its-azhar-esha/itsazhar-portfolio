import type { LucideIcon } from "lucide-react";
import {
  Home,
  FolderKanban,
  Briefcase,
  Mail,
  Newspaper,
  Boxes,
  Workflow,
  Share2,
  Scale,
} from "lucide-react";

export type FieldType = "text" | "textarea" | "tags" | "links" | "media" | "sections";

export interface FieldDef {
  /** Dot-path of the field relative to its group object, e.g. "audit.title". */
  key: string;
  label: string;
  hint?: string;
  type?: FieldType;
  placeholder?: string;
}

export interface GroupDef {
  title: string;
  description?: string;
  fields: FieldDef[];
}

export interface PageContentDefinition {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  groups: GroupDef[];
}

export const PAGE_CONTENT_DEFINITIONS: PageContentDefinition[] = [
  {
    key: "home",
    title: "Home Page",
    description: "Showcase, services, case studies, testimonials, about, contact and CTA sections.",
    icon: Home,
    href: "/admin/content/home",
    groups: [
      {
        title: "Showcase Section",
        description: "The featured projects carousel on the homepage.",
        fields: [
          { key: "showcase.title", label: "Title", type: "text" },
          { key: "showcase.intro", label: "Intro", type: "textarea" },
          { key: "showcase.watchDemo", label: "Watch Demo button", type: "text" },
          { key: "showcase.viewCaseStudy", label: "View Case Study button", type: "text" },
          { key: "showcase.viewAll", label: "View All button", type: "text" },
        ],
      },
      {
        title: "Services Section",
        description: "The services preview grid on the homepage.",
        fields: [
          { key: "features.title", label: "Title", type: "text" },
          { key: "features.intro", label: "Intro", type: "textarea" },
        ],
      },
      {
        title: "Case Studies Section",
        description: "The case studies tabs on the homepage.",
        fields: [
          { key: "caseStudies.title", label: "Title", type: "text" },
          { key: "caseStudies.intro", label: "Intro", type: "textarea" },
          { key: "caseStudies.challenge", label: "The Challenge label", type: "text" },
          { key: "caseStudies.solution", label: "The Solution label", type: "text" },
          { key: "caseStudies.workflow", label: "Workflow label", type: "text" },
          { key: "caseStudies.impact", label: "Impact label", type: "text" },
          { key: "caseStudies.readMore", label: "Read Full Case Study button", type: "text" },
        ],
      },
      {
        title: "Testimonials Section",
        description: "The client testimonials section on the homepage.",
        fields: [
          { key: "testimonials.title", label: "Title", type: "text" },
          { key: "testimonials.intro", label: "Intro", type: "textarea" },
        ],
      },
      {
        title: "About Section",
        description: "The short about teaser on the homepage.",
        fields: [
          {
            key: "about.photo",
            label: "Photo",
            type: "media",
            hint: "Your profile photo shown in the about card. Pick from the media library or upload a new image.",
          },
          { key: "about.name", label: "Name", type: "text" },
          { key: "about.heading", label: "Heading", type: "text" },
          { key: "about.role", label: "Role", type: "text" },
          { key: "about.intro", label: "Intro", type: "textarea" },
          { key: "about.moreLabel", label: "More About Me button", type: "text" },
          {
            key: "about.roles",
            label: "Rotating roles",
            type: "tags",
            hint: "One role per tag — they rotate automatically.",
          },
        ],
      },
      {
        title: "Contact Section",
        description: "The contact teaser on the homepage.",
        fields: [
          { key: "contact.title", label: "Title", type: "text" },
          { key: "contact.intro", label: "Intro", type: "textarea" },
          { key: "contact.priceBadge", label: "Price badge", type: "text" },
          { key: "contact.auditTitle", label: "Audit card title", type: "text" },
          { key: "contact.auditDescription", label: "Audit card description", type: "textarea" },
          { key: "contact.bookLabel", label: "Book audit button", type: "text" },
          { key: "contact.viewProjectsLabel", label: "View Projects button", type: "text" },
          { key: "contact.findMeOn", label: "Find me on title", type: "text" },
          { key: "contact.details", label: "Details title", type: "text" },
          { key: "contact.location", label: "Location", type: "text" },
          { key: "contact.responseTime", label: "Response time", type: "text" },
          {
            key: "contact.benefits",
            label: "Benefits",
            type: "tags",
            hint: "Benefits shown in the audit card.",
          },
        ],
      },
      {
        title: "CTA Section",
        description: "The closing call-to-action banner on the homepage.",
        fields: [
          { key: "cta.badge", label: "Badge", type: "text" },
          { key: "cta.title", label: "Title", type: "text" },
          { key: "cta.intro", label: "Intro", type: "textarea" },
          { key: "cta.primaryLabel", label: "Primary button", type: "text" },
          { key: "cta.secondaryLabel", label: "Secondary button", type: "text" },
        ],
      },
    ],
  },
  {
    key: "projects",
    title: "Projects Page",
    description: "Hero, status labels, empty states, cards and the project detail page.",
    icon: FolderKanban,
    href: "/admin/content/projects",
    groups: [
      {
        title: "Hero",
        description: "The header of the projects page.",
        fields: [
          { key: "hero.badge", label: "Badge", type: "text" },
          { key: "hero.title", label: "Title", type: "text" },
          { key: "hero.intro", label: "Intro", type: "textarea" },
          { key: "filters.all", label: "All filter label", type: "text" },
          { key: "searchPlaceholder", label: "Search placeholder", type: "text" },
        ],
      },
      {
        title: "Status Labels",
        description: "Labels used for project status badges.",
        fields: [
          { key: "statuses.production", label: "Production Ready", type: "text" },
          { key: "statuses.development", label: "In Development", type: "text" },
          { key: "statuses.prototype", label: "Prototype", type: "text" },
          { key: "statuses.completed", label: "Completed", type: "text" },
        ],
      },
      {
        title: "Industry Empty State",
        description:
          "Shown when a filtered industry has no projects yet. {industry} is replaced with the industry name.",
        fields: [
          { key: "industryEmpty.comingSoon", label: "Coming Soon badge", type: "text" },
          { key: "industryEmpty.description", label: "Description", type: "text" },
          { key: "industryEmpty.hint", label: "Hint", type: "text" },
          { key: "industryEmpty.discussText", label: "Discuss text", type: "text" },
          { key: "industryEmpty.discussLabel", label: "Let's Discuss button", type: "text" },
          { key: "industryEmpty.returnAll", label: "Return to All button", type: "text" },
        ],
      },
      {
        title: "Search Empty State",
        description: "Shown when a search returns no projects.",
        fields: [
          { key: "searchEmpty.title", label: "Title", type: "text" },
          { key: "searchEmpty.description", label: "Description", type: "text" },
          { key: "searchEmpty.clearAll", label: "Clear all filters button", type: "text" },
        ],
      },
      {
        title: "Card Labels",
        description: "Labels on project cards.",
        fields: [
          { key: "cards.demo", label: "Demo button", type: "text" },
          { key: "cards.details", label: "View Details button", type: "text" },
        ],
      },
      {
        title: "Detail Page",
        description: "Labels on the project detail page.",
        fields: [
          { key: "detail.back", label: "Back link", type: "text" },
          { key: "detail.gallery", label: "Gallery heading", type: "text" },
          { key: "detail.challenge", label: "The Challenge heading", type: "text" },
          { key: "detail.solution", label: "The Solution heading", type: "text" },
          { key: "detail.workflow", label: "Workflow heading", type: "text" },
          { key: "detail.stack", label: "Technology Stack heading", type: "text" },
          { key: "detail.impact", label: "Impact & Outcome heading", type: "text" },
          { key: "detail.watchDemo", label: "Watch Full Demo button", type: "text" },
          { key: "detail.viewFullDetails", label: "View Full Details button", type: "text" },
          { key: "detail.related", label: "Related Projects heading", type: "text" },
          { key: "detail.previous", label: "Previous project", type: "text" },
          { key: "detail.next", label: "Next project", type: "text" },
          { key: "detail.ctaTitle", label: "CTA title", type: "text" },
          { key: "detail.ctaDescription", label: "CTA description", type: "textarea" },
          { key: "detail.ctaButton", label: "CTA button", type: "text" },
        ],
      },
    ],
  },
  {
    key: "services",
    title: "Services Page",
    description: "Hero copy, card labels, empty state and the service detail page.",
    icon: Briefcase,
    href: "/admin/content/services",
    groups: [
      {
        title: "Hero",
        description: "The header of the services page.",
        fields: [
          { key: "hero.badge", label: "Badge", type: "text" },
          { key: "hero.title", label: "Title", type: "text" },
          { key: "hero.intro", label: "Intro", type: "textarea" },
        ],
      },
      {
        title: "Cards & Empty State",
        fields: [
          { key: "learnMore", label: "Learn more link", type: "text" },
          { key: "emptyMessage", label: "Empty state message", type: "textarea" },
        ],
      },
      {
        title: "Detail Page",
        description: "Labels on the service detail page.",
        fields: [
          { key: "detail.back", label: "Back link", type: "text" },
          { key: "detail.included", label: "What's included heading", type: "text" },
          { key: "detail.badge", label: "Consultation badge", type: "text" },
          { key: "detail.ctaTitle", label: "CTA title", type: "text" },
          { key: "detail.ctaDescription", label: "CTA description", type: "textarea" },
          { key: "detail.ctaButton", label: "CTA button", type: "text" },
        ],
      },
    ],
  },
  {
    key: "contact",
    title: "Contact Page",
    description: "Hero copy, audit benefits, details card and the lead form labels.",
    icon: Mail,
    href: "/admin/content/contact",
    groups: [
      {
        title: "Hero",
        fields: [
          { key: "hero.badge", label: "Badge", type: "text" },
          { key: "hero.title", label: "Title", type: "text" },
          { key: "hero.intro", label: "Intro", type: "textarea" },
        ],
      },
      {
        title: "Audit Card",
        fields: [
          { key: "audit.price", label: "Price badge", type: "text" },
          { key: "audit.title", label: "Title", type: "text" },
          { key: "audit.description", label: "Description", type: "textarea" },
          { key: "benefits", label: "Benefits", type: "tags" },
          { key: "bookLabel", label: "Book audit button", type: "text" },
        ],
      },
      {
        title: "Details Card",
        fields: [
          { key: "details.findMeOn", label: "Find me on title", type: "text" },
          { key: "details.details", label: "Details title", type: "text" },
          { key: "details.location", label: "Location", type: "text" },
          { key: "details.responseTime", label: "Response time", type: "text" },
        ],
      },
      {
        title: "Lead Form Labels",
        description: "Labels and placeholders for the contact form.",
        fields: [
          { key: "form.nameLabel", label: "Name label", type: "text" },
          { key: "form.namePlaceholder", label: "Name placeholder", type: "text" },
          { key: "form.emailLabel", label: "Email label", type: "text" },
          { key: "form.emailPlaceholder", label: "Email placeholder", type: "text" },
          { key: "form.phoneLabel", label: "Phone label", type: "text" },
          { key: "form.phonePlaceholder", label: "Phone placeholder", type: "text" },
          { key: "form.messageLabel", label: "Message label", type: "text" },
          { key: "form.messagePlaceholder", label: "Message placeholder", type: "text" },
          { key: "form.submitLabel", label: "Submit button", type: "text" },
          { key: "form.sendingLabel", label: "Sending label", type: "text" },
        ],
      },
      {
        title: "Form Success",
        fields: [
          { key: "formSuccess.title", label: "Success title", type: "text" },
          { key: "formSuccess.description", label: "Success description", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "blog",
    title: "Blog Page",
    description: "Metadata, empty states, CTA and the blog post detail page labels.",
    icon: Newspaper,
    href: "/admin/content/blog",
    groups: [
      {
        title: "Page",
        description: "Blog index page copy (metadata is managed under SEO).",
        fields: [
          { key: "allLabel", label: "All categories label", type: "text" },
          { key: "moreArticles", label: "More articles heading", type: "text" },
        ],
      },
      {
        title: "Empty State",
        fields: [
          { key: "empty.title", label: "Title", type: "text" },
          { key: "empty.description", label: "Description", type: "textarea" },
        ],
      },
      {
        title: "CTA",
        fields: [
          { key: "cta.title", label: "Title", type: "text" },
          { key: "cta.button", label: "Button", type: "text" },
        ],
      },
      {
        title: "Post Detail Page",
        fields: [
          { key: "detail.back", label: "Back link", type: "text" },
          { key: "detail.minRead", label: "Min read suffix", type: "text" },
          { key: "detail.writtenBy", label: "Written by label", type: "text" },
          { key: "detail.authorBio", label: "Author bio", type: "textarea" },
          { key: "detail.getInTouch", label: "Get in touch label", type: "text" },
          { key: "detail.keepReading", label: "Keep reading heading", type: "text" },
          { key: "detail.moreSubtitle", label: "More articles subtitle", type: "text" },
          { key: "detail.ctaTitle", label: "CTA title", type: "text" },
          { key: "detail.ctaButton", label: "CTA button", type: "text" },
        ],
      },
    ],
  },
  {
    key: "hub",
    title: "Hub Page",
    description: "Hero, stats, filters, empty states, CTA and the resource detail page.",
    icon: Boxes,
    href: "/admin/content/hub",
    groups: [
      {
        title: "Hero",
        fields: [
          { key: "hero.badge", label: "Badge", type: "text" },
          { key: "hero.title", label: "Title", type: "text" },
          { key: "hero.intro", label: "Intro", type: "textarea" },
        ],
      },
      {
        title: "Stats Labels",
        description: "Labels next to the resource counters.",
        fields: [
          { key: "stats.resources", label: "Resources", type: "text" },
          { key: "stats.free", label: "Free", type: "text" },
          { key: "stats.paid", label: "Paid", type: "text" },
          { key: "stats.downloads", label: "Downloads", type: "text" },
        ],
      },
      {
        title: "Filters & Search",
        fields: [
          { key: "filters.allCategories", label: "All categories", type: "text" },
          { key: "filters.collections", label: "Collections heading", type: "text" },
          { key: "filters.searchPlaceholder", label: "Search placeholder", type: "text" },
          { key: "filters.allTypes", label: "All types", type: "text" },
          { key: "filters.allPrices", label: "All prices", type: "text" },
          { key: "filters.free", label: "Free", type: "text" },
          { key: "filters.paid", label: "Paid", type: "text" },
          { key: "filters.featured", label: "Featured", type: "text" },
          { key: "filters.newest", label: "Newest", type: "text" },
          { key: "filters.mostDownloaded", label: "Most downloaded", type: "text" },
          { key: "filters.categoryPrefix", label: "Category prefix", type: "text" },
          { key: "filters.clear", label: "Clear filters", type: "text" },
          { key: "filters.search", label: "Search button", type: "text" },
        ],
      },
      {
        title: "Empty State & Results",
        fields: [
          { key: "empty.title", label: "Empty title", type: "text" },
          { key: "empty.filtered", label: "Filtered empty message", type: "text" },
          { key: "empty.comingSoon", label: "Coming soon message", type: "text" },
          {
            key: "resultsLine",
            label: "Results line",
            type: "text",
            hint: "Use {count} and {total} as placeholders.",
          },
        ],
      },
      {
        title: "CTA",
        fields: [
          { key: "ctaTitle", label: "Title", type: "text" },
          { key: "ctaButton", label: "Button", type: "text" },
        ],
      },
      {
        title: "Resource Detail Page",
        fields: [
          { key: "detail.back", label: "Back link", type: "text" },
          { key: "detail.featured", label: "Featured badge", type: "text" },
          { key: "detail.premium", label: "Premium badge", type: "text" },
          { key: "detail.versionHistory", label: "Version history", type: "text" },
          { key: "detail.price", label: "Price heading", type: "text" },
          { key: "detail.free", label: "Free label", type: "text" },
          { key: "detail.paid", label: "Paid label", type: "text" },
          { key: "detail.perMonth", label: "Per month suffix", type: "text" },
          { key: "detail.pricingFree", label: "Free pricing sub-copy", type: "text" },
          { key: "detail.pricingSubscription", label: "Subscription sub-copy", type: "text" },
          { key: "detail.pricingOneTime", label: "One-time sub-copy", type: "text" },
          { key: "detail.getAccess", label: "Get access button", type: "text" },
          { key: "detail.freeDownload", label: "Free download button", type: "text" },
          { key: "detail.files", label: "Files heading", type: "text" },
          { key: "detail.noFiles", label: "No files message", type: "text" },
          { key: "detail.unlock", label: "Unlock message", type: "text" },
          { key: "detail.details", label: "Details heading", type: "text" },
          { key: "detail.ctaTitle", label: "CTA title", type: "text" },
          { key: "detail.ctaButton", label: "CTA button", type: "text" },
        ],
      },
    ],
  },
  {
    key: "playground",
    title: "Playground Page",
    description: "Hero, filters, empty states, builder, template and share pages.",
    icon: Workflow,
    href: "/admin/content/playground",
    groups: [
      {
        title: "Hero",
        description: "The header of the playground page (metadata is managed under SEO).",
        fields: [
          { key: "hero.badge", label: "Badge", type: "text" },
          { key: "hero.title", label: "Title", type: "text" },
          { key: "hero.intro", label: "Intro", type: "textarea" },
          { key: "hero.openBuilder", label: "Open the builder button", type: "text" },
          { key: "hero.blankCanvas", label: "Blank canvas button", type: "text" },
        ],
      },
      {
        title: "Filters & Sections",
        fields: [
          { key: "filters.allCategories", label: "All categories", type: "text" },
          { key: "filters.searchPlaceholder", label: "Search placeholder", type: "text" },
          { key: "filters.search", label: "Search button", type: "text" },
          { key: "sections.featured", label: "Featured heading", type: "text" },
          { key: "sections.all", label: "All templates heading", type: "text" },
          { key: "difficulty.any", label: "Any difficulty", type: "text" },
          { key: "difficulty.beginner", label: "Beginner", type: "text" },
          { key: "difficulty.intermediate", label: "Intermediate", type: "text" },
          { key: "difficulty.advanced", label: "Advanced", type: "text" },
        ],
      },
      {
        title: "Empty State & CTA",
        fields: [
          { key: "empty.title", label: "Empty title", type: "text" },
          { key: "empty.filtered", label: "Filtered empty message", type: "text" },
          { key: "empty.comingSoon", label: "Coming soon message", type: "text" },
          { key: "ctaTitle", label: "CTA title", type: "textarea" },
          { key: "ctaButton", label: "CTA button", type: "text" },
        ],
      },
      {
        title: "Builder Page",
        fields: [
          { key: "builder.title", label: "Title", type: "text" },
          { key: "builder.subtitle", label: "Subtitle", type: "textarea" },
        ],
      },
      {
        title: "Template Detail Page",
        fields: [
          { key: "template.back", label: "Back link", type: "text" },
          { key: "template.views", label: "Views suffix", type: "text" },
          { key: "template.stats", label: "Nodes · connections", type: "text" },
          { key: "template.use", label: "Use this template button", type: "text" },
          { key: "template.blank", label: "Blank builder button", type: "text" },
          { key: "template.howItWorks", label: "How it works heading", type: "text" },
          { key: "template.whatsInside", label: "What's inside heading", type: "text" },
          { key: "template.empty", label: "Empty message", type: "text" },
          { key: "template.ctaTitle", label: "CTA title", type: "text" },
          { key: "template.ctaButton", label: "CTA button", type: "text" },
        ],
      },
      {
        title: "Share Page",
        fields: [
          { key: "share.back", label: "Back link", type: "text" },
          { key: "share.empty", label: "Empty message", type: "text" },
          { key: "share.openBuilder", label: "Open the builder button", type: "text" },
        ],
      },
    ],
  },
  {
    key: "shared",
    title: "Shared Site",
    description: "Brand, navigation, footer, mobile menu, lead form and maintenance copy.",
    icon: Share2,
    href: "/admin/content/shared",
    groups: [
      {
        title: "Brand",
        fields: [{ key: "brand.name", label: "Brand name", type: "text" }],
      },
      {
        title: "Navigation",
        description:
          "CTA button and the fallback nav links (used when nav order is unset in Settings).",
        fields: [
          { key: "nav.ctaLabel", label: "Navbar CTA button", type: "text" },
          {
            key: "nav.fallbackLinks",
            label: "Fallback nav links",
            type: "links",
            hint: "Label and href pairs, e.g. Home /  /.",
          },
        ],
      },
      {
        title: "Mobile Menu",
        fields: [
          { key: "mobile.more", label: "More tab", type: "text" },
          { key: "mobile.aiAssistant", label: "AI Assistant", type: "text" },
          { key: "mobile.theme", label: "Theme label", type: "text" },
          { key: "mobile.ctaLabel", label: "CTA button", type: "text" },
          { key: "mobile.contact", label: "Contact", type: "text" },
          { key: "mobile.caseStudies", label: "Case Studies", type: "text" },
          { key: "mobile.testimonials", label: "Testimonials", type: "text" },
          { key: "mobile.blog", label: "Blog", type: "text" },
          { key: "mobile.hub", label: "Hub", type: "text" },
          { key: "mobile.playground", label: "Playground", type: "text" },
        ],
      },
      {
        title: "Footer",
        fields: [
          { key: "footer.intro", label: "Intro paragraph", type: "textarea" },
          { key: "footer.quickLinksTitle", label: "Quick Links heading", type: "text" },
          { key: "footer.blogLabel", label: "Blog link label", type: "text" },
          { key: "footer.hubLabel", label: "Hub link label", type: "text" },
          { key: "footer.playgroundLabel", label: "Playground link label", type: "text" },
          { key: "footer.ctaTitle", label: "CTA heading", type: "text" },
          { key: "footer.ctaDescription", label: "CTA description", type: "textarea" },
          { key: "footer.primaryButton", label: "Primary button", type: "text" },
          { key: "footer.secondaryButton", label: "Secondary button", type: "text" },
        ],
      },
      {
        title: "Lead Form",
        description: "Labels on the contact form (shared with the contact page).",
        fields: [
          { key: "leadForm.nameLabel", label: "Name label", type: "text" },
          { key: "leadForm.namePlaceholder", label: "Name placeholder", type: "text" },
          { key: "leadForm.emailLabel", label: "Email label", type: "text" },
          { key: "leadForm.emailPlaceholder", label: "Email placeholder", type: "text" },
          { key: "leadForm.phoneLabel", label: "Phone label", type: "text" },
          { key: "leadForm.phonePlaceholder", label: "Phone placeholder", type: "text" },
          { key: "leadForm.messageLabel", label: "Message label", type: "text" },
          { key: "leadForm.messagePlaceholder", label: "Message placeholder", type: "text" },
          { key: "leadForm.submitLabel", label: "Submit button", type: "text" },
          { key: "leadForm.sendingLabel", label: "Sending label", type: "text" },
        ],
      },
      {
        title: "Lead Form Success",
        fields: [
          { key: "leadForm.successTitle", label: "Success title", type: "text" },
          { key: "leadForm.successDescription", label: "Success description", type: "textarea" },
        ],
      },
      {
        title: "Maintenance Mode",
        description: "Shown when maintenance mode is enabled in Settings.",
        fields: [
          { key: "maintenance.title", label: "Title", type: "text" },
          { key: "maintenance.description", label: "Description", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "terms",
    title: "Terms & Conditions",
    description: "The public Terms & Conditions page. Edits publish instantly.",
    icon: Scale,
    href: "/admin/content/terms",
    groups: [
      {
        title: "Page",
        description: "Header and overview of the terms page.",
        fields: [
          { key: "title", label: "Page title", type: "text" },
          { key: "intro", label: "Intro", type: "textarea" },
          { key: "lastUpdated", label: "Last updated label", type: "text" },
        ],
      },
      {
        title: "Sections",
        description: "Numbered sections of the terms. Each has a title and body.",
        fields: [
          {
            key: "sections",
            label: "Sections",
            type: "sections",
            hint: "Add, edit, reorder-free list: each entry is a heading + paragraph.",
          },
        ],
      },
      {
        title: "Contact Block",
        description: "The closing contact note at the bottom of the page.",
        fields: [
          { key: "contactTitle", label: "Heading", type: "text" },
          { key: "contactBody", label: "Body", type: "textarea" },
        ],
      },
    ],
  },
];

export function getPageContentDefinition(key: string): PageContentDefinition | undefined {
  return PAGE_CONTENT_DEFINITIONS.find((def) => def.key === key);
}
