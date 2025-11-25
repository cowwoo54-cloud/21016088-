const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const cityName = document.getElementById("cityName");
const tempLarge = document.getElementById("tempLarge");
const curSummary = document.getElementById("curSummary");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");

// 에러 처리
function handleError(error) {
  console.error("날씨 정보 불러오기 오류:", error);
}

// 서버 API 호출
async function getWeather(city) {
  try {
    const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    // DOM 업데이트
    cityName.textContent = `${data.name}, ${data.sys?.country || ""}`;
    tempLarge.textContent = `${data.main.temp.toFixed(1)}°C`;
    curSummary.textContent = data.weather[0].description;
    humidity.textContent = `습도: ${data.main.humidity}%`;
    wind.textContent = `풍속: ${data.wind.speed} m/s`;
  } catch (err) {
    handleError(err);
  }
}

// 이벤트 연결
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) getWeather(city);
});
cityInput.addEventListener("keyup", e => {
  if (e.key === "Enter") searchBtn.click();
});
