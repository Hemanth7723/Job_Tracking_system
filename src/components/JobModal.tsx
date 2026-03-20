import { useState, useEffect, useRef, FormEvent } from 'react'
import type { Job, JobFormData, JobStatus } from '../types'
import { JOB_STATUSES } from '../types'
import styles from './JobModal.module.css'

interface Props {
  job?: Job | null
  onSave: (data: JobFormData) => Promise<void>
  onClose: () => void
}

const EMPTY: JobFormData = {
  company_name: '',
  role_name: '',
  job_link: '',
  status: 'Applied',
  location: '',
  ctc: '',
  rating: '',
  notes: '',
  resume_file: null,
}

export default function JobModal({ job, onSave, onClose }: Props) {
  const [form, setForm] = useState<JobFormData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (job) {
      setForm({
        company_name: job.company_name,
        role_name: job.role_name,
        job_link: job.job_link || '',
        status: job.status,
        location: job.location || '',
        ctc: job.ctc || '',
        rating: job.rating ? String(job.rating) : '',
        notes: job.notes || '',
        resume_file: null,
      })
    } else {
      setForm(EMPTY)
    }
  }, [job])

  const set = (field: keyof JobFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.company_name.trim() || !form.role_name.trim()) {
      setError('Company name and role are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h2 className={styles.title}>{job ? 'Edit application' : 'Add job application'}</h2>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Company name *</label>
              <input type="text" placeholder="Google" value={form.company_name} onChange={set('company_name')} required />
            </div>
            <div className={styles.field}>
              <label>Role name *</label>
              <input type="text" placeholder="Software Engineer" value={form.role_name} onChange={set('role_name')} required />
            </div>
            <div className={`${styles.field} ${styles.fullCol}`}>
              <label>Job link</label>
              <input type="url" placeholder="https://careers.company.com/job/..." value={form.job_link} onChange={set('job_link')} />
            </div>
            <div className={styles.field}>
              <label>Location</label>
              <input type="text" placeholder="Bangalore / Remote" value={form.location} onChange={set('location')} />
            </div>
            <div className={styles.field}>
              <label>Status *</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as JobStatus }))}>
                {JOB_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>CTC (LPA)</label>
              <input type="text" placeholder="e.g. 18 or 15-20" value={form.ctc} onChange={set('ctc')} />
            </div>
            <div className={styles.field}>
              <label>Company rating</label>
              <select value={form.rating} onChange={set('rating')}>
                <option value="">Not rated</option>
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{'★'.repeat(r)} ({r}/5)</option>)}
              </select>
            </div>
            <div className={`${styles.field} ${styles.fullCol}`}>
              <label>Resume (PDF)</label>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => setForm((f) => ({ ...f, resume_file: e.target.files?.[0] || null }))}
              />
              {job?.resume_file && !form.resume_file && (
                <span className={styles.currentFile}>Current: {job.resume_file}</span>
              )}
            </div>
            <div className={`${styles.field} ${styles.fullCol}`}>
              <label>Notes</label>
              <textarea
                rows={3}
                placeholder="Any notes about this application..."
                value={form.notes}
                onChange={set('notes')}
              />
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving...' : 'Save application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
