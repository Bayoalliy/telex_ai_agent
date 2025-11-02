import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Moon phase calculation
function getMoonPhase(date = new Date()): string {
  const lp = 2551443; // lunar period in seconds
  const new_moon = new Date(1970, 0, 7, 20, 35, 0); // reference new moon
  const phase = ((date.getTime() - new_moon.getTime()) / 1000) % lp;
  const phaseIndex = Math.floor((phase / lp) * 8);

  const phases = [
    'New Moon',
    'Waxing Crescent',
    'First Quarter',
    'Waxing Gibbous',
    'Full Moon',
    'Waning Gibbous',
    'Last Quarter',
    'Waning Crescent'
  ];

  return phases[phaseIndex] || 'Unknown';
}

export const sunriseTool = createTool({
  id: 'get-sunrise',
  description: 'Fetch sunrise, sunset, and day length for a given city and estimate moon phase',
  inputSchema: z.object({
    city: z.string().describe('City name'),
  }),
  outputSchema: z.object({
    city: z.string(),
    sunrise: z.string(),
    sunset: z.string(),
    dayLength: z.string(),
    moonPhase: z.string(),
  }),
  execute: async ({ context }) => {
    const { city } = context;

    // Get coordinates using Open-Meteo.
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    const geoData = await geoRes.json();

    if (!geoData.results?.[0]) {
      throw new Error(`Could not find location '${city}'`);
    }

    const { latitude, longitude, name } = geoData.results[0];

    // Fetch sunrise/sunset data
    const sunRes = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`
    );
    const sunData = await sunRes.json();

    if (!sunData.results) {
      throw new Error('Failed to fetch sunrise/sunset data');
    }

    const { sunrise, sunset, day_length } = sunData.results;
    const moonPhase = getMoonPhase();

    return {
      city: name,
      sunrise: new Date(sunrise).toLocaleTimeString(),
      sunset: new Date(sunset).toLocaleTimeString(),
      dayLength: day_length,
      moonPhase,
    };
  },
});
