import React, { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { ArrowUp } from "lucide-react";
import { motion } from "framer-motion";
import DayCard from "./DayCard";
import MinimalHistoricalSunsets from "./components/MinimalHistoricalSunsets";
import { fetchHistoricalForecastWithProgress } from "./services/historicalService.js";

const SunsetForecast = ({ forecast, onBack, onDataLoaded }) => {
  const [historicalData, setHistoricalData] = useState(null);
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(true);

  // Auto-load historical data when component mounts
  // Only run once when forecast changes (not on every render)
  useEffect(() => {
    let isCancelled = false; // Prevent state updates if component unmounts
    
    const loadHistoricalData = async () => {
      try {
        const location = {
          latitude: forecast.latitude || 0,
          longitude: forecast.longitude || 0,
          name: forecast.location
        };
        
        const data = await fetchHistoricalForecastWithProgress(
          location, 
          () => {} // Ignore progress updates
        );
        
        if (!isCancelled) {
          setHistoricalData(data);
          setIsLoadingHistorical(false);
          
          // Notify parent that data is loaded
          if (onDataLoaded) {
            onDataLoaded();
          }
        }
      } catch (error) {
        if (!isCancelled) {
          setIsLoadingHistorical(false);
          
          // Still notify parent even on error
          if (onDataLoaded) {
            onDataLoaded();
          }
        }
      }
    };

    loadHistoricalData();
    
    return () => {
      isCancelled = true; // Cleanup: cancel if component unmounts
    };
  }, [forecast.location, forecast.latitude, forecast.longitude]); // Removed onDataLoaded from deps!


  return (
    <div className="relative w-full h-screen overflow-y-auto overflow-x-hidden">
      <div className="relative z-40 flex flex-col items-center justify-start p-3 sm:p-4 md:p-6 lg:p-8 pt-3 sm:pt-4 min-h-screen">
        {/* Back to Search - No background */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2 }}
          className="mb-2"
        >
          <Button
            onClick={onBack}
            className="bg-transparent hover:bg-transparent text-white/90 hover:text-white font-thin transition-all border-none shadow-none flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm p-0"
          >
            <ArrowUp className="w-3 h-3 rotate-[-90deg]" aria-hidden="true" />
            <span>Back to Search</span>
          </Button>
        </motion.div>

        <div className="w-full max-w-7xl space-y-3 sm:space-y-4 backdrop-blur-xl bg-black/30 rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-2xl border border-white/20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2 }}
            className="text-center"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-white drop-shadow-lg">
              {forecast.location}
            </h2>
          </motion.div>

          {/* 7-Day Forecast */}
          <div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4 relative z-10"
            role="list"
            aria-label="7-day sunset forecast"
          >
            {forecast.days.map((day, index) => (
              <DayCard key={index} day={day} index={index} />
            ))}
          </div>

          {/* Historical Sunsets - Fixed height to prevent layout shift */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-3 sm:mt-4 pt-2"
          >
            <MinimalHistoricalSunsets
              historicalData={historicalData}
              isLoading={isLoadingHistorical}
            />
          </motion.div>

          {/* Scoring System & Weather Explanation - Now on bottom */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-3 sm:mt-4 pt-2"
          >
            <div className="flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8">
              {/* Scoring System */}
              <div className="flex flex-col items-center">
                <h3 className="text-xs sm:text-sm font-medium text-white/80 mb-6 sm:mb-8 text-center">Scoring System</h3>
                        <div className="flex items-center justify-center">
                          <div className="relative w-24 sm:w-32 md:w-40 h-2 sm:h-3 rounded-full bg-gradient-to-r from-gray-500 via-amber-500 via-orange-500 via-pink-500 to-rose-500 mt-2">
                            {/* Score markers - removed left and right edges */}
                            <div className="absolute left-1/4 top-0 w-px h-full bg-white/50"></div>
                            <div className="absolute left-1/2 top-0 w-px h-full bg-white/50"></div>
                            <div className="absolute left-3/4 top-0 w-px h-full bg-white/50"></div>

                            {/* Score numbers */}
                            <div className="absolute -top-5 sm:-top-6 left-0 text-white/60 text-[10px] sm:text-xs">0</div>
                            <div className="absolute -top-5 sm:-top-6 left-1/4 transform -translate-x-1/2 text-white/60 text-[10px] sm:text-xs">25</div>
                            <div className="absolute -top-5 sm:-top-6 left-1/2 transform -translate-x-1/2 text-white/60 text-[10px] sm:text-xs">50</div>
                            <div className="absolute -top-5 sm:-top-6 left-3/4 transform -translate-x-1/2 text-white/60 text-[10px] sm:text-xs">75</div>
                            <div className="absolute -top-5 sm:-top-6 right-0 text-white/60 text-[10px] sm:text-xs">100</div>
                          </div>
                        </div>
              </div>

              {/* Visual Separator */}
              <div className="hidden lg:block w-px h-16 bg-white/20"></div>

              {/* Weather Explanation */}
              <div className="flex flex-col items-center max-w-3xl px-4">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-2 text-center">How Weather Affects Sunset</h3>
                <div className="text-center">
                  <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-white/70 leading-tight">
                    Cloud coverage and height dramatically impact sunset quality, with high clouds creating beautiful light scattering effects.
                  </p>
                  <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-white/70 leading-tight mt-0.5">
                    Our algorithm analyzes 12+ weather factors to predict the perfect sunset experience.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SunsetForecast;