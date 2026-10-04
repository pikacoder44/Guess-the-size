/**
 * ObjectSilhouette
 *
 * Renders an SVG silhouette for a given object ID.
 * Uses a 100×100 viewBox. The visual aspect ratio of the art
 * is defined by the `aspectRatio` field on ScaleObject — the
 * SVG element itself is sized by its parent via CSS (width/height: 100%).
 *
 * Color is set via CSS `currentColor` on the fill, and passed as a prop.
 */

type Props = {
  silhouette: string;
  label: string;
  color: string;
};

const f = "currentColor";

export function ObjectSilhouette({ silhouette, label, color }: Props) {
  let art: React.ReactNode;

  switch (silhouette) {
    // ── People ────────────────────────────────────────────────────────────────
    case "human":
      art = (
        <>
          <circle cx="50" cy="13" r="9" fill={f} />
          <path
            d="M41 26c0-3 4-6 9-6s9 3 9 6l-3 26 7 40H55L50 58l-5 34H33l7-40-3-26h4Z"
            fill={f}
          />
        </>
      );
      break;

    case "child":
      art = (
        <>
          <circle cx="50" cy="17" r="9" fill={f} />
          <path
            d="M42 30c0-3 3-5 8-5s8 2 8 5l-3 22 6 33H54L50 60l-4 30H37l6-33-3-22h2Z"
            fill={f}
          />
        </>
      );
      break;

    // ── Animals ───────────────────────────────────────────────────────────────
    case "cat":
      art = (
        <>
          <ellipse cx="50" cy="62" rx="20" ry="22" fill={f} />
          <circle cx="50" cy="34" r="14" fill={f} />
          <path d="M36 23 28 8h6l10 14M64 23 72 8h-6L56 22" fill={f} />
          <path
            d="M32 78v16h-8V76m44 2v16h-8V76"
            fill={f}
          />
          <path d="M70 58c8 3 14 12 12 22" stroke={color} strokeWidth="3" fill="none" />
        </>
      );
      break;

    case "dog":
      art = (
        <>
          <ellipse cx="48" cy="60" rx="24" ry="22" fill={f} />
          <circle cx="70" cy="38" r="16" fill={f} />
          <path d="M76 27c6-4 14 0 14 8s-6 10-12 6l-6-8 4-6Z" fill={f} />
          <path d="M28 76v18h-8V74m44 2v18h-8V74" fill={f} />
          <path d="M62 57c14 2 20 14 16 26" stroke={color} strokeWidth="3" fill="none" />
        </>
      );
      break;

    case "horse":
      art = (
        <>
          <ellipse cx="50" cy="58" rx="28" ry="22" fill={f} />
          <circle cx="72" cy="36" r="14" fill={f} />
          <path d="M78 28c4-6 12-8 16-2s0 12-8 12l-8-6 0-4Z" fill={f} />
          <path d="M76 24c0-8 6-16 4-22" stroke={color} strokeWidth="5" fill="none" />
          <path d="M24 74v22h-8V72m18 2v22h-8V72m38 0v22h-8V72m18-2v22h-8V70" fill={f} />
        </>
      );
      break;

    case "giraffe":
      art = (
        <>
          <ellipse cx="50" cy="85" rx="18" ry="10" fill={f} />
          <path d="M38 78V32c0-10 5-16 12-16s12 6 12 16v46H38Z" fill={f} />
          <circle cx="50" cy="10" r="9" fill={f} />
          <path d="M44 5 38 0h4l8 7 8-7h4l-6 5-16 0Z" fill={f} />
          <path d="M30 80v16h-8V78m48 2v16h-8V78" fill={f} />
        </>
      );
      break;

    case "elephant":
      art = (
        <>
          <ellipse cx="48" cy="66" rx="36" ry="24" fill={f} />
          <circle cx="74" cy="48" r="20" fill={f} />
          <path
            d="M80 54c12 5 14 18 6 32-3 7-9 9-11 4 9-12 2-20-3-24l8-12Z"
            fill={f}
          />
          <path d="M24 82v14H16V80m38 3v12h-8V82" fill={f} />
        </>
      );
      break;

    case "penguin":
      art = (
        <>
          <ellipse cx="50" cy="66" rx="16" ry="28" fill={f} />
          <circle cx="50" cy="28" r="16" fill={f} />
          <ellipse cx="50" cy="66" rx="10" ry="20" fill="var(--paper, #1a1f1e)" />
          <ellipse cx="50" cy="24" rx="8" ry="6" fill="var(--paper, #1a1f1e)" />
          <path d="M34 55c-8 3-12 10-10 18" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M66 55c8 3 12 10 10 18" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      );
      break;

    case "polar-bear":
      art = (
        <>
          <ellipse cx="50" cy="60" rx="32" ry="26" fill={f} />
          <circle cx="72" cy="40" r="18" fill={f} />
          <circle cx="64" cy="26" r="8" fill={f} />
          <circle cx="82" cy="26" r="8" fill={f} />
          <path d="M22 78v18h-10V76m54 2v18h-10V76" fill={f} />
        </>
      );
      break;

    case "blue-whale":
      art = (
        <>
          <path
            d="M10 46c18-16 38-20 60-16 16 3 22 10 22 16s-6 13-22 16c-22 4-42 0-60-16Z"
            fill={f}
          />
          <path d="M8 38 2 26h10l8 16M8 54 2 66h10l8-16" fill={f} />
          <circle cx="72" cy="42" r="3" fill="var(--paper, #1a1f1e)" />
        </>
      );
      break;

    // ── Vehicles ──────────────────────────────────────────────────────────────
    case "bicycle":
      art = (
        <>
          <circle cx="25" cy="70" r="17" fill="none" stroke={color} strokeWidth="5" />
          <circle cx="75" cy="70" r="17" fill="none" stroke={color} strokeWidth="5" />
          <path
            d="m25 70 22-30 13 30m-13-30h18m-18 30h30M47 40 38 28H28"
            fill="none"
            stroke={color}
            strokeWidth="5"
          />
          <path d="M66 28h12M72 22v12" stroke={color} strokeWidth="4" />
        </>
      );
      break;

    case "motorcycle":
      art = (
        <>
          <circle cx="24" cy="70" r="14" fill="none" stroke={color} strokeWidth="6" />
          <circle cx="76" cy="70" r="14" fill="none" stroke={color} strokeWidth="6" />
          <path
            d="M26 66h18l10-22h14l8 22H58"
            fill="none"
            stroke={color}
            strokeWidth="7"
          />
          <circle cx="50" cy="32" r="9" fill={f} />
          <path d="M46 40 38 52M54 40 62 52" stroke={color} strokeWidth="5" />
        </>
      );
      break;

    case "car":
      art = (
        <>
          <path
            d="M16 62 24 42c2-6 7-9 13-9h26c6 0 11 3 13 9l8 20H16Z"
            fill={f}
          />
          <path
            d="M16 64h68v12c0 4-2 6-6 6H22c-4 0-6-2-6-6V64Z"
            fill={f}
          />
          <rect x="29" y="39" width="18" height="14" rx="2" fill="var(--paper, #1a1f1e)" />
          <rect x="51" y="39" width="18" height="14" rx="2" fill="var(--paper, #1a1f1e)" />
          <circle cx="30" cy="78" r="10" fill={f} />
          <circle cx="70" cy="78" r="10" fill={f} />
          <circle cx="30" cy="78" r="5" fill="var(--paper, #1a1f1e)" />
          <circle cx="70" cy="78" r="5" fill="var(--paper, #1a1f1e)" />
        </>
      );
      break;

    case "bus":
      art = (
        <>
          <rect x="8" y="22" width="84" height="56" rx="6" fill={f} />
          <rect x="14" y="28" width="72" height="22" rx="2" fill="var(--paper, #1a1f1e)" />
          <circle cx="26" cy="82" r="9" fill={f} />
          <circle cx="74" cy="82" r="9" fill={f} />
          <circle cx="26" cy="82" r="5" fill="var(--paper, #1a1f1e)" />
          <circle cx="74" cy="82" r="5" fill="var(--paper, #1a1f1e)" />
          <rect x="86" y="38" width="6" height="12" rx="2" fill="var(--paper, #1a1f1e)" />
        </>
      );
      break;

    case "truck":
      art = (
        <>
          {/* Cab */}
          <rect x="58" y="28" width="34" height="50" rx="4" fill={f} />
          <rect x="64" y="34" width="20" height="16" rx="2" fill="var(--paper, #1a1f1e)" />
          {/* Trailer */}
          <rect x="8" y="34" width="52" height="44" rx="2" fill={f} />
          {/* Wheels */}
          <circle cx="22" cy="82" r="8" fill={f} />
          <circle cx="40" cy="82" r="8" fill={f} />
          <circle cx="72" cy="82" r="8" fill={f} />
          <circle cx="88" cy="82" r="8" fill={f} />
          <circle cx="22" cy="82" r="4" fill="var(--paper, #1a1f1e)" />
          <circle cx="40" cy="82" r="4" fill="var(--paper, #1a1f1e)" />
          <circle cx="72" cy="82" r="4" fill="var(--paper, #1a1f1e)" />
          <circle cx="88" cy="82" r="4" fill="var(--paper, #1a1f1e)" />
        </>
      );
      break;

    case "airplane":
      art = (
        <>
          <path
            d="M48 8h4l7 35 30 16v8L57 59v28h10v8H33v-8h10V59L11 67v-8l30-16 7-35Z"
            fill={f}
          />
        </>
      );
      break;

    case "ship":
      art = (
        <>
          <path d="M10 58h80L76 82H24L10 58Z" fill={f} />
          <path
            d="M28 56V34h44v22M38 34V20h24v14"
            fill="none"
            stroke={color}
            strokeWidth="6"
          />
          <path
            d="M20 88c10-6 20 6 30 0 10-6 20 6 30 0"
            fill="none"
            stroke={color}
            strokeWidth="4"
          />
        </>
      );
      break;

    // ── Buildings ─────────────────────────────────────────────────────────────
    case "house":
      art = (
        <>
          <path d="M14 46 50 14l36 32v46H14V46Z" fill={f} />
          <path d="M42 92V64h16v28" fill="var(--paper, #1a1f1e)" />
          <rect x="24" y="52" width="14" height="14" rx="1" fill="var(--paper, #1a1f1e)" />
          <rect x="62" y="52" width="14" height="14" rx="1" fill="var(--paper, #1a1f1e)" />
        </>
      );
      break;

    case "lighthouse":
      art = (
        <>
          <path d="M34 90h32L60 34H40L34 90Z" fill={f} />
          <path d="M32 34h36V22H32z" fill={f} />
          <path d="M38 18h24v4H38z" fill={f} />
          <rect x="41" y="48" width="18" height="14" fill="var(--paper, #1a1f1e)" />
          <path d="M28 14h44" stroke={color} strokeWidth="4" />
        </>
      );
      break;

    case "tower":
      art = (
        <>
          <path d="M28 92h44L66 28H34L28 92Z" fill={f} />
          <path d="M26 28h48V16H26z" fill={f} />
          <path d="M38 8h24v8H38z" fill={f} />
          <circle cx="50" cy="22" r="6" fill="var(--paper, #1a1f1e)" />
        </>
      );
      break;

    case "skyscraper":
      art = (
        <>
          <path d="M26 92V12h28v80H26Zm28-55h20v55H54Z" fill={f} />
          <path
            d="M32 22h10v8H32m0 14h10v8H32m0 14h10v8H32m22-28h10v8H56m0 14h10v8H56"
            fill="var(--paper, #1a1f1e)"
          />
          <path d="M50 12V4" stroke={color} strokeWidth="4" />
        </>
      );
      break;

    case "eiffel-tower":
      art = (
        <>
          <path d="M47 7h6l4 50 20 35H23l20-35 4-50Z" fill={f} />
          <path
            d="M36 60h28M31 74h38M43 24h14"
            fill="none"
            stroke="var(--paper, #1a1f1e)"
            strokeWidth="5"
          />
          <path d="M50 7V2" stroke={color} strokeWidth="4" />
        </>
      );
      break;

    // ── Everyday Objects ──────────────────────────────────────────────────────
    case "chair":
      art = (
        <>
          <rect x="24" y="24" width="52" height="36" rx="5" fill={f} />
          <rect x="24" y="56" width="52" height="5" rx="2" fill={f} />
          <rect x="28" y="58" width="9" height="38" rx="2" fill={f} />
          <rect x="63" y="58" width="9" height="38" rx="2" fill={f} />
        </>
      );
      break;

    case "door":
      art = (
        <>
          <rect x="26" y="10" width="48" height="82" rx="3" fill={f} />
          <rect x="34" y="18" width="32" height="30" rx="1" fill="var(--paper, #1a1f1e)" />
          <rect x="34" y="54" width="32" height="30" rx="1" fill="var(--paper, #1a1f1e)" />
          <circle cx="62" cy="50" r="3" fill="var(--paper, #1a1f1e)" />
        </>
      );
      break;

    case "refrigerator":
      art = (
        <>
          <rect x="28" y="8" width="44" height="84" rx="5" fill={f} />
          <path
            d="M29 48h42"
            stroke="var(--paper, #1a1f1e)"
            strokeWidth="3"
          />
          <path
            d="M36 24v14m28-14v14M36 60v10m28-10v10"
            stroke="var(--paper, #1a1f1e)"
            strokeWidth="4"
          />
        </>
      );
      break;

    case "piano":
      art = (
        <>
          <path
            d="M12 55c10-22 26-34 52-34 10 0 18 5 24 13L78 78H18Z"
            fill={f}
          />
          <path
            d="M24 60h52M33 60v16m10-16v16m10-16v16m10-16v16"
            fill="none"
            stroke="var(--paper, #1a1f1e)"
            strokeWidth="3"
          />
        </>
      );
      break;

    case "football-pitch":
      art = (
        <>
          <rect
            x="8"
            y="24"
            width="84"
            height="52"
            fill="none"
            stroke={color}
            strokeWidth="5"
          />
          <path
            d="M50 24v52M18 34h64M18 66h64"
            fill="none"
            stroke={color}
            strokeWidth="3"
          />
          <circle cx="50" cy="50" r="9" fill="none" stroke={color} strokeWidth="3" />
          <circle cx="50" cy="50" r="2" fill={f} />
          <rect x="8" y="34" width="12" height="32" fill="none" stroke={color} strokeWidth="3" />
          <rect x="80" y="34" width="12" height="32" fill="none" stroke={color} strokeWidth="3" />
        </>
      );
      break;

    case "tennis-court":
      art = (
        <>
          <rect
            x="8"
            y="20"
            width="84"
            height="60"
            fill="none"
            stroke={color}
            strokeWidth="5"
          />
          <path
            d="M50 20v60M8 50h84"
            fill="none"
            stroke={color}
            strokeWidth="3"
          />
          <path d="M36 50h28" stroke={color} strokeWidth="8" />
          <path d="M20 20v60M80 20v60" stroke={color} strokeWidth="2" strokeDasharray="4 4" />
        </>
      );
      break;

    // ── Nature ────────────────────────────────────────────────────────────────
    case "tree":
      art = (
        <>
          <rect x="44" y="52" width="12" height="42" rx="2" fill={f} />
          <circle cx="50" cy="30" r="22" fill={f} />
          <circle cx="30" cy="48" r="16" fill={f} />
          <circle cx="70" cy="48" r="16" fill={f} />
          <circle cx="50" cy="52" r="14" fill={f} />
        </>
      );
      break;

    case "mountain":
      art = (
        <>
          <path d="M8 92 34 44l14 20 14-38 34 66H8Z" fill={f} />
          <path d="M48 66 62 28l10 20-8 2z" fill="var(--paper, #1a1f1e)" />
        </>
      );
      break;

    case "volcano":
      art = (
        <>
          <path d="M12 92 40 32h20l28 60H12Z" fill={f} />
          <path d="M40 32h20l-4-14H44z" fill={f} />
          <path d="M48 18V6m6 12V4" stroke={color} strokeWidth="3" />
        </>
      );
      break;

    // ── Space ─────────────────────────────────────────────────────────────────
    case "rocket":
      art = (
        <>
          <path
            d="M50 5c13 11 18 30 18 50v25H32V55C32 35 37 16 50 5Z"
            fill={f}
          />
          <path d="M32 52l-18 22h18m36-22 18 22H68" fill={f} />
          <circle cx="50" cy="38" r="8" fill="var(--paper, #1a1f1e)" />
        </>
      );
      break;

    case "satellite":
      art = (
        <>
          <rect x="40" y="30" width="20" height="40" rx="3" fill={f} />
          <rect x="8" y="24" width="28" height="20" rx="2" fill={f} />
          <rect x="64" y="24" width="28" height="20" rx="2" fill={f} />
          <path
            d="M50 70v22m-10-4h20"
            fill="none"
            stroke={color}
            strokeWidth="5"
          />
          <circle cx="50" cy="22" r="7" fill="var(--paper, #1a1f1e)" />
        </>
      );
      break;

    default:
      art = (
        <>
          <circle cx="50" cy="22" r="14" fill={f} />
          <rect x="28" y="40" width="44" height="52" rx="3" fill={f} />
        </>
      );
  }

  return (
    <svg
      className="silhouette"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
      style={{ color, width: "100%", height: "100%", display: "block" }}
    >
      {art}
    </svg>
  );
}
