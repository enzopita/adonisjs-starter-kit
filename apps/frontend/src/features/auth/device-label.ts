const BROWSERS: [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/OPR\//, 'Opera'],
  [/Firefox\//, 'Firefox'],
  [/CriOS\//, 'Chrome'],
  [/Chrome\//, 'Chrome'],
  [/Version\/.*Safari\//, 'Safari'],
  [/Safari\//, 'Safari'],
];

const OSES: [RegExp, string][] = [
  [/Windows/, 'Windows'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Android/, 'Android'],
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Linux/, 'Linux'],
];

export type DeviceLabel = {
  browser: string | null;
  os: string | null;
  raw: string | null;
};

/** The browser and OS a raw `User-Agent` header names, for a sessions list row. */
export function parseDeviceLabel(userAgent: string | null): DeviceLabel {
  if (!userAgent) return { browser: null, os: null, raw: null };

  const browser =
    BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null;
  const os = OSES.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null;

  return { browser, os, raw: browser || os ? null : userAgent };
}
