import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Get forecast data directly from Open-Meteo API
 */
app.get('/api/forecast/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    
    const url = `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&` +
      `longitude=${lon}&` +
      `daily=weather_code,temperature_2m_max,temperature_2m_min,sunset,sunrise&` +
      `hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,cloud_cover,visibility,wind_speed_10m&` +
      `timezone=auto`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch forecast data',
      details: error.message 
    });
  }
});

/**
 * Get historical data directly from Open-Meteo Archive API
 */
app.get('/api/historical/:lat/:lon/:year', async (req, res) => {
  try {
    const { lat, lon, year } = req.params;
    
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const url = `https://archive-api.open-meteo.com/v1/archive?` +
      `latitude=${lat}&` +
      `longitude=${lon}&` +
      `start_date=${startDate}&` +
      `end_date=${endDate}&` +
      `hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,cloud_cover,visibility,wind_speed_10m&` +
      `daily=weather_code,temperature_2m_max,temperature_2m_min,sunset,sunrise&` +
      `timezone=auto`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo Archive API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch historical data',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Suncast Backend API running on port ${PORT}`);
  console.log('No caching - direct API calls only');
});