import { Flame, Trophy, Award, Activity } from "lucide-react";

export function PlayerStats() {
  const stats = [
    {
      id: "streak",
      label: "Daily Streak",
      value: "5 Days",
      icon: Flame,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-border/60",
    },
    {
      id: "personal-best",
      label: "Personal Best",
      value: "488 / 500",
      icon: Trophy,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-border/60",
    },
    {
      id: "global-rank",
      label: "Skill Rank",
      value: "Top 8%",
      icon: Award,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-border/60",
    },
    {
      id: "drills-completed",
      label: "Games Played",
      value: "38 Rounds",
      icon: Activity,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      borderColor: "border-border/60",
    },
  ];

  return (
    <section className="w-full my-6 sm:my-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className={`rounded-xl border ${stat.borderColor} bg-card/50 backdrop-blur-sm p-4 sm:p-5 flex flex-col justify-between transition-colors hover:bg-card/80 hover:border-border`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium">
                  {stat.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-lg ${stat.bgColor} ${stat.color} flex items-center justify-center`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="text-xl sm:text-2xl font-mono font-bold text-foreground tracking-tight">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default PlayerStats;
