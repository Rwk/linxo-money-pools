// Original local artwork. Decorative; meaningful copy lives alongside the SVG.
export function OccasionIllustration() {
  return (
    <svg
      className="occasion-illustration"
      viewBox="0 0 520 400"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="267" cy="208" rx="172" ry="151" fill="var(--secondary)" />
      <path
        d="M74 236c-23 77 38 137 131 116m220-202c40 49 23 133-32 157"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeDasharray="3 10"
        strokeLinecap="round"
      />
      <g data-occasion="birthday" transform="translate(46 70) rotate(-9 58 60)">
        <path
          d="M8 118h105"
          stroke="var(--foreground)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M16 70h89v43a5 5 0 0 1-5 5H21a5 5 0 0 1-5-5Z"
          fill="var(--celebration-surface)"
          stroke="var(--celebration)"
          strokeWidth="2.5"
        />
        <path
          d="M16 82c9 16 17-10 27 0s17 10 27 0 20 15 35 0V70H16Z"
          fill="var(--celebration)"
        />
        <path d="M40 69V49m42 20V49" stroke="var(--accent)" strokeWidth="5" />
        <path
          d="M40 28c-13 15-5 20 0 20s13-5 0-20Zm42 0c-13 15-5 20 0 20s13-5 0-20Z"
          fill="var(--celebration)"
        />
      </g>
      <g
        data-occasion="farewell"
        transform="translate(354 39) rotate(12 60 60)"
      >
        <path
          d="m1 52 119-35-39 105-22-42Z"
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="m59 80 61-63-81 49 5 36 15-22Z" fill="var(--accent)" />
        <path
          d="m44 102 15-22 13 24"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </g>
      <g transform="translate(175 146) rotate(5 90 80)">
        <rect
          x="4"
          y="42"
          width="174"
          height="128"
          rx="12"
          fill="var(--accent)"
        />
        <path d="M3 75h176" stroke="var(--surface)" strokeWidth="3" />
        <path d="M79 42v128h24V42" fill="var(--celebration-surface)" />
        <path
          d="M91 42C28 47 29-5 57 5c21 7 34 37 34 37Zm0 0c63 5 62-47 34-37-21 7-34 37-34 37Z"
          fill="var(--celebration)"
        />
        <path
          d="m75 23 16 19 17-19"
          stroke="var(--celebration-surface)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
      <g data-occasion="birth" transform="translate(35 244) rotate(8 65 60)">
        <path
          d="M20 101c25 18 61 18 86 0"
          stroke="var(--foreground)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M41 99v12m44-12v12"
          stroke="var(--foreground)"
          strokeWidth="3"
        />
        <path
          d="M10 58h108c-4 32-24 44-54 44S14 90 10 58Z"
          fill="var(--celebration)"
        />
        <path
          d="M30 58c0-42 44-52 66-19L80 58"
          fill="var(--celebration-surface)"
        />
        <circle
          cx="62"
          cy="38"
          r="17"
          fill="var(--surface)"
          stroke="var(--celebration)"
          strokeWidth="2.5"
        />
        <path
          d="M57 36c3 4 6 4 9 0m-4-15c12 3 4 10 0 6"
          stroke="var(--celebration)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <g data-occasion="together" transform="translate(366 251)">
        <circle
          cx="25"
          cy="26"
          r="14"
          fill="var(--celebration-surface)"
          stroke="var(--celebration)"
          strokeWidth="2.5"
        />
        <circle
          cx="81"
          cy="26"
          r="14"
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeWidth="2.5"
        />
        <path d="M5 97V65c0-24 40-24 40 0v32" fill="var(--celebration)" />
        <path d="M61 97V65c0-24 40-24 40 0v32" fill="var(--accent)" />
        <path
          d="m39 60 14-16 14 16"
          stroke="var(--foreground)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <path
        d="m215 48 5 13 13 5-13 5-5 13-5-13-13-5 13-5Zm256 142 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z"
        fill="var(--celebration)"
      />
      <circle cx="156" cy="221" r="5" fill="var(--celebration)" />
      <circle cx="333" cy="94" r="4" fill="var(--accent)" />
      <path
        d="m288 354 7 10m17-20 3 13"
        stroke="var(--celebration)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
