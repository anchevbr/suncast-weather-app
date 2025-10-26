import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";
import LocationAutocomplete from './components/LocationAutocomplete';
import { fetchForecastData } from './services/apiService';
import SunsetForecast from "./SunsetForecast";
import Sun from './components/scene/Sun';
import Mountains from './components/scene/Mountains';
import { getBackgroundGradient } from './utils/backgroundGradient';
import { reverseGeocode } from './utils/geocoding';
import { ERROR_MESSAGES } from './constants/errors';

// Animation timing constants
const ANIMATION_CONSTANTS = {
  SCROLL_DURATION: 3000,      // 5 seconds for auto-scroll animation
  START_DELAY: 100,           // Delay before starting animation
  SNAP_BACK_DELAY: 1000,      // Delay to prevent scroll snap-back
};

const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const containerRef = useRef(null);
  const rafRef = useRef(null); // RequestAnimationFrame reference for smooth updates
  const isAutoScrollingRef = useRef(false); // Track if auto-scroll is active (using ref to avoid closure issues)

  // Track horizontal scroll - update progress ONLY for manual scrolling
  useEffect(() => {
    const handleScroll = () => {
      // Ignore scroll events during auto-scroll animation (using ref to check current value)
      if (isAutoScrollingRef.current) {
        return;
      }
      
      // Cancel any pending RAF to avoid multiple updates per frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      // Use RAF to batch updates with browser repaint
      rafRef.current = requestAnimationFrame(() => {
        if (containerRef.current) {
          const scrollLeft = containerRef.current.scrollLeft;
          const maxScroll = containerRef.current.scrollWidth - containerRef.current.clientWidth;
          const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
          
          setScrollProgress(progress);
          
          // Ensure scroll snap is enabled for manual scrolling
          if (containerRef.current && containerRef.current.style.scrollSnapType !== 'x mandatory') {
            containerRef.current.style.scrollSnapType = 'x mandatory';
          }
        }
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }
  }, []); // Empty deps - only set up once, uses ref to check auto-scroll state

  // Auto-scroll to forecast when ALL data is loaded (5 second smooth animation)
  // OPTIMIZED: Throttle state updates to reduce re-renders
  useEffect(() => {
    if (forecast && isDataLoaded && containerRef.current) {
      let animationId = null; // Move to useEffect scope so cleanup can access it
      
      // Small delay to ensure DOM is ready and forecast section is positioned
      const startAnimation = () => {
        const container = containerRef.current;
        const targetScroll = window.innerWidth; // Scroll one viewport width to the right
        const startScroll = container.scrollLeft;
        const distance = targetScroll - startScroll;
        
        const duration = ANIMATION_CONSTANTS.SCROLL_DURATION;
        let startTime = null;

        // Enable auto-scroll mode (using ref to avoid re-renders)
        isAutoScrollingRef.current = true;
        
        // Temporarily disable scroll snap during animation
        disableScrollSnap();

        const animateScroll = (currentTime) => {
          // Start timer on first actual scroll movement, not on first frame call
          if (!startTime) {
            startTime = currentTime;
            // First frame just initializes, actual movement starts next frame
            animationId = requestAnimationFrame(animateScroll);
            return;
          }
          
          const timeElapsed = currentTime - startTime;
          const animProgress = Math.min(timeElapsed / duration, 1);
          
          // After Effects-style smooth ease-in-ease-out curve
          const easeInOutCubic = animProgress < 0.5
            ? 4 * animProgress * animProgress * animProgress
            : 1 - Math.pow(-2 * animProgress + 2, 3) / 2;
          
          // Update scroll position EVERY frame for perfect smoothness
          const newScrollLeft = startScroll + distance * easeInOutCubic;
          container.scrollLeft = newScrollLeft;
          
          
          // Calculate scrollProgress the SAME WAY as manual scroll
          const maxScroll = container.scrollWidth - container.clientWidth;
          const progress = maxScroll > 0 ? newScrollLeft / maxScroll : 0;
          setScrollProgress(progress);
          
          
          if (animProgress < 1) {
            animationId = requestAnimationFrame(animateScroll);
          } else {
            // Animation completed - disable auto-scroll mode and stop loading
            // Re-enable scroll snap after animation
            enableScrollSnap();
            
            // Add longer delay to prevent scroll snap-back events
            setTimeout(() => {
              isAutoScrollingRef.current = false;
            }, ANIMATION_CONSTANTS.SNAP_BACK_DELAY);
            
            setIsLoading(false);
          }
        };

        // Start the animation
        animationId = requestAnimationFrame(animateScroll);
      };

      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(startAnimation, ANIMATION_CONSTANTS.START_DELAY);

    return () => {
        clearTimeout(timeoutId);
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        isAutoScrollingRef.current = false;
      };
    }
  }, [forecast, isDataLoaded]);

  // Helper functions for scroll snap management
  const enableScrollSnap = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.style.scrollSnapType = 'x mandatory';
    }
  }, []);

  const disableScrollSnap = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.style.scrollSnapType = 'none';
    }
  }, []);

  /**
   * Handle location selection from autocomplete
   */
  const handleLocationSelect = async (locationData) => {
    setIsLoading(true);
    setError(null);
    
    // Ensure scroll snap is enabled for new search
    enableScrollSnap();

    try {
      // Use coordinates directly from the selected location
      const coords = {
        latitude: parseFloat(locationData.lat),
        longitude: parseFloat(locationData.lon),
        name: locationData.display_name.split(',')[0],
        country: locationData.country || 'Unknown'
      };

      const locationName = `${coords.name}, ${coords.country}`;
      const forecastData = await fetchForecastData(`${coords.latitude}, ${coords.longitude}`, locationName);

      // Create new forecast object to ensure React detects the change
      const newForecast = {
        location: locationName,
        latitude: forecastData.latitude,
        longitude: forecastData.longitude,
        days: [...forecastData.days]
      };

      setForecast(newForecast);
      setIsDataLoaded(false); // Reset for new location
      // Keep loading until ALL data is loaded (forecast + historical)
      // setIsLoading(false) will be called when onDataLoaded is triggered
    } catch (error) {
      setError(ERROR_MESSAGES.FORECAST_FETCH_FAILED);
      setIsLoading(false); // Stop loading on error
    }
  };



  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      
      // Ensure scroll snap is enabled for new search
      enableScrollSnap();
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const locationName = await reverseGeocode(latitude, longitude);
            const forecastData = await fetchForecastData(`${latitude}, ${longitude}`, locationName);
            
            const newForecast = {
              location: locationName,
              latitude: forecastData.latitude,
              longitude: forecastData.longitude,
              days: [...forecastData.days]
            };

            setForecast(newForecast);
            setIsDataLoaded(false);
          } catch (error) {
            setError(ERROR_MESSAGES.FORECAST_FETCH_FAILED);
            setIsLoading(false);
          }
        },
        (error) => {
          setError(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
          setIsLoading(false);
        }
      );
    } else {
      setError(ERROR_MESSAGES.LOCATION_NOT_SUPPORTED);
    }
  };

  const handleBackToSearch = useCallback(() => {
    if (containerRef.current) {
      // Re-enable scroll snap for smooth back navigation
      enableScrollSnap();
      
      containerRef.current.scrollTo({
        left: 0,
        behavior: 'smooth'
      });
    }
    isAutoScrollingRef.current = false;
  }, [enableScrollSnap]);

  // Memoized callback for onDataLoaded to prevent re-renders
  const handleDataLoaded = useCallback(() => {
    setIsDataLoaded(true);
  }, []);

  // Memoize background gradient calculation (only recalculate when scrollProgress changes)
  const backgroundGradient = useMemo(() => {
    return getBackgroundGradient(scrollProgress);
  }, [scrollProgress]);

  return (
    <>
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
          filter: `blur(${scrollProgress <= 0.1 ? scrollProgress * 150 : Math.max(0, 15 - (scrollProgress - 0.1) * 150)}px)`,
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
                onLocationSelect={handleLocationSelect}
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
                      onClick={handleGetCurrentLocation}
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
            scrollProgress={scrollProgress}
            onBack={handleBackToSearch}
            onDataLoaded={handleDataLoaded}
          />
        )}
      </div>
    </div>

    {/* Fixed positioned elements outside scrollable container */}
    {/* Animated Sun - sets behind mountains as you scroll right */}
    <Sun scrollProgress={scrollProgress} />
  </>
  );
};

export default Home;