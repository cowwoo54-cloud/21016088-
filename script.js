const $ = (id) => document.getElementById(id);

let isCelsius = true;
const API_BASE = '/api/weather'; // 서버리스 API 경로 (Vercel 배포 시 맞게 변경)

let hourChart = null;

function initChart() {
  const ctx = $('hourChart').getContext('2d');
  hourChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: '온도',
          data: [],
          borderColor: '#4ea4ff',
          backgroundColor: 'rgba(78,164,255,0.3)',
          tension: 0.3,
          pointRadius: 3,
          fill: true,
          borderWidth: 2,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { display: true },
        y: { display: true, suggestedMin: -10, suggestedMax: 40 },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function updateChart(labels, temps) {
  if (!hourChart) initChart();
  hourChart.data.labels = labels;
  hourChart.data.datasets[0].data = temps;
  hourChart.update();
}

function c2f(c) {
  return c * 9 / 5 + 32;
}

function f2c(f) {
  return (f - 32) * 5 / 9;
}

function setBackgroundByTimeAndWeather(weatherId) {
  const hour = new Date().getHours();
  let timeClass = 'morning';

  if (hour >= 6 && hour < 12) timeClass = 'morning';
  else if (hour >= 12 && hour < 17) timeClass = 'afternoon';
  else if (hour >= 17 && hour < 20) timeClass = 'evening';
  else timeClass = 'night';

  // 간단하게 구분: 맑음(800), 구름(801~804), 비(500~531), 눈(600~622), 안개(700~781)
  if (weatherId === 800) timeClass += ' clear';
  else if (weatherId >= 801 && weatherId <= 804) timeClass += ' cloudy';
  else if (weatherId >= 500 && weatherId <= 531) timeClass += ' rain';
  else if (weatherId >= 600 && weatherId <= 622) timeClass += ' snow';
  else if (weatherId >= 700 && weatherId <= 781) timeClass += ' fog';

  document.body.className = timeClass;
}

function renderCurrent(data) {
  $('cityName').textContent = `${data.name}, ${data.sys?.country || ''}`;
  $('curSummary').textContent = data.weather[0].description;
  const temp = isCelsius ? data.main.temp : c2f(data.main.temp);
  $('tempLarge').textContent = `${temp.toFixed(1)}°${isCelsius ? 'C' : 'F'}`;
  $('curIcon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  $('curIcon').alt = data.weather[0].description;
  $('humidity').textContent = `습도: ${data.main.humidity}%`;
  $('wind').textContent = `풍속: ${data.wind.speed} m/s`;
  setBackgroundByTimeAndWeather(data.weather[0].id);
}

function renderForecast(forecast) {
  const container = $('forecast');
  container.innerHTML = '';
  // 3~5일 12시 예보 필터링
  const daily = forecast.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0, 5);
  daily.forEach(day => {
    const card = document.createElement('div');
    card.className = 'fcard';
    const date = day.dt_txt.split(' ')[0];
    const temp = isCelsius ? day.main.temp : c2f(day.main.temp);
    card.innerHTML = `
      <div class="date">${date}</div>
      <div class="temp">${temp.toFixed(1)}°${isCelsius ? 'C' : 'F'}</div>
      <div class="desc">${day.weather[0].description}</div>
      <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}" />
    `;
    container.appendChild(card);
  });

  // 시간별 차트용 데이터
  const nextHours = forecast.list.slice(0, 12);
  const labels = nextHours.map(x => x.dt_txt.split(' ')[1].slice(0, 5));
  const temps = nextHours.map(x => (isCelsius ? x.main.temp : c2f(x.main.temp)));
  updateChart(labels, temps);
}

function renderAQI(data) {
  const el = $('aqiInfo');
  if (!data || !data.list || data.list.length === 0) {
    el.textContent = '공기질: 데이터 없음';
    return;
  }
  const aqi = data.list[0].main.aqi;
  const map = {
    1: '좋음',
    2: '보통',
    3: '나쁨(약)',
    4: '나쁨',
    5: '매우 나쁨',
  };
  el.textContent = `공기질: ${map[aqi]} (AQI:${aqi})`;
}

function handleError(error) {
  const errEl = $('errorMsg');
  errEl.textContent = error.message || '알 수 없는 오류가 발생했습니다.';
}

function clearError() {
  $('errorMsg').textContent = '';
}

function saveRecent(city) {
  if (!city) return;
  const recent = JSON.parse(localStorage.getItem('recentCities') || '[]');
  const filtered = recent.filter(c => c.toLowerCase() !== city.toLowerCase());
  filtered.unshift(city);
  const limited = filtered.slice(0, 5);
  localStorage.setItem('recentCities', JSON.stringify(limited));
  renderRecent();
}

function renderRecent() {
  const container = $('recent');
  container.innerHTML = '';
  const recent = JSON.parse(localStorage.getItem('recentCities') || '[]');
  recent.forEach(city => {
    const btn = document.createElement('button');
    btn.textContent = city;
    btn.title = `최근 검색: ${city}`;
    btn.addEventListener('click', () => {
      $('cityInput').value = city;
      doSearch(city);
    });
    container.appendChild(btn);
  });
}

async function fetchFromAPI(type, params) {
  const query = new URLSearchParams(params);
  const url = `/api/weather?type=${type}&${query}`; // 서버 API 호출
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `API 오류: ${res.status}`);
  }
  return res.json();
}


async function doSearch(city) {
  clearError();
  if (!city) {
    handleError(new Error('도시 이름을 입력하세요.'));
    return;
  }
  try {
    const current = await fetchFromAPI('current', { city });
    renderCurrent(current);

    const forecast = await fetchFromAPI('forecast', { city });
    renderForecast(forecast);

    const aqi = await fetchFromAPI('air', { lat: current.coord.lat, lon: current.coord.lon });
    renderAQI(aqi);

    saveRecent(city);
  } catch (error) {
    handleError(error);
  }
}

function toggleUnit() {
  isCelsius = !isCelsius;
  const city = $('cityInput').value.trim();
  if (city) doSearch(city);
}

function tryGeolocation() {
  clearError();
  if (!navigator.geolocation) {
    handleError(new Error('Geolocation API를 지원하지 않습니다.'));
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const current = await fetchFromAPI('current', { lat: latitude, lon: longitude });
        renderCurrent(current);

        const forecast = await fetchFromAPI('forecast', { lat: latitude, lon: longitude });
        renderForecast(forecast);

        const aqi = await fetchFromAPI('air', { lat: latitude, lon: longitude });
        renderAQI(aqi);

        saveRecent(current.name);
      } catch (error) {
        handleError(error);
      }
    },
    (err) => {
      handleError(new Error('위치 정보를 가져올 수 없습니다.'));
    }
  );
}

// 이벤트 연결
document.getElementById('searchBtn').addEventListener('click', () => {
  const city = $('cityInput').value.trim();
  doSearch(city);
});
document.getElementById('cityInput').addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    const city = $('cityInput').value.trim();
    doSearch(city);
  }
});
document.getElementById('unitBtn').addEventListener('click', toggleUnit);
document.getElementById('gpsBtn').addEventListener('click', tryGeolocation);

// 초기화
initChart();
renderRecent();

