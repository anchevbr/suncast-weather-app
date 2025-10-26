# Scientific Sunset Quality Prediction System

## Overview
This system uses **real atmospheric data** from Open-Meteo to provide scientifically accurate sunset quality predictions based on cloud altitude, atmospheric conditions, and meteorological factors.

## Scientific Foundation

### Cloud Altitude Effects on Sunset Quality
Based on atmospheric optics research:

- **High Clouds (>8km)**: Optimal for vibrant sunset colors
  - Cirrus and cirrostratus clouds scatter sunlight at the perfect angle
  - Create intense reds, oranges, and purples
  - 25-50% coverage provides maximum color intensity

- **Mid-Level Clouds (3-8km)**: Good for layered color effects
  - Altocumulus and altostratus provide moderate enhancement
  - Create beautiful layered sunset effects
  - 20-40% coverage is optimal

- **Low Clouds (0-3km)**: Often problematic for colors
  - Stratus and cumulus clouds typically block sunlight
  - Can create dramatic silhouettes but reduce color vibrancy
  - Heavy coverage (>60%) significantly reduces sunset quality

### Atmospheric Factors
- **Precipitation**: Severely impacts sunset quality by blocking sunlight
- **Humidity**: 40-70% optimal for color intensity through atmospheric scattering
- **Air Quality**: Clean air (AQI ≤50) provides purer colors
- **Visibility**: Higher visibility (>15km) enhances sunset clarity

## Scoring Algorithm

### Cloud Altitude Scoring (40% of total score)
- **High Clouds**: Up to 40 points for optimal coverage (25-50%)
- **Mid-Level Clouds**: Up to 20 points for good coverage (20-40%)
- **Low Clouds**: Penalties for heavy coverage, bonuses for light coverage
- **Clear Skies**: 15-point bonus when all levels <5%

### Atmospheric Conditions (35% of total score)
- **Precipitation**: Up to -30 points for heavy precipitation
- **Humidity**: Up to +15 points for optimal range (40-70%)
- **Air Quality**: Up to +15 points for excellent air quality (AQI ≤25)
- **Visibility**: Up to +10 points for excellent visibility (>20km)

### Optimal Conditions Bonus (25% of total score)
- **Perfect Conditions**: +25 points for optimal high clouds + minimal low clouds + low precipitation + good air quality + good visibility
- **Very Good Conditions**: +15 points for optimal high clouds + minimal low clouds + low precipitation
- **Good Conditions**: +10 points for good mid-level clouds + minimal low clouds + low precipitation

## Data Sources

### Open-Meteo API
- **Cloud Cover Low**: 0-3km altitude clouds
- **Cloud Cover Mid**: 3-8km altitude clouds  
- **Cloud Cover High**: >8km altitude clouds
- **Total Cloud Cover**: Complete sky coverage
- **Precipitation Probability**: Rain/snow chance
- **Humidity**: Relative humidity percentage
- **Air Quality Index**: Air pollution levels
- **Visibility**: Atmospheric visibility in meters

## Score Interpretation

| Score Range | Condition | Description |
|-------------|-----------|-------------|
| 85-100 | Spectacular | Perfect atmospheric conditions with optimal high clouds |
| 70-84 | Excellent | Very good conditions with high clouds and minimal low clouds |
| 55-69 | Good | Good conditions with mid-level clouds or light high clouds |
| 35-54 | Fair | Moderate conditions with some cloud coverage |
| 15-34 | Poor | Heavy low clouds or poor atmospheric conditions |
| 0-14 | Very Poor | Heavy precipitation or very poor visibility |

## Technical Implementation

### Unified Scoring System
Both **forecast** and **historical** data use the exact same scientific scoring algorithm:

```javascript
export const getSunsetQualityScore = (weather) => {
  // Extract cloud cover by altitude
  const cloudCoverageLow = weather.cloud_coverage_low || 0;
  const cloudCoverageMid = weather.cloud_coverage_mid || 0;
  const cloudCoverageHigh = weather.cloud_coverage_high || 0;
  
  // Scientific scoring based on atmospheric optics
  // ... scoring logic
}
```

### API Integration
```javascript
// Open-Meteo API call includes cloud altitude data
hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high
```

### Data Consistency
- **Forecast Data**: Uses same scoring algorithm for 7-day predictions
- **Historical Data**: Uses same scoring algorithm for past year analysis
- **Top 10 Sunsets**: Ranked using identical scientific criteria
- **Statistics**: Calculated from same scoring methodology

## Benefits

1. **Scientifically Accurate**: Based on atmospheric optics research
2. **Real Data**: Uses actual cloud altitude measurements from Open-Meteo
3. **Comprehensive**: Considers all major atmospheric factors
4. **Consistent**: Same scoring for forecast and historical data
5. **Reliable**: Consistent scoring across different locations and seasons
6. **Free**: No additional API costs beyond Open-Meteo

## Expected Results

- **High-level cloud days**: 60-90+ points (Spectacular/Excellent)
- **Mid-level cloud days**: 40-70 points (Good/Fair)
- **Low-level cloud days**: 20-50 points (Fair/Poor)
- **Clear sky days**: 30-60 points (Fair/Good)

The system now provides accurate, science-based sunset predictions using real atmospheric data for both forecasts and historical analysis! 🌅
