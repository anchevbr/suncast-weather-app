import React from "react";
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiFog, WiDayCloudy, WiDayRain, WiDaySnow } from "react-icons/wi";

/**
 * WeatherIcon component that displays appropriate weather icon based on conditions
 * @param {Object} props - Component props
 * @param {Object} props.day - Weather data for the day
 * @returns {JSX.Element} - Weather icon component
 */
const WeatherIcon = ({ day }) => {
  const getDetailedWeatherIcon = () => {
    const conditions = day.conditions?.toLowerCase() || '';
    const precip = day.precipitation_chance || 0;
    const clouds = day.cloud_coverage || 0;
    
    const iconClass = "w-8 h-8 sm:w-10 sm:h-10";
    
    // Rain conditions
    if (precip > 70 || conditions.includes('rain') || conditions.includes('shower')) {
      return <WiDayRain className={`${iconClass} text-blue-600`} />;
    }
    if (precip > 40 || conditions.includes('drizzle')) {
      return <WiRain className={`${iconClass} text-blue-500`} />;
    }
    
    // Snow
    if (conditions.includes('snow')) {
      return <WiDaySnow className={`${iconClass} text-blue-400`} />;
    }
    
    // Fog
    if (conditions.includes('fog') || conditions.includes('mist')) {
      return <WiFog className={`${iconClass} text-gray-500`} />;
    }
    
    // Cloudy conditions
    if (clouds > 70 || conditions.includes('overcast') || conditions.includes('mostly cloudy')) {
      return <WiCloudy className={`${iconClass} text-gray-600`} />;
    }
    if (clouds > 40 || conditions.includes('partly cloudy') || conditions.includes('cloudy')) {
      return <WiDayCloudy className={`${iconClass} text-gray-600`} />;
    }
    
    // Clear/Sunny
    return <WiDaySunny className={`${iconClass} text-orange-500`} />;
  };

  return (
    <div className="flex items-center justify-center">
      {getDetailedWeatherIcon()}
    </div>
  );
};

export default WeatherIcon;
