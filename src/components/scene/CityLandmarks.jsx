import { memo } from "react";
import PropTypes from 'prop-types';

/**
 * CityLandmarks Component
 * Renders city-specific iconic landmarks as silhouettes behind the mountains
 * Shows different landmarks based on the selected location
 */
const CityLandmarks = memo(({ scrollProgress, location }) => {
  // Calculate horizontal translation for parallax effect
  // Moves slower than mountains to create depth (furthest back layer)
  const landmarkOffset = scrollProgress * -15;  // Slowest parallax (furthest back)
  
  // Sunset glow opacity: fade in as we scroll to sunset screen (scrollProgress 0.5 -> 1.0)
  const glowOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.5) * 2));
  
  // Determine which city landmark to show based on location
  const cityName = location ? location.toLowerCase() : '';
  
  // City detection
  const showEiffelTower = cityName.includes('paris');
  const showParthenon = cityName.includes('athens');
  const showBigBen = cityName.includes('london');
  const showStatueOfLiberty = cityName.includes('new york');
  const showColosseum = cityName.includes('rome');
  const showOperaHouse = cityName.includes('sydney');
  const showGoldenGate = cityName.includes('san francisco');
  const showBurjKhalifa = cityName.includes('dubai');
  const showLeaningTower = cityName.includes('pisa');
  const showTokyoTower = cityName.includes('tokyo');
  
  // Check if any landmark should be shown
  const hasLandmark = showEiffelTower || showParthenon || showBigBen || showStatueOfLiberty || 
      showColosseum || showOperaHouse || showGoldenGate || showBurjKhalifa || 
      showLeaningTower || showTokyoTower;
  
  // Always render the container, conditionally show landmarks
  return (
    <div className="fixed bottom-0 left-0 pointer-events-none z-25" style={{ width: '100vw', height: '100vh' }}>
      {showEiffelTower && (
        <div
          style={{
            position: 'absolute',
            right: '15%',
            bottom: '0',
            width: '300px',
            height: '70vh',
            backgroundImage: 'url(/eiffel-tower.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'bottom center',
            filter: 'brightness(0) saturate(0) contrast(100)',
            opacity: 0.8,
            transform: `translateX(${landmarkOffset}vw)`,
            transition: 'none',
            willChange: 'transform',
          }}
        />
      )}
    </div>
  );
});

CityLandmarks.displayName = 'CityLandmarks';

CityLandmarks.propTypes = {
  scrollProgress: PropTypes.number.isRequired,
  location: PropTypes.string
};

export default CityLandmarks;
