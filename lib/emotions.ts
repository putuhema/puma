/** Everything Mr. P can feel. The model picks one per reply. */
export const emotions = [
  "happy",
  "excited",
  "love",
  "laugh",
  "surprised",
  "sad",
  "thinking",
  "sleepy",
  "confused",
  "shy",
  "dizzy",
  "grumpy",
  "wink",
] as const;

export type Emotion = (typeof emotions)[number];

export function isEmotion(value: unknown): value is Emotion {
  return emotions.includes(value as Emotion);
}
