export interface SocialLink {
  name: string;
  username: string;
  url: string;
  icon?: string;
  placeholder?: boolean;
  order: number;
}

export const socialLinks: SocialLink[] = [
  {
    name: "LinkedIn",
    username: "linkedin.com/in/azharmahmudalif",
    url: "https://linkedin.com/in/azharmahmudalif",
    order: 1,
  },
  {
    name: "GitHub",
    username: "github.com/azharmahmudalif",
    url: "https://github.com/azharmahmudalif",
    order: 2,
  },
  {
    name: "Fiverr",
    username: "fiverr.com/azhar_m_alif",
    url: "https://fiverr.com/azhar_m_alif",
    order: 3,
  },
  {
    name: "Upwork",
    username: "upwork.com/freelancers/azhar",
    url: "https://upwork.com/freelancers/azhar",
    order: 4,
  },
  {
    name: "X / Twitter",
    username: "@azhar_m_alif",
    url: "https://x.com/azhar_m_alif",
    order: 5,
  },
  {
    name: "YouTube",
    username: "@azhar_m_alif",
    url: "https://youtube.com/@azhar_m_alif",
    placeholder: true,
    order: 6,
  },
  {
    name: "Instagram",
    username: "@azhar_m_alif",
    url: "https://instagram.com/azhar_m_alif",
    placeholder: true,
    order: 7,
  },
  {
    name: "Email",
    username: "azhar@example.com",
    url: "mailto:azhar@example.com",
    order: 8,
  },
];
