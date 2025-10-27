/**
 * Application Context for Global State Management
 * Provides scroll progress and loading states to components without props drilling
 */

import React, { createContext, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';

// Create contexts
const ScrollContext = createContext();
const LoadingContext = createContext();

/**
 * Scroll Context Provider
 * Manages scroll progress state globally
 */
export const ScrollProvider = ({ children, scrollProgress }) => {
  const value = useMemo(() => ({
    scrollProgress
  }), [scrollProgress]);

  return (
    <ScrollContext.Provider value={value}>
      {children}
    </ScrollContext.Provider>
  );
};

ScrollProvider.propTypes = {
  children: PropTypes.node.isRequired,
  scrollProgress: PropTypes.number.isRequired
};

/**
 * Loading Context Provider
 * Manages loading states globally
 */
export const LoadingProvider = ({ children, isLoading, error }) => {
  const value = useMemo(() => ({
    isLoading,
    error
  }), [isLoading, error]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

LoadingProvider.propTypes = {
  children: PropTypes.node.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string
};

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
  return (
    <ScrollProvider scrollProgress={scrollProgress}>
      <LoadingProvider isLoading={isLoading} error={error}>
        {children}
      </LoadingProvider>
    </ScrollProvider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
  scrollProgress: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string
};
