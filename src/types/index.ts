export type JobStatus =
  | 'Applied'
  | 'Interview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn'
  | 'Ghosted'

export interface Job {
  id: string
  collectionId: string     // always present on PocketBase records — used by pb.files.getUrl()
  collectionName: string
  user: string             // direct user ID — schema rule: @request.auth.id = user
  company_name: string
  role_name: string
  job_link?: string
  resume_file?: string     // filename stored by PocketBase files API
  status: JobStatus
  location?: string
  ctc?: string
  rating?: number
  notes?: string
  created: string
  updated: string
}

export interface JobFormData {
  company_name: string
  role_name: string
  job_link: string
  status: JobStatus
  location: string
  ctc: string
  rating: string
  notes: string
  resume_file?: File | null
}

export interface AuthUser {
  id: string
  email: string
  name: string
}

export interface StatsData {
  total: number
  applied: number
  interview: number
  offer: number
  rejected: number
}

export const JOB_STATUSES: JobStatus[] = [
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
  'Ghosted',
]

export const STATUS_COLORS: Record<JobStatus, string> = {
  Applied:   '#378ADD',
  Interview: '#BA7517',
  Offer:     '#3B6D11',
  Rejected:  '#A32D2D',
  Withdrawn: '#888780',
  Ghosted:   '#B4B2A9',
}
