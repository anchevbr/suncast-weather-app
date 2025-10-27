import React, { memo, useMemo } from "react";
import PropTypes from 'prop-types';
import { Sun, Cloud, CloudRain, CloudSnow, CloudFog, CloudSun, CloudDrizzle } from "lucide-react";

/**
 * WeatherIcon component that displays appropriate weather icon based on conditions
 * Optimized with memo and useMemo to prevent unnecessary re-renders
 * Now using lucide-react for smaller bundle size (~150KB smaller than react-icons)
 * @param {Object} props - Component props
 * @param {Object} props.day - Weather data for the day
 * @returns {JSX.Element} - Weather icon component
 */
const WeatherIcon = memo(({ day }) => {
  // Memoize icon selection to prevent recalculation on every render
  const weatherIcon = useMemo(() => {
    const conditions = day.conditions?.toLowerCase() || '';
    const precip = day.precipitation_chance || 0;
    const clouds = day.cloud_coverage || 0;
    
    const iconSize = "w-8 h-8 sm:w-10 sm:h-10";
    
    // Rain conditions
    if (precip > 70 || conditions.includes('rain') || conditions.includes('shower')) {
      return <CloudRain className={iconSize} strokeWidth={1.5} color="#2563eb" />;
    }
    if (precip > 40 || conditions.includes('drizzle')) {
      return <CloudDrizzle className={iconSize} strokeWidth={1.5} color="#3b82f6" />;
    }
    
    // Snow
    if (conditions.includes('snow')) {
      return <CloudSnow className={iconSize} strokeWidth={1.5} color="#60a5fa" />;
    }
    
    // Fog
    if (conditions.includes('fog') || conditions.includes('mist')) {
      return <CloudFog className={iconSize} strokeWidth={1.5} color="#6b7280" />;
    }
    
    // Cloudy conditions
    if (clouds > 70 || conditions.includes('overcast') || conditions.includes('mostly cloudy')) {
      return <Cloud className={iconSize} strokeWidth={1.5} color="#4b5563" />;
    }
    if (clouds > 40 || conditions.includes('partly cloudy') || conditions.includes('cloudy')) {
      return <CloudSun className={iconSize} strokeWidth={1.5} color="#4b5563" />;
    }
    
    // Clear/Sunny
    return <Sun className={iconSize} strokeWidth={1.5} color="#f97316" />;
  }, [day.conditions, day.precipitation_chance, day.cloud_coverage]);

  return (
    <div className="flex items-center justify-center">
      {weatherIcon}
    </div>
  );
});

WeatherIcon.displayName = 'WeatherIcon';

WeatherIcon.propTypes = {
  day: PropTypes.shape({
    conditions: PropTypes.string,
    precipitation_chance: PropTypes.number,
    cloud_coverage: PropTypes.number
  }).isRequired
};

export default WeatherIcon;
