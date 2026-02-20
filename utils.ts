
import { User, WeeklyData, POINTS, PrayerState } from './types';

export const calculateDayPoints = (day: any): number => {
  if (!day) return 0;
  
  const prayerPoints = Object.values(day.prayers as Record<string, PrayerState>).reduce((acc: number, val: PrayerState) => {
    if (val === 1) return acc + POINTS.HOME;
    if (val === 2) return acc + POINTS.MOSQUE;
    return acc;
  }, 0);

  const extra = (day.shaum ? POINTS.SHAUM : 0) + (day.tarawih ? POINTS.TARAWIH : 0);
  return prayerPoints + (day.tilawah * POINTS.TILAWAH_PER_LINE) + extra;
};

export const calculateTotalUserPoints = (user: User | null, trackerData: WeeklyData | null): number => {
  if (!user) return 0;
  
  let activityPoints = 0;
  
  if (trackerData && trackerData.days) {
    activityPoints = trackerData.days.reduce((total, day) => {
      return total + calculateDayPoints(day);
    }, 0);
  }

  // Add bonus points from profile (badges, events, etc)
  const bonusPoints = user.bonusPoints || 0;

  return activityPoints + bonusPoints;
};
