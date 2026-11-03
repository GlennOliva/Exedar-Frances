import { useEffect, useState } from 'react'
import { downloadCalendar, wedding } from '../data/wedding'

const target = new Date(wedding.dateTime).getTime()
function remaining() {
  const delta = Math.max(0, target - Date.now())
  return { total: delta, days: Math.floor(delta / 86400000), hours: Math.floor(delta / 3600000) % 24, minutes: Math.floor(delta / 60000) % 60, seconds: Math.floor(delta / 1000) % 60 }
}

const datePanels = [
  { label: 'The day', value: 'January 23, 2027', mark: '23' },
  { label: 'The hour', value: '2:00 PM', mark: 'II' },
  { label: 'The place', value: 'Davao City', mark: 'DC' },
]

export function WeddingCountdown() {
  const [time, setTime] = useState(remaining)
  useEffect(() => {
    const timer = window.setInterval(() => setTime(remaining()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <section className="save-date panel-section panel-section--ivory" id="save-the-date" aria-labelledby="date-heading">
      <div className="section-inner save-inner">
        <h2 id="date-heading" className="save-heading" data-reveal="heading"><span>Save</span><i>the</i><span>Date</span></h2>
        <p className="date-line" data-reveal>Saturday <b>·</b> January 23, 2027</p>
        <div className="date-strip" aria-label="Wedding date, time, and place" data-reveal>
          {datePanels.map((panel) => <article key={panel.label}><span className="date-strip__mark" aria-hidden="true">{panel.mark}</span><div><p>{panel.label}</p><strong>{panel.value}</strong></div></article>)}
        </div>
        {time.total > 0 ? <div className="countdown" data-reveal aria-label={`${time.days} days, ${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds until the wedding`}>
          {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit) => <div key={unit}><strong>{String(time[unit]).padStart(2, '0')}</strong><span>{unit}</span></div>)}
        </div> : <p className="script today">Today and always.</p>}
        <button className="calendar-link" onClick={downloadCalendar}><span aria-hidden="true">+</span> Add Ceremony to Calendar</button>
      </div>
    </section>
  )
}
