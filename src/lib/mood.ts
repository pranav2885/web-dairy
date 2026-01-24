import type { MoodCategory, MoodMetadata } from './db';

// Mood configuration with emoji and color mapping
export const MOOD_CONFIG: Record<MoodCategory, { emoji: string; label: string; range: [number, number] }> = {
  ecstatic: { emoji: '🌟', label: 'Ecstatic', range: [4, 5] },
  joyful: { emoji: '😊', label: 'Joyful', range: [3, 4] },
  content: { emoji: '🙂', label: 'Content', range: [2, 3] },
  hopeful: { emoji: '🌱', label: 'Hopeful', range: [1, 2] },
  neutral: { emoji: '😐', label: 'Neutral', range: [-1, 1] },
  thoughtful: { emoji: '🤔', label: 'Thoughtful', range: [-2, -1] },
  melancholy: { emoji: '😔', label: 'Melancholy', range: [-3, -2] },
  anxious: { emoji: '😰', label: 'Anxious', range: [-4, -3] },
  distressed: { emoji: '💔', label: 'Distressed', range: [-5, -4] },
};

// Order for display (positive to negative)
export const MOOD_ORDER: MoodCategory[] = [
  'ecstatic',
  'joyful',
  'content',
  'hopeful',
  'neutral',
  'thoughtful',
  'melancholy',
  'anxious',
  'distressed',
];

// Get mood category from score
export function getMoodFromScore(score: number): MoodCategory {
  if (score >= 4) return 'ecstatic';
  if (score >= 3) return 'joyful';
  if (score >= 2) return 'content';
  if (score >= 1) return 'hopeful';
  if (score >= -1) return 'neutral';
  if (score >= -2) return 'thoughtful';
  if (score >= -3) return 'melancholy';
  if (score >= -4) return 'anxious';
  return 'distressed';
}

// Simple sentiment analysis (AFINN-inspired)
// This is a lightweight implementation; can be replaced with 'sentiment' npm package
const SENTIMENT_WORDS: Record<string, number> = {
  // Very positive (+3 to +5)
  amazing: 4, wonderful: 4, fantastic: 4, excellent: 4, brilliant: 4,
  incredible: 4, outstanding: 4, perfect: 5, love: 3, loved: 3,
  adore: 3, blessed: 3, grateful: 3, thankful: 3, joy: 4, joyful: 4,
  delighted: 4, ecstatic: 5, thrilled: 4, excited: 3, happy: 3,
  
  // Positive (+1 to +2)
  good: 2, great: 2, nice: 2, pleasant: 2, glad: 2, pleased: 2,
  content: 2, satisfied: 2, hopeful: 2, optimistic: 2, peaceful: 2,
  calm: 1, relaxed: 1, comfortable: 1, fine: 1, okay: 1,
  
  // Negative (-1 to -2)
  bad: -2, sad: -2, unhappy: -2, disappointed: -2, upset: -2,
  worried: -1, concerned: -1, uncertain: -1, confused: -1,
  tired: -1, exhausted: -2, bored: -1, lonely: -2,
  
  // Very negative (-3 to -5)
  terrible: -4, horrible: -4, awful: -4, dreadful: -4, miserable: -4,
  depressed: -4, devastated: -5, heartbroken: -5, hopeless: -4,
  anxious: -3, stressed: -3, overwhelmed: -3, frustrated: -3,
  angry: -3, furious: -4, hate: -4, hated: -4, afraid: -3,
  scared: -3, terrified: -4, panicked: -4, grief: -4, loss: -3,
};

export function analyzeSentiment(text: string): MoodMetadata {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  let totalScore = 0;
  let matchedWords = 0;
  
  for (const word of words) {
    if (SENTIMENT_WORDS[word] !== undefined) {
      totalScore += SENTIMENT_WORDS[word];
      matchedWords++;
    }
  }
  
  // Normalize to -5 to +5 range
  let normalizedScore = 0;
  if (matchedWords > 0) {
    normalizedScore = Math.max(-5, Math.min(5, totalScore / Math.sqrt(matchedWords)));
  }
  
  // Calculate confidence based on word matches
  const confidence = Math.min(1, matchedWords / 10);
  
  const category = getMoodFromScore(normalizedScore);
  
  return {
    score: Math.round(normalizedScore * 10) / 10,
    category,
    emoji: MOOD_CONFIG[category].emoji,
    confidence,
  };
}

// Create a mood metadata object from user selection
export function createUserMood(category: MoodCategory, score?: number): MoodMetadata {
  const config = MOOD_CONFIG[category];
  const finalScore = score ?? (config.range[0] + config.range[1]) / 2;
  
  return {
    score: finalScore,
    category,
    emoji: config.emoji,
  };
}

// Get CSS variable name for mood color
export function getMoodColorVar(category: MoodCategory): string {
  return `--mood-${category}`;
}
