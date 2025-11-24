let isCelsius = true; // 단위 상태

// 유틸 함수
const $ = id => document.getElementById(id);
const c2f = v => (v*9/5+32);
const f2c = v => ((v-32)*5/9);

// Chart.js 초기화
let hourChart = null;
function initChart(){
  const ctx = $('hourChart').getContext('2d');
  hourChart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{ label: '온도', data: [], tension: 0.3, pointRadius: 3 }]},
    options: { plugins:{legend:{display:false}}, scales:{x:{display:true}, y:{display:true}} }
  });
}
function updateChart(labels, temps){ 
  if(!hourChart) initChart();
  hourChart.data.labels = labels;
  hourChart.data.datasets[0].data = temps;
  hourChart.update();
}

// API 호출 (서버 환경변수 사용)
async function fetchCurrentByCity(city){
  const res = await fetch(`/api/weather?type=current&city=${encodeURIComponent(city)}`);
  if(!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '도시를 찾을 수 없습니다');
  }
  return res.json();
}

async function fetchForecastByCity(city){
  const res = await fetch(`/api/weather?type=forecast&city=${encodeURIComponent(city)}`);
  if(!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '예보를 불러올 수 없습니다');
  }
  return res.json();
}

async function fetchAirQuality(lat, lon){
  const res = await fetch(`/api/weather?type=air&lat=${lat}&lon=${lon}`);
  if(!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '공기질 데이터를 불러올 수 없습니다');
  }
  return res.json();
}

// 현재 날씨 렌더링
function renderCurrent(data){
  $('cityName').textContent = `${data.name}, ${data.sys?.country || ''}`;
  $('curSummary').textContent = data.weather[0].description;
  $('tempLarge').textContent = `${isCelsius ? data.main.temp.toFixed(1) : c2f(data.main.temp).toFixed(1)}°${isCelsius ? 'C':'F'}`;
  $('humidity').textContent = `습도: ${data.main.humidity}%`;
  $('wind').textContent = `풍속: ${data.wind.speed} m/s`;
}

// 예보 카드 렌더링
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

// 공기질 렌더링
function renderAQI(data){
  if(!data || !data.list || !data.list.length){ 
    $('aqiInfo').textContent='공기질: 데이터 없음'; 
    return; 
  }
  const a = data.list[0].main.aqi;
  const map = {1:'좋음',2:'보통',3:'나쁨(약)',4:'나쁨',5:'매우 나쁨'};
  $('aqiInfo').textContent = `공기질: ${map[a]} (AQI:${a})`;
}

// 최근 검색어
function saveRecent(city){
  let list = JSON.parse(localStorage.getItem('recent')||'[]');
  city = city.trim();
  list = list.filter(c=>c.toLowerCase()!==city.toLowerCase());
  list.unshift(city);
  list = list.slice(0,5);
  localStorage.setItem('recent', JSON.stringify(list));
  renderRecent();
}
function renderRecent(){
  const c=$('recent'); c.innerHTML='';
  const list=JSON.parse(localStorage.getItem('recent')||'[]');
  list.forEach(city=>{
    const b=document.createElement('button');
    b.textContent=city;
    b.onclick=()=>doSearch(city);
    c.appendChild(b);
  });
}

// 검색 실행
async function doSearch(city){
  try{
    const cur = await fetchCurrentByCity(city);
    const f = await fetchForecastByCity(city);
    renderCurrent(cur);
    renderForecastList(f);
    saveRecent(cur.name);
    const aq = await fetchAirQuality(cur.coord.lat, cur.coord.lon);
    renderAQI(aq);
  } catch(e){
    alert(e.message);
  }
}

// 위치 자동 감지
function getByGPS(){
  if(!navigator.geolocation) return alert('Geolocation 미지원');
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const cur = await (await fetch(`/api/weather?type=current&lat=${lat}&lon=${lon}`)).json();
      const f = await (await fetch(`/api/weather?type=forecast&lat=${lat}&lon=${lon}`)).json();
      renderCurrent(cur);
      renderForecastList(f);
      saveRecent(cur.name);
      const aq = await fetchAirQuality(lat, lon);
      renderAQI(aq);
    } catch(e){
      alert(e.message);
    }
  }, ()=>{alert('위치 권한 거부 또는 오류');});
}

// 이벤트 리스너
$('searchBtn').addEventListener('click', ()=>{ 
  const city = $('cityInput').value.trim(); 
  if(city) doSearch(city); 
  else alert('도시를 입력하세요'); 
});
$('cityInput').addEventListener('keyup', e=>{ if(e.key==='Enter') $('searchBtn').click(); });
$('gpsBtn').addEventListener('click', getByGPS);
$('unitBtn').addEventListener('click', ()=>{
  isCelsius = !isCelsius;
  const city = $('cityInput').value.trim();
  if(city) doSearch(city);
});

// 초기화
initChart();
renderRecent();
