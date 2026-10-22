import { esc, validateWeatherLocation } from './model.js';
import { extension } from './storage.js';
import { fetchText } from './sources.js';

const GEOCODING = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST = 'https://api.open-meteo.com/v1/forecast';
export function weatherPermission() {
  return extension ? chrome.permissions.request({ origins: ['https://geocoding-api.open-meteo.com/*', 'https://api.open-meteo.com/*'] }) : Promise.resolve(true);
}
export async function searchCities(name) {
  const params = new URLSearchParams({ name, count: '8', language: 'zh', format: 'json' });
  const data = JSON.parse(await fetchText(`${GEOCODING}?${params}`));
  return (data.results || []).filter(i => i.timezone).map(i => validateWeatherLocation({
    name: [...new Set([i.name, i.admin1, i.country].filter(Boolean))].join(' · '),
    latitude: i.latitude, longitude: i.longitude, timezone: i.timezone,
  }));
}
export function parseWeather(data) {
  const current = data.current;
  if (!current || !Number.isFinite(current.temperature_2m) || !Number.isInteger(current.weather_code) || !Number.isFinite(current.time)) {
    throw new Error('天气数据不完整，请稍后重试。');
  }
  const number = value => Number.isFinite(value) ? value : null;
  return { temperature: current.temperature_2m, code: current.weather_code, isDay: current.is_day !== 0,
    apparent: number(current.apparent_temperature), humidity: number(current.relative_humidity_2m), wind: number(current.wind_speed_10m),
    high: number(data.daily?.temperature_2m_max?.[0]), low: number(data.daily?.temperature_2m_min?.[0]),
    observedAt: current.time * 1000 };
}
export async function loadWeather(source) {
  const { latitude, longitude, timezone } = validateWeatherLocation(source.location);
  const params = new URLSearchParams({ latitude, longitude, timezone, timeformat: 'unixtime', forecast_days: '1',
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min', temperature_unit: 'celsius', wind_speed_unit: 'kmh' });
  return { weather: parseWeather(JSON.parse(await fetchText(`${FORECAST}?${params}`))), items: [], fetchedAt: Date.now() };
}
export function weatherCondition(code, isDay = true) {
  if (code === 0) return { label: isDay ? '晴朗' : '晴夜', kind: isDay ? 'sun' : 'moon' };
  if ([1, 2].includes(code)) return { label: code === 1 ? '晴间多云' : '多云', kind: isDay ? 'partly' : 'night-cloud' };
  if (code === 3) return { label: '阴天', kind: 'cloud' };
  if ([45, 48].includes(code)) return { label: '雾', kind: 'fog' };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: '毛毛雨', kind: 'rain' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: '雨', kind: 'rain' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: '雪', kind: 'snow' };
  if ([95, 96, 99].includes(code)) return { label: '雷雨', kind: 'storm' };
  return { label: '天气未知', kind: 'unknown' };
}
const weatherIcons = { sun: 'sun', moon: 'moon', partly: 'cloud-sun', 'night-cloud': 'cloud-moon', cloud: 'cloud', fog: 'cloud-fog', rain: 'cloud-rain', snow: 'cloud-snow', storm: 'cloud-lightning', unknown: 'circle-question-mark' };
const icon = (name, className = '') => `<svg class="weather-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="assets/icons/weather.svg#${name}"/></svg>`;
function weatherArt(kind) {
  return icon(weatherIcons[kind], `weather-art weather-art-${kind}`);
}
const metric = (value, suffix = '°') => Number.isFinite(value) ? `${Math.round(value)}${suffix}` : '—';
export function clockParts(timezone, now = new Date()) {
  const options = timezone ? { timeZone: timezone } : {};
  const parts = new Intl.DateTimeFormat('en-GB', { ...options, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const hour = parts.find(p => p.type === 'hour').value;
  const minute = parts.find(p => p.type === 'minute').value;
  const date = new Intl.DateTimeFormat('zh-CN', { ...options, month: 'long', day: 'numeric' }).format(now);
  const weekday = new Intl.DateTimeFormat('zh-CN', { ...options, weekday: 'long' }).format(now);
  return { hour, minute, date, weekday };
}
export function updateClocks() {
  for (const card of document.querySelectorAll('.weather-card')) {
    const { hour, minute, date, weekday } = clockParts(card.dataset.timezone || undefined);
    card.querySelector('.clock-hour').textContent = hour;
    card.querySelector('.clock-minute').textContent = minute;
    card.querySelector('.clock-date').textContent = date;
    card.querySelector('.clock-weekday').textContent = weekday;
    card.querySelector('time').setAttribute('datetime', new Date().toISOString());
  }
}
export function weatherCard(source, state) {
  const weather = state.data?.weather;
  const location = source.location;
  const condition = weather ? weatherCondition(weather.code, weather.isDay) : { label: '', kind: 'unknown' };
  const { hour, minute, date, weekday } = clockParts(location?.timezone);
  const stale = state.status === 'stale' || (weather && Date.now() - state.data.fetchedAt > source.refreshMinutes * 60000);
  const status = !location ? '选择城市，开启今日天气' : state.status === 'loading' ? '正在更新天气…' : state.status === 'error' ? '天气暂时无法获取' : stale ? '更新未完成 · 显示旧天气' : `天气更新于 ${new Date(weather?.observedAt || state.data?.fetchedAt).toLocaleTimeString('zh-CN', { timeZone: location.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}`;
  return `<article class="card weather-card ${state.error ? 'weather-has-error' : ''}" data-type="weather" data-id="${esc(source.id)}" data-timezone="${esc(location?.timezone || '')}" aria-label="${esc(source.name)}">
    <header class="card-header" draggable="true"><span class="weather-marker" aria-hidden="true"></span><div class="card-heading"><h2>${esc(source.name)}</h2></div><div class="card-tools"><button class="icon-button card-menu" data-action="edit" title="编辑数据源" aria-label="编辑 ${esc(source.name)}">${icon('ellipsis')}</button></div></header>
    <div class="card-content"><div class="weather-content">
      <div class="weather-time-block"><p class="clock-eyebrow">${location ? 'LOCAL TIME' : 'DEVICE TIME'}</p><time class="weather-clock" datetime="${new Date().toISOString()}" aria-label="${location ? '城市当地时间' : '设备时间'}"><span class="clock-hour">${hour}</span><span class="clock-colon">:</span><span class="clock-minute">${minute}</span></time><div class="clock-calendar"><span class="clock-date">${date}</span><span class="clock-weekday">${weekday}</span></div></div>
      <div class="weather-summary"><div class="weather-reading"><button class="weather-location" data-action="edit" title="${esc(location?.name || '选择天气城市')}">${icon('map-pin')}<span>${esc(location?.name.split(' · ')[0] || '选择城市')}</span>${icon('chevron-down')}</button><div class="weather-temperature">${metric(weather?.temperature)}<span>${condition.label || '等待天气'}</span></div><p class="weather-range">${weather ? `最高 ${metric(weather.high)}<span> / </span>最低 ${metric(weather.low)}` : location ? '天气暂未更新' : '选择城市，开启今日天气'}</p></div>${weatherArt(condition.kind)}</div>
      <div class="weather-metrics"><div><span>${icon('thermometer')}体感</span><strong>${metric(weather?.apparent)}</strong></div><div><span>${icon('droplet')}湿度</span><strong>${metric(weather?.humidity, '%')}</strong></div><div><span>${icon('wind')}风速</span><strong>${metric(weather?.wind, ' km/h')}</strong></div></div>
    </div></div>
    ${state.error ? `<div class="stale-note" role="status">${esc(state.error)} <button class="weather-retry" data-action="weather-connect">授权 / 重试</button></div>` : ''}
    <footer class="card-footer"><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a><div><span class="update-status ${stale || !weather ? 'stale' : ''}">${esc(status)}</span><button class="icon-button refresh-icon" data-action="refresh" aria-label="刷新 ${esc(source.name)}" ${state.status === 'loading' ? 'disabled' : ''}>${icon('refresh-cw')}</button></div></footer>
  </article>`;
}
