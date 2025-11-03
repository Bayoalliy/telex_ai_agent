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
  description: 'Fetch accurate local sunrise, sunset, and day length for a given city with moon phase',
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

    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    const geoData = await geoRes.json();

    if (!geoData.results?.[0]) {
      throw new Error(`Could not find location '${city}'`);
    }

    const { latitude, longitude, name, timezone } = geoData.results[0];

    const astroRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=sunrise,sunset&timezone=${timezone}`
    );
    const astroData = await astroRes.json();

    if (!astroData.daily?.sunrise?.[0] || !astroData.daily?.sunset?.[0]) {
      throw new Error('Failed to fetch astronomy data');
    }

    const sunrise = astroData.daily.sunrise[0];
    const sunset = astroData.daily.sunset[0];
    const dayLengthSec = astroData.daily.day_length[0];

    const hours = Math.floor(dayLengthSec / 3600);
    const minutes = Math.floor((dayLengthSec % 3600) / 60);
    const dayLength = `${hours} hours ${minutes} minutes`;

    const fmt = (iso: string) =>
      new Intl.DateTimeFormat('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
      }).format(new Date(iso));

    const sunriseLocal = fmt(sunrise);
    const sunsetLocal = fmt(sunset);

    // Moon phase
    const moonPhase = getMoonPhase();

    return {
      city: name,
      sunrise: sunrise,
      sunset: sunset,
      dayLength,
      moonPhase,
    };
  },
});
