import React, { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LocationAutocomplete from './components/LocationAutocomplete';
import { fetchForecastData } from './services/apiService';
import SunsetForecast from "./SunsetForecast";
import { Loader2 } from "lucide-react";

const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const containerRef = useRef(null);
  const rafRef = useRef(null); // RequestAnimationFrame reference for smooth updates

  // Track horizontal scroll - update progress on every scroll (manual or auto)
  useEffect(() => {
    const handleScroll = () => {
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
  }, []);

  // Auto-scroll to forecast when ALL data is loaded (2 second smooth animation)
  useEffect(() => {
    if (forecast && isDataLoaded && containerRef.current) {
      
      const container = containerRef.current;
      const targetScroll = window.innerWidth;
      const startScroll = container.scrollLeft;
      const distance = targetScroll - startScroll;
      const duration = 2500; // 2.5 seconds for smoother feel
      let startTime = null;
      let animationId = null;

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
        
        // Smooth easing function
        const easeInOutQuad = animProgress < 0.5
          ? 2 * animProgress * animProgress
          : 1 - Math.pow(-2 * animProgress + 2, 2) / 2;
        
        // Update scroll position - this triggers scroll event which updates scrollProgress state
        container.scrollLeft = startScroll + distance * easeInOutQuad;
        
        if (animProgress < 1) {
          animationId = requestAnimationFrame(animateScroll);
        } else {
          // Animation completed - stop loading
          setIsLoading(false);
        }
      };

      // Start immediately when data is loaded
      animationId = requestAnimationFrame(animateScroll);

      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }
  }, [forecast, isDataLoaded]);

  /**
   * Handle location selection from autocomplete
   */
  const handleLocationSelect = async (locationData) => {
    setIsLoading(true);
    setError(null);

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
      setError('Unable to fetch forecast data. Please try again.');
      setIsLoading(false); // Stop loading on error
    }
  };



  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // First, get the city name from coordinates using reverse geocoding
            const geocodingResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18&email=your-email@example.com`
            );
            
            if (!geocodingResponse.ok) {
              throw new Error('Failed to get location name');
            }
            
            const locationData = await geocodingResponse.json();
            
            // Extract city name more reliably
            let cityName = 'Unknown Location';
            let countryName = '';
            
            if (locationData.address) {
              const addr = locationData.address;
              cityName = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || addr.county || 'Unknown';
              countryName = addr.country || '';
            } else if (locationData.display_name) {
              // Fallback to parsing display_name
              const parts = locationData.display_name.split(',');
              cityName = parts[0].trim();
              countryName = parts[parts.length - 1].trim();
            }

            const locationName = countryName ? `${cityName}, ${countryName}` : cityName;
            const forecastData = await fetchForecastData(`${latitude}, ${longitude}`, locationName);
            
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
            setError('Unable to fetch forecast data. Please try again.');
            setIsLoading(false); // Stop loading on error
          }
        },
        (error) => {
          setError("Unable to get your location. Please search manually.");
          setIsLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const handleBackToSearch = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: 0,
        behavior: 'smooth'
      });
    }
  };

  // Calculate gradient colors based on scroll progress
  const getBackgroundGradient = () => {
    // Daylight colors (0% scroll)
    const daylight = {
      top: '#4a90e2',
      mid1: '#5fa3e8',
      mid2: '#7ab8ee',
      bottom: '#a4d4f4'
    };
    
    // Sunset colors (100% scroll)
    const sunset = {
      top: '#1a1a2e',
      mid1: '#d4507a',
      mid2: '#ff8c42',
      bottom: '#ffb347'
    };

    // Interpolate colors
    const interpolate = (color1, color2, factor) => {
      const hex1 = color1.replace('#', '');
      const hex2 = color2.replace('#', '');
      const r1 = parseInt(hex1.substring(0, 2), 16);
      const g1 = parseInt(hex1.substring(2, 4), 16);
      const b1 = parseInt(hex1.substring(4, 6), 16);
      const r2 = parseInt(hex2.substring(0, 2), 16);
      const g2 = parseInt(hex2.substring(2, 4), 16);
      const b2 = parseInt(hex2.substring(4, 6), 16);
      const r = Math.round(r1 + (r2 - r1) * factor);
      const g = Math.round(g1 + (g2 - g1) * factor);
      const b = Math.round(b1 + (b2 - b1) * factor);
      return `rgb(${r}, ${g}, ${b})`;
    };

    const topColor = interpolate(daylight.top, sunset.top, scrollProgress);
    const mid1Color = interpolate(daylight.mid1, sunset.mid1, scrollProgress);
    const mid2Color = interpolate(daylight.mid2, sunset.mid2, scrollProgress);
    const bottomColor = interpolate(daylight.bottom, sunset.bottom, scrollProgress);

    return `linear-gradient(to bottom, ${topColor} 0%, ${mid1Color} 33%, ${mid2Color} 66%, ${bottomColor} 100%)`;
  };

  return (
      <div 
      ref={containerRef}
      className="relative h-screen overflow-x-auto overflow-y-hidden flex"
      style={{ 
        scrollBehavior: 'smooth',
        scrollSnapType: 'x mandatory',
        background: getBackgroundGradient(),
        willChange: 'background'
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        
        /* Custom scrollbar for horizontal scroll */
        .relative.h-screen.overflow-x-auto::-webkit-scrollbar {
          height: 8px;
        }
        .relative.h-screen.overflow-x-auto::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        .relative.h-screen.overflow-x-auto::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        .relative.h-screen.overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        
        body {
          overscroll-behavior: none;
        }
      `}</style>

      {/* Hero Section */}
      <div className="min-w-full h-screen flex items-center justify-center relative overflow-hidden snap-start flex-shrink-0">
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 z-40 relative w-full max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-xl mx-auto text-center space-y-6 sm:space-y-8 md:space-y-10"
          >
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-wide bg-gradient-to-r from-blue-200 via-yellow-200 to-orange-300 bg-clip-text text-transparent" style={{ animation: 'pulse 4s ease-in-out infinite' }}>
                  Golden Hour
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-white/80 font-normal max-w-md mx-auto leading-relaxed px-4">
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
              
              {!isLoading ? (
                <div className="flex items-center justify-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-white/70">
                  <button
                    onClick={handleGetCurrentLocation}
                    className="flex items-center space-x-1 sm:space-x-2 hover:text-white transition-colors duration-200"
                    aria-label="Use current location"
                  >
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Use current location</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <div className="text-sm font-medium bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
                    Loading data...
                  </div>
                </div>
              )}
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

      {/* Animated Sun - sets behind mountains as you scroll right (fixed position, only moves down) */}
      <div
        className="fixed pointer-events-none z-20"
        style={{
          left: '10%',
          top: `${20 + scrollProgress * 65}vh`,
          opacity: 1 - scrollProgress * 0.4,
          transition: 'none', // No CSS transitions - driven by scroll
          willChange: 'top, opacity',
          transform: 'translateZ(0)' // GPU acceleration
        }}
      >
          <div className="relative" style={{ width: 'clamp(80px, 12vw, 140px)', height: 'clamp(80px, 12vw, 140px)' }}>
            {/* Extreme overexposed sun with no visible edge */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.98) 10%, rgba(255, 255, 255, 0.95) 20%, rgba(255, 255, 255, 0.9) 30%, rgba(255, 255, 255, 0.8) 40%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0.5) 60%, rgba(255, 255, 255, 0.3) 70%, rgba(255, 255, 255, 0.15) 80%, rgba(255, 255, 255, 0.08) 90%, rgba(255, 255, 255, 0.03) 95%, rgba(255, 255, 255, 0.01) 98%, transparent 100%)',
                filter: 'blur(8px)',
              }}
            />
        </div>
      </div>

      {/* Mountain silhouettes - scrolls with horizontal navigation, extended to cover all sections */}
      <div className="absolute bottom-0 left-0 pointer-events-none z-30" style={{ width: '200vw', height: 'clamp(12rem, 30vh, 32rem)' }}>
        {/* Back mountain layer - solid */}
        <div 
          className="absolute bottom-0 left-0 h-full"
          style={{
            width: '200vw',
            background: '#1a2332',
            clipPath: 'polygon(0 100%, 0 70%, 5% 80%, 10% 60%, 17.5% 85%, 25% 70%, 32.5% 90%, 40% 75%, 45% 90%, 50% 70%, 55% 85%, 60% 65%, 70% 85%, 75% 75%, 82% 88%, 90% 78%, 95% 85%, 100% 72%, 100% 100%)'
          }}
        ></div>
        
        {/* Middle mountain layer - solid */}
        <div 
          className="absolute bottom-0 left-0 h-full"
          style={{
            width: '200vw',
            background: '#0d1419',
            clipPath: 'polygon(0 100%, 0 85%, 7.5% 95%, 15% 75%, 22.5% 90%, 30% 80%, 37.5% 95%, 45% 80%, 50% 85%, 57% 78%, 65% 92%, 72% 82%, 80% 88%, 87% 80%, 95% 90%, 100% 85%, 100% 100%)'
          }}
        ></div>
        
        {/* Front mountain layer - solid */}
        <div 
          className="absolute bottom-0 left-0 h-full"
          style={{
            width: '200vw',
            background: '#050a0d',
            clipPath: 'polygon(0 100%, 0 90%, 6% 98%, 12.5% 88%, 20% 95%, 27.5% 85%, 35% 92%, 42.5% 87%, 50% 90%, 57% 86%, 65% 94%, 72% 88%, 80% 93%, 87% 89%, 95% 92%, 100% 90%, 100% 100%)'
          }}
        ></div>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {forecast && (
          <div className="min-w-full h-screen snap-start flex-shrink-0">
            <SunsetForecast 
              forecast={forecast} 
              onBack={handleBackToSearch}
              onDataLoaded={() => {
                setIsDataLoaded(true);
                // Loading will stop when auto-scroll animation completes
              }} 
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;