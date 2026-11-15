export function BrandMark({ size = 33 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <g fill="currentColor">
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx="20" cy="9" rx="4" ry="8" transform={`rotate(${i * 45} 20 20)`} />
        ))}
        <circle cx="20" cy="20" r="5" />
      </g>
      <circle cx="20" cy="20" r="3.2" fill="#fbfaf6" />
    </svg>
  )
}
export function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 390 320" fill="none" aria-hidden="true">
      <path
        d="M286 32c46 15 79 59 77 113-3 74-59 139-141 138-95-1-153-58-145-133C85 79 184-1 286 32Z"
        fill="#E7D6B9"
        fillOpacity=".6"
      />
      <path
        d="M53 136c-21-18-11-39 8-36 21 3 15 31 0 34-17 5-35-14-26-27"
        stroke="#749487"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="m306 54 7-16 5 15 17 2-14 10 2 16-12-10-15 5 7-14-9-11 12 3Z" fill="#E47A57" />
      <g transform="rotate(-9 205 180)">
        <rect x="70" y="93" width="252" height="193" rx="17" fill="#445D50" />
        <rect x="66" y="86" width="252" height="193" rx="17" fill="#87A48D" />
        <rect x="79" y="100" width="226" height="165" rx="10" stroke="#6F8D76" />
        <circle cx="177" cy="178" r="79" fill="#303A31" />
        <circle cx="177" cy="178" r="69" stroke="#4E5647" />
        <circle cx="177" cy="178" r="61" stroke="#4E5647" />
        <circle cx="177" cy="178" r="53" stroke="#4E5647" />
        <circle cx="177" cy="178" r="45" stroke="#4E5647" />
        <circle cx="177" cy="178" r="30" fill="#F5BE6E" />
        <circle cx="177" cy="178" r="22" stroke="#DEA95D" />
        <path
          d="M169 173v16c-8-4-12 5-6 7 5 1 9-1 9-5v-15l12-3v10c-7-3-11 4-6 6 5 2 9-1 9-5v-19l-18 5v3Z"
          fill="#3F4C3E"
        />
        <circle cx="177" cy="178" r="3.4" fill="#303A31" />
        <path
          d="m267 123 6 74-38 28"
          stroke="#415341"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m267 119 6 74-38 28"
          stroke="#ECE8D5"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="267" cy="119" r="13" fill="#DFE1CB" />
        <circle cx="267" cy="119" r="6" fill="#A6B19A" />
        <rect
          x="222"
          y="218"
          width="24"
          height="12"
          rx="3"
          fill="#E47A57"
          transform="rotate(-38 222 218)"
        />
        <circle cx="287" cy="243" r="7" fill="#DCE2CC" />
        <circle cx="287" cy="243" r="2" fill="#6C8069" />
        <rect x="87" y="251" width="26" height="4" rx="2" fill="#DCE2CC" />
      </g>
      <g transform="rotate(13 326 178)">
        <rect x="293" y="134" width="60" height="85" rx="30" fill="#F6BC6A" />
        <path
          d="M311 179v-24l22-5v24"
          stroke="#584D32"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse cx="305" cy="180" rx="7" ry="5" fill="#584D32" />
        <ellipse cx="327" cy="175" rx="7" ry="5" fill="#584D32" />
      </g>
      <path
        d="m85 58 6-15m-20 18-6-8m29 17 13-3"
        stroke="#688572"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M298 291c11-12 26-12 37-4m-32 13c7-7 16-8 23-3"
        stroke="#8A9B7E"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="41" cy="224" r="5" fill="#D68C66" />
      <circle cx="352" cy="110" r="4" fill="#819C86" />
      <path d="m61 272 8 8m-8 0 8-8" stroke="#C29D68" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
export function QuestArt({ kind, small = false }: { kind: string; small?: boolean }) {
  return (
    <svg
      viewBox="0 0 130 90"
      className={small ? 'quest-art small' : 'quest-art'}
      fill="none"
      aria-hidden="true"
    >
      {kind === 'rhythm' && (
        <>
          <path
            d="M27 56V39m13 28V28m13 49V17m13 57V21m13 44V31m13 25V39m13 11v-6"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="m20 22 4-7m77 58 5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === 'pitch' && (
        <>
          <path
            d="M80 69c-2 12-23 12-26-2-3-13 7-15 7-27 0-12 17-11 17 0 0 9-12 10-11 18"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M49 54c-21-33 16-62 37-40 14 14 10 31-1 43"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="m33 30-7-5m7 23H22m77-16 8-3m-6 20 8 3"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === 'notes' && (
        <>
          <rect x="22" y="19" width="86" height="54" rx="7" stroke="currentColor" strokeWidth="3" />
          <path d="M39 21v50m17-50v50m18-50v50m17-50v50" stroke="currentColor" strokeWidth="2" />
          <path d="M34 20v29h10V20m7 0v29h10V20m25 0v29h10V20" fill="currentColor" />
          <path
            d="m105 9 4-6m5 13 7-2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === 'melody' && (
        <>
          <path
            d="m40 57 0-31 45-9v31"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <ellipse
            cx="32"
            cy="58"
            rx="11"
            ry="8"
            fill="currentColor"
            transform="rotate(-18 32 58)"
          />
          <ellipse
            cx="77"
            cy="49"
            rx="11"
            ry="8"
            fill="currentColor"
            transform="rotate(-18 77 49)"
          />
          <path
            d="m101 55 4-6m-9 19 8 2M51 79l5-5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === 'chords' && (
        <>
          <path
            d="M26 60c0-24 13-36 29-36s29 12 29 36M47 60c0-24 13-36 29-36s29 12 29 36"
            stroke="currentColor"
            strokeWidth="4"
          />
          <circle cx="26" cy="65" r="7" fill="currentColor" />
          <circle cx="65" cy="65" r="7" fill="currentColor" />
          <circle cx="105" cy="65" r="7" fill="currentColor" />
          <path
            d="m62 12 4-7m42 20 6-3"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === 'tempo' && (
        <>
          <path
            d="m44 71 14-54h16l14 54H44Z"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="m66 61 20-33" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="66" cy="61" r="5" fill="currentColor" />
          <path
            d="M54 46h24m-26 9h28M31 34l-7-4m71 31 8 4"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  )
}
export function PlantArt() {
  return (
    <svg width="90" height="100" viewBox="0 0 90 100" fill="none" aria-hidden="true">
      <path
        d="M45 73V24m0 28c-22-3-23-20-23-20 19-3 23 20 23 20Zm1-9c21-3 22-21 22-21-20-2-22 21-22 21Z"
        stroke="#75917A"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M46 29C30 23 36 8 36 8c17 5 10 21 10 21Z" fill="#75917A" />
      <path d="M31 68h29l-5 23H36l-5-23Z" fill="#D99A78" />
      <path d="M28 68h35v7H28z" fill="#E9B08B" />
      <path d="M24 93h43" stroke="#D4CABB" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
