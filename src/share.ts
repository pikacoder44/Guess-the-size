import type { GameResult } from "./types";

export async function shareResult(result: GameResult): Promise<"shared" | "copied" | "none"> {
  const roundEmojis = result.rounds
    .map((r) => {
      if (r.score >= 95) return "🟩";
      if (r.score >= 70) return "🟨";
      if (r.score >= 40) return "🟧";
      return "🟥";
    })
    .join("");

  const text = [
    `ScaleGuess — ${result.mode === "daily" ? `Daily ${result.date}` : "Practice"}`,
    `${result.totalScore}/500 ${roundEmojis}`,
    `How good is your sense of scale? scaleguess.app`,
  ].join("\n");

  try {
    if (navigator.share) {
      await navigator.share({ title: "ScaleGuess", text });
      return "shared";
    }
    await navigator.clipboard?.writeText(text);
    return "copied";
  } catch {
    return "none";
  }
}
