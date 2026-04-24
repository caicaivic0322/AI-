'use client';

import { useEffect } from 'react';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TIMER_MS = 2_147_000_000;
const SUN_ZENITH_DEGREES = 90.833;

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function normalizeHours(value) {
  return ((value % 24) + 24) % 24;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function toDegrees(value) {
  return (value * 180) / Math.PI;
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / DAY_MS);
}

function getSunTime(date, latitude, longitude, isSunrise) {
  const day = getDayOfYear(date);
  const longitudeHour = longitude / 15;
  const approximateTime = day + ((isSunrise ? 6 : 18) - longitudeHour) / 24;
  const meanAnomaly = 0.9856 * approximateTime - 3.289;
  const trueLongitude = normalizeDegrees(
    meanAnomaly +
      1.916 * Math.sin(toRadians(meanAnomaly)) +
      0.02 * Math.sin(toRadians(2 * meanAnomaly)) +
      282.634,
  );
  let rightAscension = normalizeDegrees(toDegrees(Math.atan(0.91764 * Math.tan(toRadians(trueLongitude)))));
  const longitudeQuadrant = Math.floor(trueLongitude / 90) * 90;
  const ascensionQuadrant = Math.floor(rightAscension / 90) * 90;

  rightAscension = (rightAscension + longitudeQuadrant - ascensionQuadrant) / 15;

  const sinDeclination = 0.39782 * Math.sin(toRadians(trueLongitude));
  const cosDeclination = Math.cos(Math.asin(sinDeclination));
  const cosHourAngle =
    (Math.cos(toRadians(SUN_ZENITH_DEGREES)) - sinDeclination * Math.sin(toRadians(latitude))) /
    (cosDeclination * Math.cos(toRadians(latitude)));

  if (cosHourAngle > 1 || cosHourAngle < -1) {
    return null;
  }

  let hourAngle = toDegrees(Math.acos(cosHourAngle));
  if (isSunrise) {
    hourAngle = 360 - hourAngle;
  }

  const localMeanTime = hourAngle / 15 + rightAscension - 0.06571 * approximateTime - 6.622;
  const utcHour = normalizeHours(localMeanTime - longitudeHour);
  const result = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const hour = Math.floor(utcHour);
  const minuteFloat = (utcHour - hour) * 60;
  const minute = Math.floor(minuteFloat);
  const second = Math.round((minuteFloat - minute) * 60);

  result.setUTCHours(hour, minute, second, 0);
  return result;
}

function getSolarWindow(date, latitude, longitude) {
  return {
    sunrise: getSunTime(date, latitude, longitude, true),
    sunset: getSunTime(date, latitude, longitude, false),
  };
}

function getClockTheme(date = new Date()) {
  const hour = date.getHours();
  return hour >= 18 || hour < 6 ? 'dark' : 'light';
}

function getSunTheme(now, solarWindow) {
  const { sunrise, sunset } = solarWindow;

  if (!sunrise || !sunset) {
    return getClockTheme(now);
  }

  return now >= sunrise && now < sunset ? 'light' : 'dark';
}

function updateThemeColor(theme) {
  let meta = document.querySelector('meta[name="theme-color"]');

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', theme === 'dark' ? '#090d12' : '#f4f5f7');
}

function applyTheme(theme, source, solarWindow = null) {
  const root = document.documentElement;

  root.dataset.theme = theme;
  root.dataset.themeSource = source;
  root.style.colorScheme = theme;

  if (solarWindow?.sunrise && solarWindow?.sunset) {
    root.dataset.sunrise = solarWindow.sunrise.toISOString();
    root.dataset.sunset = solarWindow.sunset.toISOString();
  } else {
    delete root.dataset.sunrise;
    delete root.dataset.sunset;
  }

  updateThemeColor(theme);
}

function getPreviewTheme() {
  const params = new URLSearchParams(window.location.search);
  const requestedTheme = params.get('theme');

  if (requestedTheme === 'dark' || requestedTheme === 'light') {
    window.sessionStorage.setItem('theme-preview', requestedTheme);
    return requestedTheme;
  }

  if (requestedTheme === 'auto') {
    window.sessionStorage.removeItem('theme-preview');
    return null;
  }

  const storedTheme = window.sessionStorage.getItem('theme-preview');
  return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : null;
}

function getNextClockBoundary(now = new Date()) {
  const next = new Date(now);
  const hour = now.getHours();

  if (hour < 6) {
    next.setHours(6, 0, 0, 0);
  } else if (hour < 18) {
    next.setHours(18, 0, 0, 0);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(6, 0, 0, 0);
  }

  return next;
}

function getNextSolarBoundary(now, latitude, longitude) {
  const tomorrow = new Date(now.getTime() + DAY_MS);
  const todayWindow = getSolarWindow(now, latitude, longitude);
  const tomorrowWindow = getSolarWindow(tomorrow, latitude, longitude);
  const candidates = [
    todayWindow.sunrise,
    todayWindow.sunset,
    tomorrowWindow.sunrise,
    tomorrowWindow.sunset,
  ].filter((candidate) => candidate && candidate > now);

  if (candidates.length === 0) {
    return getNextClockBoundary(now);
  }

  return candidates.reduce((earliest, candidate) => (candidate < earliest ? candidate : earliest), candidates[0]);
}

function scheduleNextRun(callback, nextBoundary) {
  const delay = Math.max(60_000, nextBoundary.getTime() - Date.now() + 2_000);
  return window.setTimeout(callback, Math.min(delay, MAX_TIMER_MS));
}

function requestCurrentPosition() {
  if (!navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      () => resolve(null),
      {
        enableHighAccuracy: false,
        maximumAge: 6 * 60 * 60 * 1000,
        timeout: 5_000,
      },
    );
  });
}

async function canAskForLocation() {
  if (!navigator.permissions?.query) {
    return true;
  }

  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state !== 'denied';
  } catch {
    return true;
  }
}

export default function SunThemeManager() {
  useEffect(() => {
    let timerId;
    let cancelled = false;
    let sessionCanRequestLocation = true;
    let lastCoordinates = null;

    const clearTimer = () => {
      if (timerId) {
        window.clearTimeout(timerId);
        timerId = undefined;
      }
    };

    const applyClockFallback = () => {
      const now = new Date();
      const theme = getClockTheme(now);
      applyTheme(theme, 'clock');
      clearTimer();
      timerId = scheduleNextRun(resolveTheme, getNextClockBoundary(now));
    };

    const applySolarTheme = (coords) => {
      const now = new Date();
      const solarWindow = getSolarWindow(now, coords.latitude, coords.longitude);
      const theme = getSunTheme(now, solarWindow);
      applyTheme(theme, 'sun', solarWindow);
      clearTimer();
      timerId = scheduleNextRun(resolveTheme, getNextSolarBoundary(now, coords.latitude, coords.longitude));
    };

    async function resolveTheme() {
      if (cancelled) {
        return;
      }

      const previewTheme = getPreviewTheme();
      if (previewTheme) {
        applyTheme(previewTheme, 'preview');
        clearTimer();
        return;
      }

      if (lastCoordinates) {
        applySolarTheme(lastCoordinates);
        return;
      }

      applyClockFallback();

      if (!sessionCanRequestLocation || !(await canAskForLocation()) || cancelled) {
        sessionCanRequestLocation = false;
        return;
      }

      const position = await requestCurrentPosition();
      if (cancelled) {
        return;
      }

      if (!position?.coords) {
        sessionCanRequestLocation = false;
        return;
      }

      lastCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      applySolarTheme(lastCoordinates);
    }

    resolveTheme();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resolveTheme();
      }
    };

    window.addEventListener('focus', resolveTheme);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      clearTimer();
      window.removeEventListener('focus', resolveTheme);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
