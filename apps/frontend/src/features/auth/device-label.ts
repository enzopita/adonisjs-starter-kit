const BROWSERS: [RegExp, string][] = [
  [/Edg\//u, 'Edge'],
  [/OPR\//u, 'Opera'],
  [/Firefox\//u, 'Firefox'],
  [/CriOS\//u, 'Chrome'],
  [/Chrome\//u, 'Chrome'],
  [/Version\/.*Safari\//u, 'Safari'],
  [/Safari\//u, 'Safari'],
];

const OSES: [RegExp, string][] = [
  [/Windows/u, 'Windows'],
  [/Mac OS X|Macintosh/u, 'macOS'],
  [/Android/u, 'Android'],
  [/iPhone|iPad|iPod/u, 'iOS'],
  [/Linux/u, 'Linux'],
];

export type DeviceLabel = {
  browser: string | null;
  os: string | null;
  raw: string | null;
};

/** The browser and OS a raw `User-Agent` header names, for a sessions list row. */
export function parseDeviceLabel(userAgent: string | null): DeviceLabel {
  if (userAgent === null || userAgent === '') {
    return { browser: null, os: null, raw: null };
  }

  const browser =
    BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null;

  const os = OSES.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null;

  return {
    browser,
    os,
    raw: browser === null && os === null ? userAgent : null,
  };
}
