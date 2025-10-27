/**
 * Application Context for Global State Management
 * Provides scroll progress and loading states to components without props drilling
 */

import { createContext, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';

// Create contexts
const ScrollContext = createContext();
const LoadingContext = createContext();

/**
 * Hook to access scroll context
 */
export const useScrollContext = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScrollContext must be used within a ScrollProvider');
  }
  return context;
};

/**
 * Hook to access loading context
 */
export const useLoadingContext = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
};

/**
 * Combined Application Context Provider
 * Wraps both scroll and loading contexts for convenience
 */
export const AppProvider = ({ children, scrollProgress, isLoading, error }) => {
  const scrollValue = useMemo(() => ({ scrollProgress }), [scrollProgress]);
  const loadingValue = useMemo(() => ({ isLoading, error }), [isLoading, error]);

  return (
    <ScrollContext.Provider value={scrollValue}>
      <LoadingContext.Provider value={loadingValue}>
        {children}
      </LoadingContext.Provider>
    </ScrollContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
  scrollProgress: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string
};
