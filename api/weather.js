// /api/weather.js

export default async function handler(req, res) {
  const { type, city, lat, lon } = req.query;
  const API_KEY = process.env.OPENWEATHER_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "API Key가 설정되지 않았습니다." });
  }

  try {
    // ------------------------------
    // 1) 현재 날씨
    // ------------------------------
    if (type === "current") {
      let url = "";

      if (city) {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          city
        )}&appid=${API_KEY}&units=metric`;
      } else if (lat && lon) {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      } else {
        return res.status(400).json({ error: "city 또는 lat/lon 필요" });
      }

      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP error: ${r.status}`);
      const data = await r.json();
      return res.status(200).json(data);
    }

    // ------------------------------
    // 2) 5일 예보
    // ------------------------------
    if (type === "forecast") {
      let url = "";

      if (city) {
        url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
          city
        )}&appid=${API_KEY}&units=metric`;
      } else if (lat && lon) {
        url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      } else {
        return res.status(400).json({ error: "city 또는 lat/lon 필요" });
      }

      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP error: ${r.status}`);
      const data = await r.json();
      return res.status(200).json(data);
    }

    // ------------------------------
    // 3) 공기질
    // ------------------------------
    if (type === "air") {
      if (!lat || !lon) {
        return res.status(400).json({ error: "lat/lon 필요" });
      }

      const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP error: ${r.status}`);
      const data = await r.json();
      return res.status(200).json(data);
    }

    // ------------------------------
    // 잘못된 type
    // ------------------------------
    return res.status(400).json({ error: "올바른 type 필요: current / forecast / air" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
