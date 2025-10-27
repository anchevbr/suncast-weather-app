import React, { useState, useRef, useMemo, useCallback } from "react";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import LocationAutocomplete from './components/LocationAutocomplete';
import SunsetForecast from "./SunsetForecast";
import Sun from './components/scene/Sun';
import Mountains from './components/scene/Mountains';
import { getBackgroundGradient } from './utils/backgroundGradient';
import { useScrollAnimation } from './hooks/useScrollAnimation';
import { useLocationHandling } from './hooks/useLocationHandling';
import { VISUAL_CONSTANTS } from './constants/app';
import { AppProvider } from './contexts/AppContext.jsx';

const Home = () => {
  const [forecast, setForecast] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const containerRef = useRef(null);

  // Get location handling first to have setIsLoading available
  const { 
    isLoading, 
    error, 
    handleLocationSelect, 
    handleGetCurrentLocation,
    setIsLoading,
    setError 
  } = useLocationHandling();

  // Use custom hooks for scroll animation and location handling
  const { scrollProgress, handleBackToSearch, enableScrollSnap } = useScrollAnimation(
    containerRef, 
    forecast, 
    isDataLoaded,
    () => setIsLoading(false) // Callback to stop loading when animation completes
  );

  // Handle location selection with forecast setting
  const onLocationSelect = useCallback(async (locationData) => {
    try {
      const result = await handleLocationSelect(locationData, enableScrollSnap);
      setForecast(result.forecast);
      setIsDataLoaded(false); // Reset for new location
    } catch (error) {
      // Error already handled in hook
    }
  }, [handleLocationSelect, enableScrollSnap]);

  // Handle current location with forecast setting
  const onGetCurrentLocation = useCallback(async () => {
    try {
      const result = await handleGetCurrentLocation(enableScrollSnap);
      setForecast(result.forecast);
      setIsDataLoaded(false);
    } catch (error) {
      // Error already handled in hook
    }
  }, [handleGetCurrentLocation, enableScrollSnap]);

  // Memoized callback for onDataLoaded to prevent re-renders
  const handleDataLoaded = useCallback(() => {
    setIsDataLoaded(true);
  }, []);

  // Memoize background gradient calculation (only recalculate when scrollProgress changes)
  const backgroundGradient = useMemo(() => {
    return getBackgroundGradient(scrollProgress);
  }, [scrollProgress]);

  return (
    <AppProvider scrollProgress={scrollProgress} isLoading={isLoading} error={error}>
      <div 
        ref={containerRef}
        className="relative h-screen overflow-x-auto overflow-y-hidden flex horizontal-scroll-container"
        style={{ 
          scrollSnapType: 'x mandatory',
          background: backgroundGradient,
          willChange: 'background',
          margin: 0,
          padding: 0
        }}
      >

      {/* Hero Section - OPTIMIZED: Use CSS variables for better performance */}
      <div 
        className="min-w-full h-screen flex items-center justify-center relative overflow-hidden snap-start flex-shrink-0"
        style={{ 
          // Smooth blur transition: 0px at 0%, gradually to 15px at 10%, then fade back to 0px
          // Using exponential curve for more natural fade
          filter: `blur(${scrollProgress <= 0.1 ? scrollProgress * VISUAL_CONSTANTS.BLUR_MULTIPLIER : Math.max(0, 15 - (scrollProgress - 0.1) * VISUAL_CONSTANTS.BLUR_MULTIPLIER)}px)`,
          willChange: 'filter' // GPU acceleration hint
        }}
      >
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 z-40 relative w-full max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ 
              opacity: Math.max(0, 1 - scrollProgress * 10),
              y: 0 
            }}
            transition={{ duration: 0, ease: "linear" }}
            className="w-full max-w-xl mx-auto text-center space-y-6 sm:space-y-8 md:space-y-10"
          >
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center space-y-2">
                <h1 
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-wide bg-gradient-to-r from-orange-400 via-pink-500 to-red-500 bg-clip-text text-transparent" 
                  style={{ letterSpacing: '-0.02em' }}
                >
                  Golden Hour
                </h1>
                <p 
                  className="text-xs sm:text-sm md:text-base text-white/80 font-normal max-w-md mx-auto leading-relaxed px-4"
                >
                  Will tonight's sunset be spectacular?
                </p>
              </div>
            </div>

            {/* Minimal Search Interface */}
            <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
              <LocationAutocomplete
                onLocationSelect={onLocationSelect}
                placeholder="Enter location..."
              />
              
              <div className="flex items-center justify-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-white/70">
                <motion.div
                  key={isLoading ? 'loading' : 'button'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center"
                >
                  {!isLoading ? (
                    <motion.button
                      onClick={onGetCurrentLocation}
                      className="flex items-center space-x-1 sm:space-x-2 hover:text-white transition-colors duration-200"
                      aria-label="Use current location"
                      whileHover={{ 
                        scale: 1.05, 
                        y: -2,
                        transition: { type: "spring", stiffness: 400, damping: 17 }
                      }}
                      whileTap={{ 
                        scale: 0.95,
                        transition: { type: "spring", stiffness: 400, damping: 17 }
                      }}
                    >
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Use current location</span>
                    </motion.button>
                  ) : (
                    <div className="text-sm font-medium bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
                      Loading data...
                    </div>
                  )}
                </motion.div>
              </div>
            </div>


            {error && (
              <div 
                id="error-message"
                role="alert"
                className="p-4 bg-red-100 border-2 border-red-400 rounded-xl text-red-800 text-sm"
              >
                {error}
              </div>
            )}
          </motion.div>
        </div>
        </div>

      {/* Mountain silhouettes - scrolls with horizontal navigation */}
      <Mountains />

      {/* Results Section - Always present in DOM for smooth scrolling */}
      <div 
        className="min-w-full h-screen snap-start flex-shrink-0"
        style={{
          opacity: (forecast && isDataLoaded) ? 1 : 0,
          pointerEvents: (forecast && isDataLoaded) ? 'auto' : 'none'
        }}
      >
        {forecast && (
          <SunsetForecast 
            forecast={forecast}
            onBack={handleBackToSearch}
            onDataLoaded={handleDataLoaded}
          />
        )}
      </div>

      {/* Fixed positioned elements outside scrollable container */}
      {/* Animated Sun - sets behind mountains as you scroll right */}
      <Sun scrollProgress={scrollProgress} />
    </div>
    </AppProvider>
  );
};

export default Home;