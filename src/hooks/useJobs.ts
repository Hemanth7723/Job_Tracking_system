import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
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
      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })

      if (options?.status) {
        query = query.eq('status', options.status)
      }
      if (options?.location) {
        query = query.ilike('location', `%${options.location}%`)
      }
      if (options?.search) {
        query = query.or(`company_name.ilike.%${options.search}%,role_name.ilike.%${options.search}%`)
      }

      const page = options?.page || 1
      const perPage = options?.perPage || 50
      const from = (page - 1) * perPage
      const to = from + perPage - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      setJobs(data as Job[])
      return { items: data as Job[], total: count || 0 }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load jobs'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadResume = async (file: File) => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) throw new Error('Not authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file)

    if (uploadError) throw uploadError
    return filePath
  }

  const createJob = async (data: JobFormData) => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) throw new Error('Not authenticated')

    let resumePath = undefined
    if (data.resume_file) {
      resumePath = await uploadResume(data.resume_file)
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        company_name: data.company_name,
        role_name: data.role_name,
        job_link: data.job_link,
        status: data.status,
        location: data.location,
        ctc: data.ctc,
        rating: data.rating ? parseInt(data.rating) : null,
        notes: data.notes,
        resume_file: resumePath,
      })
      .select()
      .single()

    if (error) throw error
    return job
  }

  const updateJob = async (id: string, data: JobFormData) => {
    let resumePath = undefined
    if (data.resume_file) {
      resumePath = await uploadResume(data.resume_file)
    }

    const updateData: any = {
      company_name: data.company_name,
      role_name: data.role_name,
      job_link: data.job_link,
      status: data.status,
      location: data.location,
      ctc: data.ctc,
      rating: data.rating ? parseInt(data.rating) : null,
      notes: data.notes,
    }

    if (resumePath) {
      updateData.resume_file = resumePath
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return job
  }

  const deleteJob = async (id: string) => {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  const getResumeUrl = (job: Job): string | null => {
    if (!job.resume_file) return null
    const { data } = supabase.storage
      .from('resumes')
      .getPublicUrl(job.resume_file)
    return data.publicUrl
  }

  const getStats = useCallback(async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')

    if (error) throw error

    const all = data as Job[]
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
