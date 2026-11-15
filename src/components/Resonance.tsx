import { useEffect, useRef } from 'react'
import { audio } from '../lib/audio'
import type { SoundEvent } from '../lib/audio'
import { useExperience } from '../experience/Experience'

/** The shapes follow the signal we actually send to the speakers. */
export function Resonance({
  variant = 'wave',
  active = true,
}: {
  variant?: 'wave' | 'universe'
  active?: boolean
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const events = useRef<SoundEvent[]>([])
  const { theme, motion } = useExperience()
  useEffect(
    () =>
      audio.subscribe((event) => {
        events.current = [...events.current.slice(-95), event]
      }),
    [],
  )
  useEffect(() => {
    const element = canvas.current
    const ctx = element?.getContext('2d')
    if (!element || !ctx) return
    const reduced = !motion || matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0,
      height = 0,
      frame = 0,
      previous = 0
    const samples = new Uint8Array(512)
    const draw = (time = 0) => {
      if (time - previous < 32 && !reduced) {
        frame = requestAnimationFrame(draw)
        return
      }
      previous = time
      ctx.clearRect(0, 0, width, height)
      const analyser = audio.getAnalyser()
      let energy = 0
      if (analyser && !reduced) {
        analyser.getByteTimeDomainData(samples)
        for (const value of samples) energy += Math.abs(value - 128) / 128
        energy /= samples.length
      }
      const now = performance.now()
      events.current = events.current.filter((event) => now - event.at < 2300)
      const visible = events.current.filter((event) => event.at <= now && now - event.at < 2000)
      const t = reduced || !active ? 0 : time * 0.00022
      if (variant === 'universe') {
        const cx = width / 2,
          cy = height * 0.48
        const radius = Math.min(width * 0.24, height * 0.27) + energy * 130
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2.8)
        glow.addColorStop(0, `rgba(183,204,152,${0.07 + energy * 0.22})`)
        glow.addColorStop(0.55, 'rgba(140,173,154,0.025)')
        glow.addColorStop(1, 'rgba(140,173,154,0)')
        ctx.fillStyle = glow
        ctx.fillRect(0, 0, width, height)
        for (let ring = 0; ring < 38; ring++) {
          ctx.beginPath()
          const r = radius * (0.7 + ring / 70)
          for (let i = 0; i <= 160; i++) {
            const angle = (i / 160) * Math.PI * 2
            const sound = analyser && !reduced ? (samples[(i * 3) % samples.length] - 128) / 128 : 0
            const wave =
              Math.sin(angle * 3 + t * 4 + ring * 0.12) * (8 + energy * 38) +
              Math.sin(angle * 5 - t * 3) * 5 +
              sound * 65
            const x = cx + Math.cos(angle) * (r + wave) * (1 + Math.sin(t + ring * 0.08) * 0.08)
            const y = cy + Math.sin(angle) * (r + wave)
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.closePath()
          ctx.strokeStyle = `hsla(${99 + ring * 2.4},${28 + ring}%,${57 + ring * 0.35}%,${0.12 + energy * 0.35})`
          ctx.lineWidth = ring % 6 === 0 ? 1.4 : 0.65
          ctx.stroke()
        }
        for (let i = 0; i < 44; i++) {
          const angle = i * 2.39996 + t * (i % 2 ? 0.18 : -0.12)
          const r = radius * (1.3 + (i % 7) / 5)
          ctx.beginPath()
          ctx.arc(
            cx + Math.cos(angle) * r * 1.5,
            cy + Math.sin(angle) * r * 0.9,
            i % 6 === 0 ? 1.7 : 0.8,
            0,
            Math.PI * 2,
          )
          ctx.fillStyle = `rgba(219,220,183,${0.15 + (i % 4) * 0.1})`
          ctx.fill()
        }
        visible.forEach((event) => {
          if (!event.intensity) return
          const age = reduced ? 0.4 : (now - event.at) / 2000
          const angle = ((event.midi % 12) / 12) * Math.PI * 2 - Math.PI / 2
          const r = radius * (1.05 + age * 1.8)
          const x = cx + Math.cos(angle) * r,
            y = cy + Math.sin(angle) * r
          ctx.beginPath()
          ctx.arc(x, y, 3 + age * 20, 0, Math.PI * 2)
          ctx.strokeStyle = `hsla(${(event.midi % 12) * 20 + 22},60%,75%,${(1 - age) * 0.7})`
          ctx.lineWidth = 1
          ctx.stroke()
          ctx.beginPath()
          ctx.arc(x, y, 2.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(244,220,169,${(1 - age) * 0.85})`
          ctx.fill()
        })
      } else {
        const gradient = ctx.createLinearGradient(0, 0, width, 0)
        gradient.addColorStop(0, theme === 'dark' ? '#c5a787' : '#b9805e')
        gradient.addColorStop(0.5, theme === 'dark' ? '#c2d7a2' : '#879c70')
        gradient.addColorStop(1, '#ae91be')
        for (let line = 0; line < 5; line++) {
          ctx.beginPath()
          for (let x = 0; x <= width; x += 3) {
            const envelope = Math.sin((x / width) * Math.PI)
            const sample =
              analyser && !reduced ? (samples[Math.floor((x / width) * 511)] - 128) / 128 : 0
            const wave =
              Math.sin(x * 0.022 + t * 9 + line * 0.7) * (5 + line * 2 + energy * 80) +
              sample * height * 0.7
            const y = height / 2 + wave * envelope
            if (x === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.strokeStyle = gradient
          ctx.globalAlpha = 0.25 + line * 0.12
          ctx.lineWidth = line === 4 ? 1.6 : 0.8
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      }
      if (!reduced && !document.hidden) frame = requestAnimationFrame(draw)
    }
    const resize = () => {
      const rect = element.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const scale = Math.min(devicePixelRatio || 1, 2)
      element.width = Math.round(width * scale)
      element.height = Math.round(height * scale)
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      cancelAnimationFrame(frame)
      draw()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    const visibility = () => {
      cancelAnimationFrame(frame)
      if (!document.hidden) draw()
    }
    document.addEventListener('visibilitychange', visibility)
    resize()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [variant, active, theme, motion])
  return <canvas ref={canvas} className={`resonance resonance-${variant}`} aria-hidden="true" />
}
