export type IconName =
  | "back"
  | "bookmark"
  | "bookmark-fill"
  | "locate"
  | "close"
  | "trash"
  | "map"
  | "route"
  | "phone"
  | "detail"
  | "search";

export function Icon({ name }: { name: IconName }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "back":
      return (
        <svg {...common}>
          <path d="m15 18-6-6 6-6" />
        </svg>
      );
    case "bookmark":
      return (
        <svg {...common}>
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "bookmark-fill":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "locate":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21" />
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M9 7V5h6v2" />
          <path d="M7.5 7.5 8.2 19h7.6l.7-11.5" />
        </svg>
      );
    case "map":
      return (
        <svg {...common}>
          <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.25" />
        </svg>
      );
    case "route":
      return (
        <svg {...common}>
          <path d="m3 11 19-9-9 19-2-8-8-2Z" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M8 3.5h2.4l1 2.8-1.7 1a11 11 0 0 0 5 5l1-1.7 2.8 1V14a1.5 1.5 0 0 1-1.6 1.5A13.5 13.5 0 0 1 6.5 5.1 1.5 1.5 0 0 1 8 3.5Z" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-3.8-3.8" />
        </svg>
      );
    case "detail":
      return (
        <svg {...common}>
          <path d="M7 3.5h7l5 5V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
          <path d="M14 3.5V8.5h5" />
          <path d="M9 13h6M9 16.5h4" />
        </svg>
      );
  }
}
