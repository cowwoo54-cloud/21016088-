// pages/api/weather.js (Next.js 기준)
export default async function handler(req, res) {
  const { type, city, lat, lon } = req.query;
  const API_KEY = process.env.OPENWEATHER_API_KEY;

  try {
    let url = '';
    if (type === 'current') {
      if (city) url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
      else if (lat && lon) url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      else return res.status(400).json({ error: 'city 또는 lat/lon 필요' });
    } else if (type === 'forecast') {
      if (city) url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
      else return res.status(400).json({ error: 'city 필요' });
    } else if (type === 'air') {
      if (lat && lon) url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
      else return res.status(400).json({ error: 'lat/lon 필요' });
    } else {
      return res.status(400).json({ error: '잘못된 type' });
    }

    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
