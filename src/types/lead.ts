export const LEAD_STATUSES = ["new", "contacted", "closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  closed: number;
}
