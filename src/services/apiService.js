/**
 * API service for fetching weather data directly from Open-Meteo APIs
 * No caching - direct API calls only
 */

/**
 * Fetch live forecast data from Open-Meteo API
 * @param {string} locationQuery - Location name or coordinates
 * @param {string} customLocationName - Optional custom location name
 * @returns {Promise<Object>} - Complete forecast object
 */
export const fetchForecastData = async (locationQuery, customLocationName = null) => {
  // Step 1: Parse coordinates
  let coords;
  let locationName;
  
  const coordMatch = locationQuery.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (coordMatch) {
    coords = {
      latitude: parseFloat(coordMatch[1]),
      longitude: parseFloat(coordMatch[2]),
      name: customLocationName ? customLocationName.split(',')[0] : 'Current Location',
      country: customLocationName ? customLocationName.split(',').slice(1).join(',').trim() : ''
    };
    locationName = customLocationName || 'Current Location';
  } else {
    throw new Error('Location must be provided as coordinates or through autocomplete');
  }

  // Step 2: Fetch from Open-Meteo API directly
  const url = `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${coords.latitude}&` +
    `longitude=${coords.longitude}&` +
    `daily=weather_code,temperature_2m_max,temperature_2m_min,sunset,sunrise&` +
    `hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,cloud_cover,visibility,wind_speed_10m&` +
    `timezone=auto`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    },
    mode: 'cors',
    credentials: 'omit'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch forecast data: ${response.status}`);
  }
  
  const apiData = await response.json();
  
  // Import the scoring service
  const { getSunsetQualityScore, getCloudTypeFromWeatherCode } = await import('./scoringService.js');
  
  // Process the data to match expected format with scoring
  const days = [];
  for (let i = 0; i < apiData.daily.time.length; i++) {
    // Get hourly data for this day (24 hours starting from 00:00)
    const startHour = i * 24;
    const endHour = startHour + 24;
    
    // Calculate average values for the day
    const hourlyData = apiData.hourly;
    const dayHours = {
      temperature: hourlyData.temperature_2m.slice(startHour, endHour),
      humidity: hourlyData.relative_humidity_2m.slice(startHour, endHour),
      precipitation_probability: hourlyData.precipitation_probability.slice(startHour, endHour),
      weather_code: hourlyData.weather_code.slice(startHour, endHour),
      cloud_cover: hourlyData.cloud_cover.slice(startHour, endHour),
      visibility: hourlyData.visibility.slice(startHour, endHour),
      wind_speed: hourlyData.wind_speed_10m.slice(startHour, endHour)
    };
    
    // Calculate averages
    const avgHumidity = dayHours.humidity.reduce((sum, hum) => sum + hum, 0) / 24;
    const avgPrecipitation = dayHours.precipitation_probability.reduce((sum, prec) => sum + prec, 0) / 24;
    const avgCloudCover = dayHours.cloud_cover.reduce((sum, cloud) => sum + cloud, 0) / 24;
    const avgVisibility = dayHours.visibility.reduce((sum, vis) => sum + vis, 0) / 24;
    const avgWindSpeed = dayHours.wind_speed.reduce((sum, wind) => sum + wind, 0) / 24;
    
    // Get most common weather code for the day
    const weatherCodeCounts = {};
    dayHours.weather_code.forEach(code => {
      weatherCodeCounts[code] = (weatherCodeCounts[code] || 0) + 1;
    });
    const mostCommonWeatherCode = Object.keys(weatherCodeCounts).reduce((a, b) => 
      weatherCodeCounts[a] > weatherCodeCounts[b] ? a : b
    );
    
    // Get cloud type and height from weather code
    const cloudInfo = getCloudTypeFromWeatherCode(parseInt(mostCommonWeatherCode));
    
    // Create weather data for scoring using the proper structure
    const weatherForScoring = {
      cloud_type: cloudInfo.type,
      cloud_coverage: avgCloudCover,
      cloud_height_km: cloudInfo.height,
      precipitation_chance: avgPrecipitation,
      humidity: avgHumidity,
      air_quality_index: 50, // Default AQI since we don't have air quality data
      visibility: avgVisibility,
      wind_speed: avgWindSpeed
    };
    
    // Calculate sunset score using the proper scoring service
    const scoreResult = getSunsetQualityScore(weatherForScoring);
    
    // Format sunset time
    const sunsetTime = apiData.daily.sunset[i] ? 
      new Date(apiData.daily.sunset[i]).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }) : '18:00';
    
    // Get day of week
    const dayOfWeek = new Date(apiData.daily.time[i]).toLocaleDateString('en-US', { 
      weekday: 'short' 
    });
    
    days.push({
      date: apiData.daily.time[i],
      day_of_week: dayOfWeek,
      weather_code: apiData.daily.weather_code[i],
      temperature_max: apiData.daily.temperature_2m_max[i],
      temperature_min: apiData.daily.temperature_2m_min[i],
      sunset: apiData.daily.sunset[i],
      sunrise: apiData.daily.sunrise[i],
      sunset_time: sunsetTime,
      sunset_score: scoreResult.score,
      conditions: scoreResult.conditions,
      cloud_coverage: avgCloudCover,
      humidity: avgHumidity,
      precipitation_chance: avgPrecipitation,
      visibility: avgVisibility,
      wind_speed: avgWindSpeed
    });
  }
  
  return {
    location: locationName,
    latitude: coords.latitude,
    longitude: coords.longitude,
    days: days,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Fetch historical weather data directly from Open-Meteo Archive API
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object>} - Historical weather data object
 */
export const fetchHistoricalWeatherData = async (latitude, longitude) => {
  const year = new Date().getFullYear();
  
  const url = `https://archive-api.open-meteo.com/v1/archive?` +
    `latitude=${latitude}&` +
    `longitude=${longitude}&` +
    `start_date=${year}-01-01&` +
    `end_date=${year}-12-31&` +
    `hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,cloud_cover,visibility,wind_speed_10m&` +
    `daily=weather_code,temperature_2m_max,temperature_2m_min,sunset,sunrise&` +
    `timezone=auto`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    },
    mode: 'cors',
    credentials: 'omit'
  });
  
  if (!response.ok) {
    throw new Error(`Historical weather data fetch failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
};

/**
 * Fetch historical air quality data from Open-Meteo Archive API
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object>} - Historical air quality data object
 */
export const fetchHistoricalAirQualityData = async (latitude, longitude) => {
  // Open-Meteo Archive API doesn't support historical air quality data
  // Use the current air quality API instead for the current year
  const year = new Date().getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = new Date().toISOString().split('T')[0]; // Today's date
  
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?` +
    `latitude=${latitude}&` +
    `longitude=${longitude}&` +
    `start_date=${startDate}&` +
    `end_date=${endDate}&` +
    `hourly=us_aqi&` +
    `timezone=auto`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Historical air quality data fetch failed: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  return data;
};