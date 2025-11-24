let isCelsius = true;
const $ = id => document.getElementById(id);
const c2f = v => (v*9/5+32);

let hourChart = null;
function initChart(){
  const ctx = $('hourChart').getContext('2d');
  hourChart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{ label: '온도', data: [], tension: 0.3, pointRadius: 3 }] },
    options: { plugins:{legend:{display:false}}, scales:{x:{display:true}, y:{display:true}} }
  });
}
function updateChart(labels, temps){ 
  if(!hourChart) initChart();
  hourChart.data.labels = labels;
  hourChart.data.datasets[0].data = temps;
  hourChart.update();
}

// 서버 API 호출
async function fetchFromServer(type, params){
  const query = new URLSearchParams({ type, ...params });
  const res = await fetch(`/api/weather?${query}`);
  if(!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'API 오류');
  }
  return res.json();
}

// UI 렌더링 함수
function renderCurrent(data){
  $('cityName').textContent = `${data.name}, ${data.sys?.country || ''}`;
  $('curSummary').textContent = data.weather[0].description;
  $('tempLarge').textContent = `${isCelsius ? data.main.temp.toFixed(1) : c2f(data.main.temp).toFixed(1)}°${isCelsius ? 'C':'F'}`;
  $('humidity').textContent = `습도: ${data.main.humidity}%`;
  $('wind').textContent = `풍속: ${data.wind.speed} m/s`;
}
function renderForecastList(forecast){
  const container = $('forecast');
  container.innerHTML = '';
  const daily = forecast.list.filter(i => i.dt_txt.includes('12:00:00')).slice(0,5);
  daily.forEach(d => {
    const el = document.createElement('div');
    el.className = 'fcard';
    el.innerHTML = `<div>${d.dt_txt.split(' ')[0]}</div>
                    <div>${isCelsius ? d.main.temp.toFixed(1) : c2f(d.main.temp).toFixed(1)}°${isCelsius ? 'C':'F'}</div>
                    <div>${d.weather[0].description}</div>`;
    container.appendChild(el);
  });

  const next = forecast.list.slice(0,12);
  const labels = next.map(x => x.dt_txt.split(' ')[1].slice(0,5));
  const temps = next.map(x => isCelsius ? x.main.temp : c2f(x.main.temp));
  updateChart(labels, temps);
}
function renderAQI(data){
  if(!data || !data.list?.length){ $('aqiInfo').textContent='공기질: 데이터 없음'; return; }
  const a = data.list[0].main.aqi;
  const map = {1:'좋음',2:'보통',3:'나쁨(약)',4:'나쁨',5:'매우 나쁨'};
  $('aqiInfo').textContent = `공기질: ${map[a]} (AQI:${a})`;
}

// 검색
async function doSearch(city){
  try{
    const cur = await fetchFromServer('current', {city});
    const f = await fetchFromServer('forecast', {city});
    renderCurrent(cur);
    renderForecastList(f);
    const aq = await fetchFromServer('air', {lat: cur.coord.lat, lon: cur.coord.lon});
    renderAQI(aq);
  } catch(e){
    alert(e.message);
  }
}

// 이벤트
$('searchBtn').addEventListener('click', ()=>{ const city=$('cityInput').value.trim(); if(city) doSearch(city); });
$('cityInput').addEventListener('keyup', e=>{ if(e.key==='Enter') $('searchBtn').click(); });
$('unitBtn').addEventListener('click', ()=>{
  isCelsius = !isCelsius;
  const city = $('cityInput').value.trim();
  if(city) doSearch(city);
});

// 초기화
initChart();
