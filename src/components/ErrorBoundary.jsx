import React from 'react';
import PropTypes from 'prop-types';

/**
 * Enhanced Error Boundary Component
 * Catches and handles React component errors gracefully with better UX
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Enhanced error logging
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Store error info for debugging
    this.setState({ errorInfo });
    
    // Log to external service in production (if available)
    if (process.env.NODE_ENV === 'production') {
      // Could integrate with error tracking service here
      console.log('Production error logged:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { retryCount } = this.state;
      const isRetryLimitReached = retryCount >= 3;
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-md mx-4 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                We're sorry for the inconvenience. {isRetryLimitReached ? 'Please refresh the page.' : 'You can try again or refresh the page.'}
              </p>
              {retryCount > 0 && (
                <p className="text-sm text-gray-500 mb-4">
                  Retry attempts: {retryCount}/3
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              {!isRetryLimitReached && (
                <button
                  onClick={this.handleRetry}
                  className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={this.handleReload}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all duration-200"
              >
                Refresh Page
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default ErrorBoundary;

