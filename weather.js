// pages/api/weather.js
export default async function handler(req, res) {
  const { type, city, lat, lon } = req.query;
  const API_KEY = process.env.OPENWEATHER_API_KEY; // 서버 전용

  try {
    let url = '';
    if (type === 'current') {
      url = `https://api.openweathermap.org/data/2.5/weather?appid=${API_KEY}&units=metric`;
      if (city) url += `&q=${encodeURIComponent(city)}`;
      if (lat && lon) url += `&lat=${lat}&lon=${lon}`;
    } else if (type === 'forecast') {
      url = `https://api.openweathermap.org/data/2.5/forecast?appid=${API_KEY}&units=metric`;
      if (city) url += `&q=${encodeURIComponent(city)}`;
    } else if (type === 'air') {
      url = `https://api.openweathermap.org/data/2.5/air_pollution?appid=${API_KEY}&lat=${lat}&lon=${lon}`;
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
