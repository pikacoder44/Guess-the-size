type Props = {
  silhouette: string;
  label: string;
  accent?: boolean;
  tone?: "reference" | "target" | "actual";
};

const fill = "currentColor";

export function ObjectSilhouette({
  silhouette,
  label,
  accent = false,
  tone,
}: Props) {
  const color =
    tone === "reference"
      ? "var(--reference)"
      : tone === "actual"
        ? "var(--blueprint)"
        : accent || tone === "target"
          ? "var(--accent)"
          : "var(--ink)";
  const common = { fill, stroke: "none" };
  let art: React.ReactNode;
  switch (silhouette) {
    case "airbus-a380":
      art = (
        <path
          d="M48 5h4l8 34 31 17v8L59 56v30h10v9H31v-9h10V56L9 64v-8l31-17 8-34Zm-17 48h38l-5 8H36l-5-8Z"
          {...common}
        />
      );
      break;
    case "red-death":
      art = (
        <>
          <path
            d="M20 76c2-22 14-37 30-40 16-3 29 8 30 28l11 12-5 7-13-8H31l-10 8-8-6 7-9Z"
            {...common}
          />
          <path
            d="m30 43-13-21 24 12 9-20 9 20 24-12-12 22M31 69 8 51l20 4m41 14 23-18-20 4"
            {...common}
          />
          <circle cx="38" cy="52" r="3" fill="var(--paper)" />
        </>
      );
      break;
    case "godzilla":
      art = (
        <path
          d="M27 92 24 59 31 34l-4-18 12 11 8-18 7 17 14-12-5 21 10 22-3 35H58V66h-9v26H36l-4-30-2 30H16l6-34-5 20-9-1 10-27 9-6Z"
          {...common}
        />
      );
      break;
    case "tardis":
      art = (
        <>
          <path d="M27 19h46l5 73H22l5-73Z" {...common} />
          <path
            d="M24 28h52M32 40h14v18H32zm22 0h14v18H54zM31 65h38v27H31z"
            fill="var(--paper)"
          />
          <path d="M31 19V9h38v10" {...common} />
          <circle cx="50" cy="14" r="3" fill="var(--paper)" />
        </>
      );
      break;
    case "enterprise":
      art = (
        <>
          <path
            d="M8 47c22-8 39-9 55-2l29 13-30 5c-17 3-34 0-54-7l22-4L8 47Z"
            {...common}
          />
          <ellipse cx="51" cy="49" rx="18" ry="6" fill="var(--paper)" />
          <path d="M51 45 67 17l6 3-9 28M51 54 68 82l5-3-9-28" {...common} />
        </>
      );
      break;
    case "titanic":
      art = (
        <>
          <path d="M8 60h84L77 82H25L8 60Z" {...common} />
          <path
            d="M27 58V32h42v26M35 32V19h7v13m8-13V8h7v24m8-13v13"
            fill="none"
            stroke={color}
            strokeWidth="6"
          />
          <path
            d="M22 88c9-5 18 5 27 0 9-5 18 5 27 0"
            fill="none"
            stroke={color}
            strokeWidth="4"
          />
        </>
      );
      break;
    case "eiffel-tower":
      art = (
        <>
          <path d="M47 7h6l4 49 19 36H24l19-36 4-49Z" {...common} />
          <path
            d="M36 60h28M31 73h38M43 24h14"
            fill="none"
            stroke="var(--paper)"
            strokeWidth="4"
          />
        </>
      );
      break;
    case "human":
      art = (
        <>
          <circle cx="50" cy="13" r="8" {...common} />
          <path
            d="M41 25c0-3 4-5 9-5s9 2 9 5l-4 25 8 42H55L50 57l-5 35H33l8-42-4-25h4Z"
            {...common}
          />
        </>
      );
      break;
    case "giraffe":
      art = (
        <>
          <ellipse cx="50" cy="83" rx="18" ry="10" {...common} />
          <path d="M38 76V27c0-8 4-14 12-14s12 6 12 14v49H38Z" {...common} />
          <circle cx="50" cy="12" r="8" {...common} />
          <path d="M44 7 39 1h4l7 7 7-7h4l-5 6-12 0Z" {...common} />
        </>
      );
      break;
    case "elephant":
      art = (
        <>
          <ellipse cx="50" cy="68" rx="34" ry="23" {...common} />
          <circle cx="73" cy="50" r="18" {...common} />
          <path
            d="M78 56c10 4 12 15 6 28-3 6-8 8-10 4 8-11 2-18-3-22l7-10Z"
            {...common}
          />
          <path d="M26 82v13H18V80m38 3v12h-8V82" {...common} />
        </>
      );
      break;
    case "cat":
    case "dog":
    case "horse":
    case "penguin":
      art = (
        <>
          <ellipse
            cx="50"
            cy="65"
            rx={silhouette === "horse" ? 22 : 18}
            ry="25"
            {...common}
          />
          <circle
            cx="50"
            cy="31"
            r={silhouette === "penguin" ? 14 : 13}
            {...common}
          />
          <path
            d="m40 23-6-11 12 7m14 4 6-11-12 7M39 76v19h-7V76m29 0v19h-7V76"
            {...common}
          />
        </>
      );
      break;
    case "car":
      art = (
        <>
          <path
            d="M17 62 24 43c2-5 6-8 12-8h28c6 0 10 3 12 8l7 19H17Z"
            {...common}
          />
          <rect
            x="30"
            y="41"
            width="18"
            height="13"
            rx="2"
            fill="var(--paper)"
          />
          <rect
            x="51"
            y="41"
            width="18"
            height="13"
            rx="2"
            fill="var(--paper)"
          />
          <circle cx="32" cy="65" r="8" {...common} />
          <circle cx="70" cy="65" r="8" {...common} />
        </>
      );
      break;
    case "bus":
      art = (
        <>
          <rect x="12" y="22" width="76" height="55" rx="8" {...common} />
          <path d="M20 34h60v18H20z" fill="var(--paper)" />
          <circle cx="29" cy="80" r="8" {...common} />
          <circle cx="71" cy="80" r="8" {...common} />
        </>
      );
      break;
    case "motorcycle":
      art = (
        <>
          <path
            d="M28 65h17l9-20h12l8 20H58"
            fill="none"
            stroke={color}
            strokeWidth="6"
          />
          <circle
            cx="25"
            cy="70"
            r="12"
            fill="none"
            stroke={color}
            strokeWidth="5"
          />
          <circle
            cx="76"
            cy="70"
            r="12"
            fill="none"
            stroke={color}
            strokeWidth="5"
          />
          <circle cx="52" cy="34" r="8" {...common} />
        </>
      );
      break;
    case "bicycle":
      art = (
        <>
          <circle
            cx="25"
            cy="70"
            r="16"
            fill="none"
            stroke={color}
            strokeWidth="4"
          />
          <circle
            cx="75"
            cy="70"
            r="16"
            fill="none"
            stroke={color}
            strokeWidth="4"
          />
          <path
            d="m25 70 20-28 13 28m-13-28h17m-17 28h30M45 42l-9-10h-9"
            fill="none"
            stroke={color}
            strokeWidth="4"
          />
        </>
      );
      break;
    case "airplane":
      art = (
        <>
          <path
            d="M48 8h4l7 34 29 16v7L56 57v28h9v8H35v-8h9V57L12 65v-7l29-16 7-34Z"
            {...common}
          />
        </>
      );
      break;
    case "rocket":
      art = (
        <>
          <path
            d="M50 5c12 10 17 27 17 48v25H33V53C33 32 38 15 50 5Z"
            {...common}
          />
          <path d="m33 52-16 21h16m34-21 16 21H67" {...common} />
          <circle cx="50" cy="40" r="7" fill="var(--paper)" />
        </>
      );
      break;
    case "satellite":
      art = (
        <>
          <rect x="42" y="32" width="16" height="36" rx="3" {...common} />
          <path d="M10 26h25v18H10zm55 0h25v18H65z" {...common} />
          <path
            d="M50 68v20m-9-4h18"
            fill="none"
            stroke={color}
            strokeWidth="5"
          />
          <circle cx="50" cy="24" r="7" fill="var(--paper)" />
        </>
      );
      break;
    case "ship":
      art = (
        <>
          <path d="M10 59h80L76 82H24L10 59Z" {...common} />
          <path
            d="M28 57V35h44v22M38 35V21h24v14"
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
    case "football":
      art = (
        <>
          <rect
            x="13"
            y="28"
            width="74"
            height="45"
            rx="3"
            fill="none"
            stroke={color}
            strokeWidth="5"
          />
          <path
            d="M50 28v45M22 39h56M22 62h56"
            fill="none"
            stroke={color}
            strokeWidth="3"
          />
          <circle
            cx="50"
            cy="50"
            r="8"
            fill="none"
            stroke={color}
            strokeWidth="3"
          />
        </>
      );
      break;
    case "tennis":
      art = (
        <>
          <rect
            x="12"
            y="25"
            width="76"
            height="50"
            fill="none"
            stroke={color}
            strokeWidth="5"
          />
          <path
            d="M50 25v50M12 50h76"
            fill="none"
            stroke={color}
            strokeWidth="3"
          />
          <path d="M38 50h24" stroke={color} strokeWidth="8" />
        </>
      );
      break;
    case "piano":
      art = (
        <>
          <path
            d="M12 55c10-21 26-32 52-32 10 0 18 5 24 12L78 75H18Z"
            {...common}
          />
          <path
            d="M26 58h48M35 58v16m10-16v16m10-16v16m10-16v16"
            fill="none"
            stroke="var(--paper)"
            strokeWidth="3"
          />
        </>
      );
      break;
    case "house":
      art = (
        <>
          <path d="M15 45 50 14l35 31v47H15V45Z" {...common} />
          <path
            d="M42 92V64h16v28M31 51h10v10H31m28-10h10v10H59"
            fill="var(--paper)"
          />
        </>
      );
      break;
    case "lighthouse":
      art = (
        <>
          <path d="M34 91h32L61 34H39L34 91Z" {...common} />
          <path d="M32 34h36V23H32zM38 18h24v5H38z" {...common} />
          <path d="M41 48h18v14H41z" fill="var(--paper)" />
        </>
      );
      break;
    case "tower":
      art = (
        <>
          <path d="M28 92h44L66 28H34L28 92Z" {...common} />
          <path d="M27 28h46V16H27zM37 8h26v8H37z" {...common} />
          <circle cx="50" cy="22" r="5" fill="var(--paper)" />
        </>
      );
      break;
    case "skyscraper":
      art = (
        <>
          <path d="M27 92V12h28v80H27Zm28-55h18v55H55Z" {...common} />
          <path
            d="M34 22h8v8h-8m0 12h8v8h-8m0 12h8v8h-8m29-26h8v8h-8m0 12h8v8h-8"
            fill="var(--paper)"
          />
        </>
      );
      break;
    case "door":
      art = (
        <>
          <rect x="27" y="10" width="46" height="82" rx="2" {...common} />
          <rect x="36" y="21" width="28" height="29" fill="var(--paper)" />
          <circle cx="61" cy="62" r="3" fill="var(--paper)" />
        </>
      );
      break;
    case "refrigerator":
      art = (
        <>
          <rect x="29" y="8" width="42" height="84" rx="4" {...common} />
          <path
            d="M30 47h40M36 25v12m28-12v12"
            stroke="var(--paper)"
            strokeWidth="4"
          />
        </>
      );
      break;
    case "tree":
      art = (
        <>
          <path d="M44 51h12v41H44z" {...common} />
          <circle cx="50" cy="29" r="22" {...common} />
          <circle cx="31" cy="47" r="15" {...common} />
          <circle cx="69" cy="47" r="15" {...common} />
        </>
      );
      break;
    case "volcano":
      art = (
        <>
          <path d="m13 92 28-58h18l28 58H13Z" {...common} />
          <path d="M39 34h22l-5-13H44z" {...common} />
          <path d="M47 21V7m6 14V4" stroke={color} strokeWidth="3" />
        </>
      );
      break;
    case "mountain":
      art = (
        <>
          <path d="m8 92 25-46 13 18 12-35 34 63H8Z" {...common} />
          <path d="m46 64 12-35 9 17-8 2z" fill="var(--paper)" />
        </>
      );
      break;
    case "waterfall":
      art = (
        <>
          <path d="m8 92 22-50 18 20 16-35 28 65H8Z" {...common} />
          <path d="M45 66h12v26H45z" fill="var(--paper)" />
          <path d="M42 35h18" stroke={color} strokeWidth="4" />
        </>
      );
      break;
    case "chair":
      art = (
        <>
          <rect x="30" y="27" width="40" height="34" rx="4" {...common} />
          <rect x="34" y="58" width="7" height="36" {...common} />
          <rect x="59" y="58" width="7" height="36" {...common} />
        </>
      );
      break;
    case "moon":
      art = <circle cx="50" cy="50" r="37" {...common} />;
      break;
    default:
      art = (
        <>
          <circle cx="50" cy="22" r="13" {...common} />
          <path d="M28 42h44v50H28z" {...common} />
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
      style={{ color }}
    >
      {art}
    </svg>
  );
}
