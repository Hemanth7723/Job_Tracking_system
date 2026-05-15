import { useState, useCallback } from 'react'
import { pb } from '../lib/pb'
import type { Job, JobFormData } from '../types'

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async (options?: {
    search?: string
    status?: string
    location?: string
    page?: number
    perPage?: number
  }) => {
    setLoading(true)
    setError(null)
    try {
      const filters: string[] = []

      // Schema rule: @request.auth.id = user  (direct field comparison, no .id suffix)
      // PocketBase enforces this server-side — we don't need to add a user filter here.
      // Additional client-side filters:
      if (options?.status) {
        filters.push(`status = "${options.status}"`)
      }
      if (options?.location) {
        // Escape quotes to prevent filter injection
        const loc = options.location.replace(/"/g, '\\"')
        filters.push(`location = "${loc}"`)
      }
      if (options?.search) {
        const q = options.search.replace(/"/g, '\\"')
        filters.push(`(company_name ~ "${q}" || role_name ~ "${q}")`)
      }

      const result = await pb.collection('jobs').getList<Job>(
        options?.page || 1,
        options?.perPage || 50,
        {
          filter: filters.length > 0 ? filters.join(' && ') : '',
          sort: '-created',
        }
      )

      setJobs(result.items)
      return result
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load jobs'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const createJob = async (data: JobFormData) => {
    const formData = new FormData()
    // user field: direct auth user ID — matches schema relation to "users" collection
    formData.append('user', pb.authStore.model!.id)
    formData.append('company_name', data.company_name)
    formData.append('role_name', data.role_name)
    formData.append('job_link', data.job_link)
    formData.append('status', data.status)
    formData.append('location', data.location)
    formData.append('ctc', data.ctc)
    if (data.rating) formData.append('rating', data.rating)
    formData.append('notes', data.notes)
    if (data.resume_file) formData.append('resume_file', data.resume_file)

    return pb.collection('jobs').create<Job>(formData)
  }

  const updateJob = async (id: string, data: JobFormData) => {
    const formData = new FormData()
    // Note: do NOT re-send 'user' on update — the rule @request.auth.id = user
    // already ensures only the owner can update. Re-sending it is harmless but unnecessary.
    formData.append('company_name', data.company_name)
    formData.append('role_name', data.role_name)
    formData.append('job_link', data.job_link)
    formData.append('status', data.status)
    formData.append('location', data.location)
    formData.append('ctc', data.ctc)
    // Send empty string to clear rating if unset; PocketBase treats '' as null for number fields
    formData.append('rating', data.rating || '')
    formData.append('notes', data.notes)
    if (data.resume_file) formData.append('resume_file', data.resume_file)

    return pb.collection('jobs').update<Job>(id, formData)
  }

  const deleteJob = async (id: string) => {
    return pb.collection('jobs').delete(id)
  }

  const getResumeUrl = (job: Job): string | null => {
    if (!job.resume_file) return null
    // pb.files.getUrl works with the record object directly.
    // collectionId is auto-populated by PocketBase SDK on every fetched record.
    return pb.files.getUrl(job, job.resume_file)
  }

  const getStats = useCallback(async () => {
    // getFullList fetches all records — server rules ensure only current user's records come back
    const all = await pb.collection('jobs').getFullList<Job>({
      sort: '-created',
    })
    const stats = {
      total: all.length,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    }
    all.forEach((j) => {
      if (j.status === 'Applied') stats.applied++
      else if (j.status === 'Interview') stats.interview++
      else if (j.status === 'Offer') stats.offer++
      else if (j.status === 'Rejected') stats.rejected++
    })
    return { stats, all }
  }, [])

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    createJob,
    updateJob,
    deleteJob,
    getResumeUrl,
    getStats,
  }
}
