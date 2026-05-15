import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useJobs } from '../hooks/useJobs'
import JobModal from '../components/JobModal'
import StatusBadge from '../components/StatusBadge'
import StatsChart from '../components/StatsChart'
import type { Job, JobFormData } from '../types'
import { JOB_STATUSES } from '../types'
import styles from './Dashboard.module.css'

const PER_PAGE = 10

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { jobs, loading, fetchJobs, createJob, updateJob, deleteJob, getResumeUrl } = useJobs()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: '', visible: false })

  const load = useCallback(() => {
    fetchJobs()
  }, [fetchJobs])

  useEffect(() => {
    load()
  }, [load])

  const showToast = (msg: string) => {
    setToast({ msg, visible: true })
    setTimeout(() => setToast({ msg: '', visible: false }), 2500)
  }

  // Client-side filter + search (jobs already user-scoped from API)
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return jobs.filter((j) => {
      const matchQ = !q || j.company_name.toLowerCase().includes(q) || j.role_name.toLowerCase().includes(q)
      const matchSt = !filterStatus || j.status === filterStatus
      const matchLoc = !filterLocation || j.location === filterLocation
      return matchQ && matchSt && matchLoc
    })
  }, [jobs, search, filterStatus, filterLocation])

  const locations = useMemo(() => [...new Set(jobs.map((j) => j.location).filter(Boolean))].sort() as string[], [jobs])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const stats = useMemo(() => ({
    total: jobs.length,
    applied:   jobs.filter((j) => j.status === 'Applied').length,
    interview: jobs.filter((j) => j.status === 'Interview').length,
    offer:     jobs.filter((j) => j.status === 'Offer').length,
    rejected:  jobs.filter((j) => j.status === 'Rejected').length,
  }), [jobs])

  const openAdd = () => { setEditingJob(null); setModalOpen(true) }
  const openEdit = (job: Job) => { setEditingJob(job); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditingJob(null) }

  const handleSave = async (data: JobFormData) => {
    if (editingJob) {
      await updateJob(editingJob.id, data)
      showToast('Application updated')
    } else {
      await createJob(data)
      showToast('Application added')
    }
    load()
  }

  const handleDelete = async (job: Job) => {
    if (!confirm(`Delete application for ${job.role_name} at ${job.company_name}?`)) return
    await deleteJob(job.id)
    showToast('Application deleted')
    load()
  }

  const initials = user?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?'
  const firstName = user?.name?.split(' ')[0] || 'User'

  return (
    <div className={styles.shell}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <div className={styles.brand}>📋 JobTrack</div>
        <div className={styles.topbarRight}>
          <div className={styles.userPill}>
            <div className={styles.avatar}>{initials}</div>
            <span>{firstName}</span>
          </div>
          <button className={styles.btnSm} onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className={styles.body}>
        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total</div>
            <div className={styles.statVal}>{stats.total}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Applied</div>
            <div className={`${styles.statVal} ${styles.applied}`}>{stats.applied}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Interview</div>
            <div className={`${styles.statVal} ${styles.interview}`}>{stats.interview}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Offers</div>
            <div className={`${styles.statVal} ${styles.offer}`}>{stats.offer}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Rejected</div>
            <div className={`${styles.statVal} ${styles.rejected}`}>{stats.rejected}</div>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search company or role..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <select className={styles.filterSel} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}>
            <option value="">All statuses</option>
            {JOB_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className={styles.filterSel} value={filterLocation} onChange={(e) => { setFilterLocation(e.target.value); setPage(1) }}>
            <option value="">All locations</option>
            {locations.map((l) => <option key={l}>{l}</option>)}
          </select>
          <button className={styles.btnAdd} onClick={openAdd}>+ Add job</button>
        </div>

        {/* Content row */}
        <div className={styles.contentRow}>
          <div>
            <div className={styles.tableWrap}>
              {loading && <div className={styles.loadingBar} />}
              <table className={styles.tbl}>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>CTC</th>
                    <th>Applied</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((job) => {
                    const resumeUrl = getResumeUrl(job)
                    return (
                      <tr key={job.id}>
                        <td>
                          <div className={styles.companyCell}>
                            {job.job_link
                              ? <a href={job.job_link} target="_blank" rel="noreferrer" className={styles.link}>{job.company_name}</a>
                              : job.company_name
                            }
                            {resumeUrl && (
                              <a href={resumeUrl} target="_blank" rel="noreferrer" className={styles.pdfBadge} title="View resume">PDF</a>
                            )}
                          </div>
                        </td>
                        <td className={styles.ellipsis}>{job.role_name}</td>
                        <td className={styles.ellipsis}>{job.location || '—'}</td>
                        <td><StatusBadge status={job.status} /></td>
                        <td>{job.ctc ? `${job.ctc} LPA` : '—'}</td>
                        <td>{new Date(job.created).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                        <td>
                          <div className={styles.actions}>
                            <button className={styles.actionBtn} onClick={() => openEdit(job)} title="Edit">✎</button>
                            <button className={styles.actionBtn} onClick={() => handleDelete(job)} title="Delete">✕</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {!loading && filtered.length === 0 && (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>📋</div>
                  <p>{search || filterStatus || filterLocation ? 'No results found. Try adjusting filters.' : 'No applications yet. Add your first job!'}</p>
                </div>
              )}

              {filtered.length > PER_PAGE && (
                <div className={styles.pagination}>
                  <span className={styles.pgInfo}>
                    {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                  </span>
                  <button className={styles.pgBtn} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                  <button className={styles.pgBtn} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                </div>
              )}
            </div>
          </div>

          <StatsChart jobs={jobs} />
        </div>
      </main>

      {modalOpen && (
        <JobModal job={editingJob} onSave={handleSave} onClose={closeModal} />
      )}

      <div className={`${styles.toast} ${toast.visible ? styles.toastVisible : ''}`}>
        {toast.msg}
      </div>
    </div>
  )
}
