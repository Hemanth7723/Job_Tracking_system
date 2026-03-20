import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import type { Job, JobStatus } from '../types'
import { JOB_STATUSES, STATUS_COLORS } from '../types'
import styles from './StatsChart.module.css'

ChartJS.register(ArcElement, Tooltip)

interface Props {
  jobs: Job[]
}

export default function StatsChart({ jobs }: Props) {
  const counts = useMemo(() => {
    const c: Record<JobStatus, number> = {
      Applied: 0, Interview: 0, Offer: 0, Rejected: 0, Withdrawn: 0, Ghosted: 0,
    }
    jobs.forEach((j) => { c[j.status]++ })
    return c
  }, [jobs])

  const activeStatuses = JOB_STATUSES.filter((s) => counts[s] > 0)

  const chartData = {
    labels: activeStatuses,
    datasets: [{
      data: activeStatuses.map((s) => counts[s]),
      backgroundColor: activeStatuses.map((s) => STATUS_COLORS[s]),
      borderWidth: 0,
      hoverOffset: 4,
    }],
  }

  if (jobs.length === 0) {
    return (
      <div className={styles.panel}>
        <p className={styles.panelTitle}>Status breakdown</p>
        <div className={styles.empty}>Add your first application to see stats</div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>Status breakdown</p>
      <div className={styles.donutWrap}>
        <Doughnut
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.label}: ${ctx.parsed}`,
                },
              },
            },
          }}
        />
      </div>
      <div className={styles.legend}>
        {activeStatuses.map((s) => (
          <div key={s} className={styles.legendItem}>
            <span className={styles.dot} style={{ background: STATUS_COLORS[s] }} />
            <span className={styles.legendLabel}>{s}</span>
            <span className={styles.legendVal}>{counts[s]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
