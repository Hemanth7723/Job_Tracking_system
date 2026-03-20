import type { JobStatus } from '../types'
import styles from './StatusBadge.module.css'

interface Props {
  status: JobStatus
}

const STATUS_CLASS: Record<JobStatus, string> = {
  Applied:   'applied',
  Interview: 'interview',
  Offer:     'offer',
  Rejected:  'rejected',
  Withdrawn: 'withdrawn',
  Ghosted:   'ghosted',
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`${styles.badge} ${styles[STATUS_CLASS[status]]}`}>
      {status}
    </span>
  )
}
