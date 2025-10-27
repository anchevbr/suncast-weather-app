import { memo } from "react";
import PropTypes from 'prop-types';
import { Card } from "./components/ui/card";
import { Sun } from "lucide-react";
import WeatherIcon from "./components/weather/WeatherIcon";
import { getScoreColors } from "./utils/colorPalette";

const DayCard = memo(({ day }) => {
  const scoreColors = getScoreColors(day.sunset_score);

  return (
    <div
      role="listitem"
      className="relative z-10"
    >
      <Card className="relative bg-white/60 backdrop-blur-sm border-0 shadow-lg rounded-xl sm:rounded-2xl overflow-hidden">
        <div className="p-2 sm:p-3 flex flex-col items-center space-y-1.5 sm:space-y-2">
          {/* Date Header - More Compact */}
          <div className="text-center pb-1 border-b border-gray-200 min-h-[32px] sm:min-h-[40px] flex flex-col justify-center w-full">
            <p 
              className="text-gray-700 text-[11px] sm:text-xs font-semibold uppercase tracking-wider"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {day.day_of_week}
            </p>
            <p 
              className="text-gray-600 text-[10px] sm:text-xs font-light mt-0.5 sm:mt-1"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {day.date}
            </p>
          </div>

          {/* Score Circle - More Compact */}
          <div className="flex flex-col items-center justify-center py-1 min-h-[60px] sm:min-h-[80px]">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${scoreColors.bg} flex items-center justify-center shadow-md`}>
              <span 
                className={`text-lg sm:text-xl font-black ${scoreColors.text}`}
                style={{ fontFamily: "'Inter', sans-serif" }}
                aria-label={`Sunset quality score: ${day.sunset_score} out of 100`}
              >
                {day.sunset_score}
              </span>
            </div>
            <p 
              className="text-[10px] sm:text-xs font-medium text-gray-700 text-center mt-1"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {scoreColors.label}
            </p>
          </div>

          {/* Weather Icon - More Compact */}
          <div className="min-h-[32px] sm:min-h-[40px] flex items-center justify-center">
            <WeatherIcon day={day} />
          </div>

          {/* Sunset Time */}
          <div className="flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 w-3/4 mx-auto">
            <Sun className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white flex-shrink-0" aria-hidden="true" />
            <span 
              className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {day.sunset_time}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
});

DayCard.displayName = 'DayCard';

DayCard.propTypes = {
  day: PropTypes.shape({
    sunset_score: PropTypes.number.isRequired,
    sunset_time: PropTypes.string.isRequired,
    day_of_week: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    weather_code: PropTypes.number,
    temperature_max: PropTypes.number,
    temperature_min: PropTypes.number,
    sunset: PropTypes.string,
    sunrise: PropTypes.string,
    conditions: PropTypes.string,
    cloud_coverage: PropTypes.number,
    humidity: PropTypes.number,
    precipitation_chance: PropTypes.number,
    visibility: PropTypes.number,
    wind_speed: PropTypes.number
  }).isRequired
};

export default DayCard;