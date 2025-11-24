// pages/api/weather.js
export default async function handler(req, res) {
  const { type, city, lat, lon } = req.query;
  const API_KEY = process.env.OPENWEATHER_API_KEY;

  try {
    let url = '';
    if (type === 'current') {
      url = `https://api.openweathermap.org/data/2.5/weather?appid=${API_KEY}&units=metric`;
      // city가 있으면 city 사용, lat/lon이 있으면 lat/lon 사용
      if (city) {
        url += `&q=${encodeURIComponent(city)}`;
      } else if (lat && lon) {
        url += `&lat=${lat}&lon=${lon}`;
      } else {
        return res.status(400).json({ error: 'city 또는 lat/lon 필요' });
      }
    } else if (type === 'forecast') {
      url = `https://api.openweathermap.org/data/2.5/forecast?appid=${API_KEY}&units=metric`;
      if (city) url += `&q=${encodeURIComponent(city)}`;
      else return res.status(400).json({ error: 'city 필요' });
    } else if (type === 'air') {
      if (!lat || !lon) return res.status(400).json({ error: 'lat/lon 필요' });
      url = `https://api.openweathermap.org/data/2.5/air_pollution?appid=${API_KEY}&lat=${lat}&lon=${lon}`;
    } else {
      return res.status(400).json({ error: '잘못된 type' });
    }

    const response = await fetch(url);
    const data = await response.json();

    // city not found 체크
    if (data.cod && data.cod === '404') {
      return res.status(404).json({ error: '도시를 찾을 수 없습니다' });
    }

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
