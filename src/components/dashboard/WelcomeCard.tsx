import React, { useState, useEffect } from 'react';
import { useRestaurantData } from '../../hooks/useRestaurantData';

const WelcomeCard: React.FC = () => {
  const { getSingleActiveOutlet } = useRestaurantData();
  const currentOutlet = getSingleActiveOutlet();
  const restaurantName = currentOutlet?.restaurantName || 'Your Restaurant';
  const userName = "Admin"; // Hardcoded for now, can be dynamic later

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="p-6 rounded-xl shadow-lg bg-gradient-to-tr from-sky-600 to-cyan-500 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-white/10 rounded-full"></div>

      <div className="flex justify-between items-start z-10 relative">
        <div>
          <h2 className="text-3xl font-bold">{getGreeting()}, {userName}!</h2>
          <p className="mt-1 text-sky-100">Here's what's happening at {restaurantName} today.</p>
        </div>
        <div className="text-right flex-shrink-0 bg-black/10 backdrop-blur-sm p-3 rounded-lg shadow">
          <p className="font-semibold text-xl">{formatTime(currentTime)}</p>
          <p className="text-xs text-sky-200">{formatDate(currentTime)}</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;