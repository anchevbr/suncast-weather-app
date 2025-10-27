import { useState, useRef, useEffect, useCallback } from 'react';
import { ANIMATION_CONSTANTS } from '../constants/app';

/**
 * Custom hook for managing scroll animation and progress
 * Extracts complex scroll logic from Home component
 */
export const useScrollAnimation = (containerRef, forecast, isDataLoaded, onAnimationComplete) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafRef = useRef(null);
  const isAutoScrollingRef = useRef(false);

  // Track horizontal scroll - update progress ONLY for manual scrolling
  useEffect(() => {
    const handleScroll = () => {
      // Ignore scroll events during auto-scroll animation
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
  }, [containerRef]);

  // Helper functions for scroll snap management
  const enableScrollSnap = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.style.scrollSnapType = 'x mandatory';
    }
  }, [containerRef]);

  const disableScrollSnap = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.style.scrollSnapType = 'none';
    }
  }, [containerRef]);

  // Auto-scroll to forecast when ALL data is loaded (3 second smooth animation)
  useEffect(() => {
    if (forecast && isDataLoaded && containerRef.current) {
      let animationId = null;
      
      // Small delay to ensure DOM is ready and forecast section is positioned
      const startAnimation = () => {
        const container = containerRef.current;
        const targetScroll = window.innerWidth; // Scroll one viewport width to the right
        const startScroll = container.scrollLeft;
        const distance = targetScroll - startScroll;
        
        const duration = ANIMATION_CONSTANTS.SCROLL_DURATION;
        let startTime = null;

        // Enable auto-scroll mode
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
            
            if (onAnimationComplete) {
              onAnimationComplete();
            }
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
  }, [forecast, isDataLoaded, containerRef, enableScrollSnap, disableScrollSnap]);

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
  }, [containerRef, enableScrollSnap]);

  return {
    scrollProgress,
    handleBackToSearch,
    enableScrollSnap,
    disableScrollSnap
  };
};
