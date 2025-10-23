import React from "react";
import { motion } from "framer-motion";
import { getHistoricalColors } from "../utils/colorPalette";

const MinimalHistoricalSunsets = ({
  historicalData,
  isLoading
}) => {
  // Show beautiful loading animation
  if (isLoading) {
    return (
      <div className="text-center">
        {/* Animated loading text with gradient */}
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-medium mb-3 relative inline-block"
        >
          <span className="relative">
            <motion.span
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              className="bg-gradient-to-r from-white via-orange-300 via-pink-300 to-white bg-clip-text text-transparent"
              style={{
                backgroundSize: '200% auto'
              }}
            >
              Loading Historical Data
            </motion.span>
          </span>
        </motion.h3>
        
        {/* Container with fixed height matching historical data display */}
        <div className="relative h-[100px]">
          {/* Centered loading animation - no background bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative flex items-center justify-center h-full"
          >
            {/* Animated Progress Bars (decorative) - Smaller and centered */}
            <div className="flex space-x-1 items-center">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scaleY: [0.3, 1, 0.3],
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-4 h-12 bg-gradient-to-t from-orange-400 to-pink-400 rounded"
                  style={{ originY: 1 }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Don't render anything if no data
  if (!historicalData) {
    return null;
  }

  return (
    <div className="text-center">
      {/* Year's Best Sunsets */}
      <div>
        <h3 className="text-xs sm:text-sm font-medium text-white mb-2 sm:mb-3">Year's Best Sunsets</h3>
        <div className="relative flex flex-col">
          {/* Black background bar - perfectly aligned with circles row */}
          <div className="absolute top-0 left-1 sm:left-2 right-1 sm:right-2 h-7 sm:h-8 bg-black/50 rounded-lg z-0"></div>
          {/* Grid with circles aligned to background */}
          <div className="relative z-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1 sm:gap-2 text-[10px] sm:text-xs">
                    {historicalData.top10 && historicalData.top10.map((sunset, index) => {
                      const colors = getHistoricalColors(sunset.score);
                      return (
                      <motion.div
                        key={sunset.date}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center space-y-0.5 sm:space-y-1 px-0.5 sm:px-1"
                      >
                        {/* Circle row - exact h-7/h-8 to match background bar, using flex to center */}
                        <div className="flex items-center justify-center space-x-0.5 sm:space-x-1 h-7 sm:h-8 w-full">
                          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${colors.circle}`}></div>
                          <span className={`text-[10px] sm:text-xs ${colors.text}`}>
                            {sunset.score}
                          </span>
                        </div>
                        <div className="text-white text-[10px] sm:text-xs">
                          {new Date(sunset.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-white text-[10px] sm:text-xs">
                          {sunset.sunset_time ? sunset.sunset_time.split('T')[1]?.split(':').slice(0, 2).join(':') || sunset.sunset_time : '18:30'}
                        </div>
                      </motion.div>
                      );
                    })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalHistoricalSunsets;
