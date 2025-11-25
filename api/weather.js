export default async function handler(req, res) {
  const city = req.query.city;
  const API_KEY = process.env.OPENWEATHER_API_KEY;

  if (!city) {
    return res.status(400).json({ error: "city query 필요" });
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

