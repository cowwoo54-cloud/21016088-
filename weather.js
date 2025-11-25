export default async function handler(req, res) {
  const city = req.query.city;
  const API_KEY = process.env.OPENWEATHER_API_KEY;

  if (!city) {
    return res.status(400).json({ error: "city query 필요" });
  }

  try {
    // 1. 현재 날씨
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    if (!currentRes.ok) throw new Error(`HTTP error! status: ${currentRes.status}`);
    const currentData = await currentRes.json();

    // 2. 5일 forecast
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    if (!forecastRes.ok) throw new Error(`HTTP error! status: ${forecastRes.status}`);
    const forecastData = await forecastRes.json();

    // 3. AQI (공기질) - lat/lon 필요
    const { lat, lon } = currentData.coord;
    const airRes = await fetch(
      `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    if (!airRes.ok) throw new Error(`HTTP error! status: ${airRes.status}`);
    const airData = await airRes.json();

    // 4. 한 번에 JSON 반환
    res.status(200).json({
      current: currentData,
      forecast: forecastData,
      air: airData
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
