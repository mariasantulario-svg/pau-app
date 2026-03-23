import { useState, useEffect } from 'react';

interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  lastVisit: string;
  completedChallenges: string[];
}

const XP_PER_LEVEL = 100;

export const useGamification = () => {
  const [state, setState] = useState<GamificationState>({
    xp: 0,
    level: 1,
    streak: 0,
    lastVisit: new Date().toDateString(),
    completedChallenges: []
  });

  useEffect(() => {
    const saved = localStorage.getItem('pau-gamification');
    if (saved) {
      const parsed = JSON.parse(saved);
      const today = new Date().toDateString();
      const lastVisit = new Date(parsed.lastVisit).toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      if (lastVisit === today) {
        setState(parsed);
      } else if (lastVisit === yesterday) {
        setState({ ...parsed, streak: parsed.streak + 1, lastVisit: today });
      } else {
        setState({ ...parsed, streak: 0, lastVisit: today });
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pau-gamification', JSON.stringify(state));
  }, [state]);

  const addXP = (amount: number) => {
    setState(prev => {
      const newXP = Math.max(0, prev.xp + amount);
      const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
      return { ...prev, xp: newXP, level: newLevel };
    });
  };

  const subtractXP = (amount: number) => {
    setState(prev => {
      const newXP = Math.max(0, prev.xp - amount);
      const newLevel = Math.max(1, Math.floor(newXP / XP_PER_LEVEL) + 1);
      return { ...prev, xp: newXP, level: newLevel };
    });
  };

  const markChallengeComplete = (challengeId: string) => {
    setState(prev => ({
      ...prev,
      completedChallenges: [...prev.completedChallenges, challengeId]
    }));
  };

  const isChallengeCompleted = (challengeId: string) => {
    return state.completedChallenges.includes(challengeId);
  };

  const getProgressToNextLevel = () => {
    const currentLevelXP = (state.level - 1) * XP_PER_LEVEL;
    const xpInCurrentLevel = state.xp - currentLevelXP;
    return (xpInCurrentLevel / XP_PER_LEVEL) * 100;
  };

  return {
    ...state,
    addXP,
    subtractXP,
    markChallengeComplete,
    isChallengeCompleted,
    getProgressToNextLevel
  };
};
