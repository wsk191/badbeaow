import { ref, update, increment } from 'firebase/database';
import { db } from './firebase';
import { getTodayKey } from './appConfig';

export const ACCESS_LOG_RETENTION_DAYS = 30;

const getDeviceId = () => {
  try {
    const saved = localStorage.getItem('badbeaowDeviceId');
    if (saved) return saved;
    const created = `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('badbeaowDeviceId', created);
    return created;
  } catch {
    return `d${Math.random().toString(36).slice(2, 12)}`;
  }
};

const matchVersion = (ua, pattern) => (ua.match(pattern) || [])[1]?.replace(/_/g, '.') || '';

// Browsers only expose an exact device model on Chromium for Android (via User-Agent Client Hints).
// iPhone/iPad/Mac/Windows never reveal the model, so those fall back to a generic name.
export async function getDeviceInfo() {
  const ua = navigator.userAgent || '';
  const touch = navigator.maxTouchPoints > 1;
  let os = 'อื่น ๆ';
  let osVersion = '';
  let model = '';
  if (/Android/i.test(ua)) {
    os = 'Android';
    osVersion = matchVersion(ua, /Android ([\d.]+)/);
    model = (ua.match(/Android [\d.]+; (?:[a-z]{2}-[a-z]{2}; )?([^;)]+?)(?: Build|\))/i) || [])[1] || '';
    if (model === 'K') model = '';
  } else if (/iPhone/.test(ua)) {
    os = 'iOS'; osVersion = matchVersion(ua, /OS ([\d_]+)/); model = 'iPhone';
  } else if (/iPad/.test(ua) || (/Macintosh/.test(ua) && touch)) {
    os = 'iPadOS'; osVersion = matchVersion(ua, /OS ([\d_]+)/) || matchVersion(ua, /Version\/([\d.]+)/); model = 'iPad';
  } else if (/Windows NT/.test(ua)) {
    os = 'Windows'; osVersion = matchVersion(ua, /Windows NT ([\d.]+)/) === '10.0' ? '10/11' : matchVersion(ua, /Windows NT ([\d.]+)/);
  } else if (/Macintosh/.test(ua)) {
    os = 'macOS'; osVersion = matchVersion(ua, /Mac OS X ([\d_]+)/); model = 'Mac';
  } else if (/CrOS/.test(ua)) {
    os = 'ChromeOS';
  } else if (/Linux/.test(ua)) {
    os = 'Linux';
  }

  const browser = /Edg\//.test(ua) ? 'Edge'
    : /SamsungBrowser/.test(ua) ? 'Samsung Internet'
      : /OPR\/|Opera/.test(ua) ? 'Opera'
        : /Line\//.test(ua) ? 'LINE'
          : /FBAN|FBAV/.test(ua) ? 'Facebook'
            : /CriOS|Chrome\//.test(ua) ? 'Chrome'
              : /FxiOS|Firefox\//.test(ua) ? 'Firefox'
                : /Safari\//.test(ua) ? 'Safari' : 'อื่น ๆ';

  try {
    const hints = await navigator.userAgentData?.getHighEntropyValues?.(['model', 'platformVersion']);
    if (hints?.model) model = hints.model;
    if (os === 'Windows' && hints?.platformVersion) osVersion = Number(hints.platformVersion.split('.')[0]) >= 13 ? '11' : '10';
  } catch {
    // Client hints are optional
  }

  const mobile = /Mobi|iPhone|Android.+Mobile/i.test(ua);
  const deviceType = mobile ? 'มือถือ' : (/iPad|Tablet|Android/i.test(ua) || (/Macintosh/.test(ua) && touch)) ? 'แท็บเล็ต' : 'คอมพิวเตอร์';

  return {
    deviceType,
    os,
    osVersion: osVersion.slice(0, 20),
    browser,
    model: model.trim().slice(0, 60),
    screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    language: (navigator.language || '').slice(0, 12),
  };
}

// One record per device per day: accessLogs/{yyyy-mm-dd}/{deviceId}
export async function logVisit({ uid, email, courtId }) {
  const dayKey = getTodayKey();
  const deviceId = getDeviceId();
  const sessionKey = `badbeaowLogged:${dayKey}:${uid}:${courtId || ''}`;
  try {
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, '1');
  } catch {
    // Without sessionStorage we may log twice; harmless
  }
  const info = await getDeviceInfo();
  const now = Date.now();
  let firstToday = true;
  try {
    firstToday = localStorage.getItem('badbeaowLastLogDay') !== dayKey;
    localStorage.setItem('badbeaowLastLogDay', dayKey);
  } catch {
    // ignore
  }
  const record = {
    ...info,
    uid,
    email: email || '',
    lastCourt: courtId || '',
    lastSeen: now,
    visits: increment(1),
    ...(firstToday ? { firstSeen: now } : {}),
  };
  await update(ref(db, `accessLogs/${dayKey}/${deviceId}`), record);
}
