import type { GameResult } from "./types";

export async function shareResult(result: GameResult) {
  const text = `I scored ${result.totalScore}/500 on ScaleGuess!`;
  if (navigator.share) {
    await navigator.share({ title: "ScaleGuess", text });
    return "shared";
  }
  await navigator.clipboard?.writeText(text);
  return "copied";
}
