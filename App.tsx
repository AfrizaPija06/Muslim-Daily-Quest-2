
import React, { useState, useEffect, useMemo } from 'react';
import { WeeklyData, User, AppTheme, POINTS, DayData } from './types';
import { INITIAL_DATA } from './constants';
import { THEMES } from './theme';

// Import Pages
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import LeaderboardPage from './components/LeaderboardPage';
import TrackerPage from './components/TrackerPage';

const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'register' | 'tracker' | 'leaderboard'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<WeeklyData>(INITIAL_DATA);
  const [error, setError] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('nur_quest_theme') as AppTheme) || 'default';
  });

  const themeStyles = THEMES[currentTheme];

  useEffect(() => {
    const savedUser = localStorage.getItem('nur_quest_session');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setView('tracker');
      const savedData = localStorage.getItem(`ibadah_tracker_${user.username}`);
      if (savedData) setData(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`ibadah_tracker_${currentUser.username}`, JSON.stringify(data));
    }
  }, [data, currentUser]);

  useEffect(() => {
    localStorage.setItem('nur_quest_theme', currentTheme);
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  const toggleTheme = () => {
    setCurrentTheme(prev => prev === 'default' ? 'legends' : 'default');
  };

  const handleLogout = () => {
    localStorage.removeItem('nur_quest_session');
    setCurrentUser(null);
    setView('login');
    setData(INITIAL_DATA);
    setError(null);
  };

  const calculateDayPoints = (day: DayData) => {
    const prayerPoints = Object.values(day.prayers).reduce((acc, val) => {
      if (val === 1) return acc + POINTS.HOME;
      if (val === 2) return acc + POINTS.MOSQUE;
      return acc;
    }, 0);
    return prayerPoints + (day.tilawah * POINTS.TILAWAH_PER_LINE);
  };

  const totalPoints = useMemo(() => {
    return data.days.reduce((acc, day) => acc + calculateDayPoints(day), 0);
  }, [data]);

  const commonProps = {
    themeStyles,
    currentTheme,
    toggleTheme
  };

  if (view === 'login') return <LoginPage setView={setView} setCurrentUser={setCurrentUser} setData={setData} setError={setError} error={error} {...commonProps} />;
  if (view === 'register') return <RegisterPage setView={setView} setError={setError} error={error} {...commonProps} />;
  if (view === 'leaderboard' && currentUser?.role === 'mentor') return <LeaderboardPage currentUser={currentUser} setView={setView} handleLogout={handleLogout} {...commonProps} />;
  
  if (view === 'leaderboard' && currentUser?.role !== 'mentor') { setView('tracker'); return null; }

  return (
    <TrackerPage 
      currentUser={currentUser}
      setView={setView}
      handleLogout={handleLogout}
      data={data}
      setData={setData}
      totalPoints={totalPoints}
      {...commonProps}
    />
  );
};

export default App;
