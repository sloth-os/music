import { AudioLines, Disc3, Flame, Music2, PenLine, Sparkles } from 'lucide-react'
import type { Speaker } from './story'
const icons = [Flame, AudioLines, PenLine, Music2, Sparkles, Disc3]
export function EchoGlyph({ index, size = 22 }: { index: number; size?: number }) {
  const Icon = icons[index % icons.length]
  return <Icon size={size} strokeWidth={1.5} aria-hidden="true" />
}
export function Portrait({ character = 'pip' }: { character?: Speaker }) {
  if (character === 'pip')
    return (
      <svg viewBox="0 0 160 180" fill="none" className="character-portrait" aria-hidden="true">
        <defs>
          <linearGradient
            id="pip-metal"
            x1="40"
            y1="35"
            x2="120"
            y2="150"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#EAD6A0" />
            <stop offset=".5" stopColor="#AF8954" />
            <stop offset="1" stopColor="#6D6947" />
          </linearGradient>
        </defs>
        <ellipse cx="82" cy="157" rx="41" ry="8" fill="#0A1610" fillOpacity=".3" />
        <path
          d="m53 118-23 26 41-12m36-14 26 25-43-12"
          fill="#656C4E"
          stroke="#A8A56E"
          strokeWidth="2"
        />
        <path
          d="m73 135-4 20m25-20 4 20m-35 1h15m12 0h15"
          stroke="#C8AD74"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M45 94c0-31 12-47 37-47 25 0 38 17 38 48 0 34-17 49-38 49-23 0-37-15-37-50Z"
          fill="url(#pip-metal)"
          stroke="#E4CC92"
          strokeWidth="2"
        />
        <path d="M52 97c4 15 14 24 30 29 17-5 27-14 31-29" stroke="#655A3E" strokeWidth="3" />
        <path
          d="M54 77c-1-19-12-34-19-35l7 35m66 0c1-18 11-31 18-33l-5 34"
          fill="#CFB67B"
          stroke="#EBCE8D"
          strokeWidth="2"
        />
        <path d="m67 46 15-21 12 20" fill="#BC965B" stroke="#E9CE90" strokeWidth="2" />
        <circle cx="82" cy="29" r="5" fill="#D9E3A9" />
        <circle cx="65" cy="82" r="20" fill="#324A3B" stroke="#E8CF92" strokeWidth="3" />
        <circle cx="100" cy="82" r="20" fill="#324A3B" stroke="#E8CF92" strokeWidth="3" />
        <circle cx="66" cy="81" r="11" fill="#D7E4B1" />
        <circle cx="101" cy="81" r="11" fill="#D7E4B1" />
        <circle cx="68" cy="81" r="5" fill="#152F27" />
        <circle cx="103" cy="81" r="5" fill="#152F27" />
        <circle cx="70" cy="77" r="2" fill="#FFFFDD" />
        <circle cx="105" cy="77" r="2" fill="#FFFFDD" />
        <path d="m75 100 7 12 8-12-8-4-7 4Z" fill="#EAC97D" stroke="#8C7044" />
        <circle cx="82" cy="129" r="6" fill="#738559" stroke="#D5C690" />
        <circle cx="82" cy="129" r="2" fill="#DCE6A5" />
      </svg>
    )
  if (character === 'memory')
    return (
      <svg viewBox="0 0 160 180" fill="none" className="character-portrait" aria-hidden="true">
        <path
          d="M80 19 124 51v62l-44 43-44-43V51L80 19Z"
          fill="#456C61"
          fillOpacity=".6"
          stroke="#B3CBAC"
        />
        <path d="m80 36 29 25v44l-29 29-29-29V61l29-25Z" stroke="#9DBE9E" strokeWidth="2" />
        <path
          d="M64 96V60m32 36V60M64 64c8-13 23-13 32 0m-32 32c9 12 23 12 32 0m-31-1h30M72 61v38m16-38v38m-8-40v40"
          stroke="#D8D4A1"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="80" cy="16" r="4" fill="#E0DCAB" />
        <path d="m19 79 5-10 5 10-5 10-5-10m112 26 5-7 5 7-5 7-5-7" stroke="#9FBD99" />
      </svg>
    )
  const iona = character === 'iona'
  return (
    <svg viewBox="0 0 160 180" fill="none" className="character-portrait" aria-hidden="true">
      <ellipse cx="80" cy="164" rx="45" ry="7" fill="#10241B" fillOpacity=".3" />
      <path
        d="M38 151c0-35 17-54 42-54s43 19 43 54l-43 16-42-16Z"
        fill={iona ? '#566F62' : '#516A50'}
        stroke="#9DB08B"
        strokeWidth="2"
      />
      <path d="m72 101-12 53m27-53 15 52" stroke="#CCB47B" strokeWidth="3" />
      <path
        d="M46 68c0-34 13-52 34-52 22 0 35 17 35 52l-8 42-27-14-27 14-7-42Z"
        fill={iona ? '#A6B6A8' : '#3B5A49'}
        stroke="#BAC5AD"
        strokeWidth="1.5"
      />
      <path
        d="M57 58c0-15 10-25 23-25 14 0 24 10 24 25v18c0 19-9 31-24 31-14 0-23-12-23-31V58Z"
        fill={iona ? '#C9AC8B' : '#BB9D7A'}
      />
      <path
        d="M53 59c17-1 27-10 33-25 4 14 10 21 22 25V41L80 25 54 42l-1 17Z"
        fill={iona ? '#B6C2B1' : '#3B5A49'}
      />
      <path d="M66 72h4m20 0h4" stroke="#3C4F41" strokeWidth="3" strokeLinecap="round" />
      <path d="M75 90c4 3 8 3 12 0" stroke="#8A6955" strokeWidth="2" strokeLinecap="round" />
      {iona && (
        <>
          <circle cx="67" cy="73" r="10" stroke="#DDD0A2" strokeWidth="1.7" />
          <circle cx="94" cy="73" r="10" stroke="#DDD0A2" strokeWidth="1.7" />
          <path d="M77 73h7" stroke="#DDD0A2" strokeWidth="1.7" />
        </>
      )}
      <path d="m80 118 5 9 10 2-7 7 1 10-9-5-9 5 2-10-8-7 11-2 4-9Z" fill="#D4C288" />
      <circle cx="80" cy="132" r="3" fill="#74936C" />
    </svg>
  )
}
export function Resonator({ filled = 0, active = false }: { filled?: number; active?: boolean }) {
  return (
    <svg
      viewBox="0 0 320 320"
      className={`resonator-art ${active ? 'is-awake' : ''}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="heart-glow">
          <stop stopColor="#F5D990" stopOpacity=".6" />
          <stop offset="1" stopColor="#F5D990" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="160" r="150" fill="url(#heart-glow)" opacity={active ? 0.7 : 0.15} />
      <circle cx="160" cy="160" r="111" stroke="#8B8E62" strokeWidth="1" strokeDasharray="2 8" />
      <ellipse
        cx="160"
        cy="160"
        rx="107"
        ry="65"
        transform="rotate(-35 160 160)"
        stroke="#C4A66C"
        strokeWidth="4"
      />
      <ellipse
        cx="160"
        cy="160"
        rx="107"
        ry="65"
        transform="rotate(35 160 160)"
        stroke="#B49C68"
        strokeWidth="4"
      />
      <circle cx="160" cy="160" r="76" stroke="#D7BD7A" strokeWidth="2" />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i * Math.PI) / 3 - Math.PI / 2
        return (
          <g key={i}>
            <path
              d={`M160 160 ${160 + Math.cos(a) * 110} ${160 + Math.sin(a) * 110}`}
              stroke={i < filled ? '#EBCB85' : '#788764'}
              strokeOpacity=".5"
            />
            <circle
              cx={160 + Math.cos(a) * 110}
              cy={160 + Math.sin(a) * 110}
              r="10"
              fill={i < filled ? '#EBCB85' : '#2C4335'}
              stroke="#C0AD76"
              strokeWidth="2"
            />
          </g>
        )
      })}
      <circle
        cx="160"
        cy="160"
        r="38"
        fill={active ? '#E3C580' : '#344E3C'}
        stroke="#D2BC84"
        strokeWidth="2"
      />
      <path
        d="M149 172v-31l23-5v29"
        stroke={active ? '#4F5734' : '#BFCBA0'}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="143" cy="173" rx="7" ry="5" fill={active ? '#4F5734' : '#BFCBA0'} />
      <ellipse cx="166" cy="166" rx="7" ry="5" fill={active ? '#4F5734' : '#BFCBA0'} />
      <path
        d="m132 250-13 22h82l-13-22m-70 24h84"
        stroke="#B8A16F"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}
