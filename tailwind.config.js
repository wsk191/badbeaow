import plugin from 'tailwindcss/plugin';
import defaultColors from 'tailwindcss/colors';

// Theme system: every palette color is read from a CSS variable (--c-<hue>-<shade>),
// and backgrounds / text / borders get an extra override layer (--bg-, --tx-, --bd-)
// so the dark themes can flip light surfaces dark and dark text light
// without touching any class names in the components.

const NEUTRALS = ['slate', 'gray', 'zinc', 'neutral', 'stone'];
const CHROMATIC = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];
const HUES = [...NEUTRALS, ...CHROMATIC];
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const hexToRgb = hex => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const triplet = rgb => rgb.map(Math.round).join(' ');
const mix = (a, b, amount) => a.map((value, i) => value * amount + b[i] * (1 - amount));

const withVar = (layer, hue, shade) => layer
  ? `rgb(var(--${layer}-${hue}-${shade}, var(--c-${hue}-${shade})) / <alpha-value>)`
  : `rgb(var(--c-${hue}-${shade}) / <alpha-value>)`;

const palette = (layer, pickShades) => Object.fromEntries(HUES.map(hue => [
  hue,
  Object.fromEntries(SHADES.map(shade => [shade, withVar(pickShades(hue, shade) ? layer : null, hue, shade)])),
]));

// Solid white surfaces follow the theme; translucent white (glass on colored headers) stays white.
const surfaceWhite = ({ opacityValue }) => {
  const opacity = parseFloat(opacityValue);
  if (!Number.isNaN(opacity) && opacity < 0.6) return `rgb(255 255 255 / ${opacityValue})`;
  return `rgb(var(--bg-white, 255 255 255) / ${opacityValue ?? 1})`;
};

const isLightShade = (hue, shade) => shade <= 200;

// ---- Theme definitions -------------------------------------------------------

const DARK_TEXT_NEUTRAL = { 500: 400, 600: 300, 700: 200, 800: 100, 900: 50, 950: 50 };
const DARK_TEXT_CHROMA = { 600: 400, 700: 300, 800: 200, 900: 200, 950: 100 };

const themes = {
  dark: {
    surfaces: ['#0b0e16', '#141824', '#1d2230', '#2a3040'],
    borders: ['#1d2230', '#262c3b', '#323949', '#414a5c'],
    palette: {},
  },
  halloween: {
    surfaces: ['#0e0912', '#1a1020', '#26182e', '#34233d'],
    borders: ['#26182e', '#33213c', '#432c4d', '#55395f'],
    palette: {},
    // The BADBEAOW wordmark fades from purple to pumpkin orange.
    extra: { '--wordmark-to': triplet(hexToRgb(defaultColors.orange[500])) },
  },
};

function themeVars({ surfaces, borders, palette: remap, extra = {} }) {
  const vars = {};
  const source = hue => defaultColors[remap[hue] ?? hue];
  const [s0, s1, s2, s3] = surfaces.map(hexToRgb);

  for (const hue of Object.keys(remap)) {
    for (const shade of SHADES) vars[`--c-${hue}-${shade}`] = triplet(hexToRgb(source(hue)[shade]));
  }

  for (const hue of NEUTRALS) {
    vars[`--bg-${hue}-50`] = triplet(s0);
    vars[`--bg-${hue}-100`] = triplet(s2);
    vars[`--bg-${hue}-200`] = triplet(s3);
    [50, 100, 200, 300].forEach((shade, i) => { vars[`--bd-${hue}-${shade}`] = triplet(hexToRgb(borders[i])); });
    for (const [from, to] of Object.entries(DARK_TEXT_NEUTRAL)) vars[`--tx-${hue}-${from}`] = `var(--c-${hue}-${to})`;
  }

  for (const hue of CHROMATIC) {
    const accent = hexToRgb(source(hue)[500]);
    vars[`--bg-${hue}-50`] = triplet(mix(accent, s1, 0.12));
    vars[`--bg-${hue}-100`] = triplet(mix(accent, s1, 0.2));
    vars[`--bg-${hue}-200`] = triplet(mix(accent, s1, 0.3));
    [[50, 0.18], [100, 0.28], [200, 0.38], [300, 0.5]].forEach(([shade, amount]) => {
      vars[`--bd-${hue}-${shade}`] = triplet(mix(accent, s1, amount));
    });
    for (const [from, to] of Object.entries(DARK_TEXT_CHROMA)) vars[`--tx-${hue}-${from}`] = `var(--c-${hue}-${to})`;
  }

  vars['--bg-white'] = triplet(s1);
  vars['--page-bg'] = triplet(s0);
  vars['color-scheme'] = 'dark';
  return { ...vars, ...extra };
}

// Courts 2–4 recolor the purple accent inside their screen. Text sits one shade
// darker than the background shade for contrast on light surfaces.
const COURT_ACCENTS = { 'court-2': 'amber', 'court-3': 'emerald', 'court-4': 'sky' };

function courtAccentVars(hue) {
  const vars = {};
  SHADES.forEach((shade, i) => {
    const darker = SHADES[Math.min(i + 1, SHADES.length - 1)];
    const textShade = shade >= 500 ? darker : shade;
    vars[`--c-purple-${shade}`] = `var(--c-${hue}-${shade})`;
    vars[`--bg-purple-${shade}`] = `var(--bg-${hue}-${shade}, var(--c-${hue}-${shade}))`;
    vars[`--bd-purple-${shade}`] = `var(--bd-${hue}-${shade}, var(--c-${hue}-${shade}))`;
    vars[`--tx-purple-${shade}`] = `var(--tx-${hue}-${textShade}, var(--c-${hue}-${textShade}))`;
  });
  return vars;
}

const themePlugin = plugin(({ addBase }) => {
  const root = { '--page-bg': '249 250 251', '--wordmark-to': 'var(--c-indigo-600)' };
  for (const hue of HUES) {
    for (const shade of SHADES) root[`--c-${hue}-${shade}`] = triplet(hexToRgb(defaultColors[hue][shade]));
  }
  addBase({
    ':root': root,
    ...Object.fromEntries(Object.entries(themes).map(([name, theme]) => [`:root[data-theme="${name}"]`, themeVars(theme)])),
    ...Object.fromEntries(Object.entries(COURT_ACCENTS).map(([courtId, hue]) => [`.court-theme-${courtId}`, courtAccentVars(hue)])),
    'html, body': { backgroundColor: 'rgb(var(--page-bg))' },
  });
});

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: palette(null, () => false),
      backgroundColor: { ...palette('bg', isLightShade), white: surfaceWhite },
      gradientColorStops: { ...palette('bg', isLightShade), white: surfaceWhite },
      textColor: palette('tx', (hue, shade) => shade >= 500),
      borderColor: palette('bd', (hue, shade) => shade <= 300),
      divideColor: palette('bd', (hue, shade) => shade <= 300),
    },
  },
  plugins: [themePlugin],
}
