

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import cartoonMechanic from '@assets/cartoonmechanic.png'

const STATUS_COPY = 'This site is under coonstruction, await something hooge.'

type Spark = {
  id: number
  x: string
  y: string
  delay: string
  duration: string
}

const createSparks = (): Spark[] =>
  Array.from({ length: 24 }, (_, index) => ({
    id: index,
    x: `${Math.random() * 100}%`,
    y: `${Math.random() * 100}%`,
    delay: `${(Math.random() * 4).toFixed(2)}s`,
    duration: `${(3.2 + Math.random() * 4.1).toFixed(2)}s`,
  }))

const Construction = () => {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [typedCopy, setTypedCopy] = useState('')
  const [launchReadiness, setLaunchReadiness] = useState(0)
  const sparks = useMemo(() => createSparks(), [])

  useEffect(() => {
    let cursor = 0

    const reveal = window.setInterval(() => {
      cursor += 1
      setTypedCopy(STATUS_COPY.slice(0, cursor))

      if (cursor >= STATUS_COPY.length) {
        window.clearInterval(reveal)
      }
    }, 44)

    return () => window.clearInterval(reveal)
  }, [])

  useEffect(() => {
    const DURATION_MS = 2900
    let frameId = 0
    let startTime: number | null = null

    const animate = (now: number) => {
      if (startTime === null) {
        startTime = now
      }

      const elapsed = now - startTime
      const progress = Math.min(elapsed / DURATION_MS, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setLaunchReadiness(Math.round(eased * 90))

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate)
      }
    }

    frameId = window.requestAnimationFrame(animate)

    return () => window.cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) {
      return
    }

    let frameId = 0

    const updateTilt = (xAxis: number, yAxis: number) => {
      stage.style.setProperty('--mouse-x', xAxis.toFixed(3))
      stage.style.setProperty('--mouse-y', yAxis.toFixed(3))
    }

    const onMouseMove = (event: MouseEvent) => {
      const rect = stage.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      const xAxis = (x - 0.5) * 2
      const yAxis = (y - 0.5) * 2

      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }

      frameId = window.requestAnimationFrame(() => updateTilt(xAxis, yAxis))
    }

    const onMouseLeave = () => updateTilt(0, 0)

    stage.addEventListener('mousemove', onMouseMove)
    stage.addEventListener('mouseleave', onMouseLeave)

    return () => {
      stage.removeEventListener('mousemove', onMouseMove)
      stage.removeEventListener('mouseleave', onMouseLeave)
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [])

  return (
    <main className='construction-page' ref={stageRef}>
      <div className='construction-backdrop' aria-hidden='true'>
        <div className='construction-orb construction-orb-one' />
        <div className='construction-orb construction-orb-two' />
        <div className='construction-grid' />
        <div className='construction-sparks'>
          {sparks.map((spark) => (
            <span
              key={spark.id}
              className='construction-spark'
              style={
                {
                  '--spark-x': spark.x,
                  '--spark-y': spark.y,
                  '--spark-delay': spark.delay,
                  '--spark-duration': spark.duration,
                } as CSSProperties
              }
            />
          ))}
        </div>
      </div>

      <section className='construction-shell'>
        <div className='construction-content'>
          <span className='construction-tag'>EVENTVNV // BUILD MODE</span>
          <h1 className='construction-title'>
            EVENTVNV
            <br />
            Is Coming!!
          </h1>
          <p className='construction-copy'>
            {typedCopy}
            <span className='construction-caret' aria-hidden='true'>
              |
            </span>
          </p>

          <div className='construction-readiness'>
            <div className='construction-readiness-top'>
              <span>Launch readiness</span>
              <strong>{launchReadiness}%</strong>
            </div>
            <div className='construction-track'>
              <div className='construction-fill' style={{ width: `${launchReadiness}%` }} />
            </div>
          </div>

          <div className='construction-metrics'>
            <div className='construction-metric'>
              <span className='construction-metric-value'>18+</span>
              <span className='construction-metric-label'>Nuts Tightened</span>
            </div>
            <div className='construction-metric'>
              <span className='construction-metric-value'>24/7</span>
              <span className='construction-metric-label'>Screws Screwed</span>
            </div>
            <div className='construction-metric'>
              <span className='construction-metric-value'>∞</span>
              <span className='construction-metric-label'>Big release energy</span>
            </div>
          </div>
        </div>

        <div className='construction-visual' aria-hidden='true'>
          {/* <div className='construction-ring construction-ring-outer' /> */}
          <div className='construction-ring construction-ring-inner' />
          <div className='construction-image-wrap'>
            <img
              src={cartoonMechanic}
              alt='Cartoon mechanic building the next Dev-Link experience'
              className='construction-image'
            />
          </div>
          <div className='construction-pulse construction-pulse-one' />
          <div className='construction-pulse construction-pulse-two' />
        </div>
      </section>
    </main>
  )
}

export default Construction