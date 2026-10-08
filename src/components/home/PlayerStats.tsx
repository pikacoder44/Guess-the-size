export function PlayerStats() {
  const stats = [
    {
      id: "streak",
      label: "Daily Streak",
      value: "5 Days",
      dotColor: "bg-amber-400",
      accentHover: "group-hover:text-amber-400",
    },
    {
      id: "personal-best",
      label: "Personal Best",
      value: "488 / 500",
      dotColor: "bg-primary",
      accentHover: "group-hover:text-primary",
    },
    {
      id: "global-rank",
      label: "Skill Rank",
      value: "Top 8%",
      dotColor: "bg-emerald-400",
      accentHover: "group-hover:text-emerald-400",
    },
    {
      id: "drills-completed",
      label: "Games Played",
      value: "38 Rounds",
      dotColor: "bg-purple-400",
      accentHover: "group-hover:text-purple-400",
    },
  ];

  return (
    <section className="w-full my-4 sm:my-8">
      {/* Borderless blended stats panel with soft backdrop tint */}
      <div className="rounded-2xl bg-card/20 backdrop-blur-sm p-4 sm:p-7 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="group flex flex-col gap-1.5 transition-transform duration-200 hover:-translate-y-0.5 cursor-default"
          >
            {/* Label with micro accent dot */}
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/80">
              <span className={`w-1.5 h-1.5 rounded-full ${stat.dotColor}`} />
              <span className="uppercase tracking-wider text-[11px] font-medium">
                {stat.label}
              </span>
            </div>

            {/* Value */}
            <div
              className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight text-foreground transition-colors ${stat.accentHover}`}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PlayerStats;
