import { useEffect, useState } from 'react';

/** Tokens exposed in the live editor. Not the full set — enough to prove retheming works. */
const COLOR_TOKENS = [
  ['--tbl-border', 'Border'],
  ['--tbl-header-bg', 'Header background'],
  ['--tbl-header-fg', 'Header text'],
  ['--tbl-cell-bg', 'Cell background'],
  ['--tbl-cell-fg', 'Cell text'],
  ['--tbl-row-hover-bg', 'Row hover'],
  ['--tbl-cell-hover-bg', 'Cell hover'],
  ['--tbl-row-selected-bg', 'Row selected'],
  ['--tbl-focus-ring', 'Focus ring'],
  ['--tbl-tone-info-bg', 'Tone: info'],
  ['--tbl-tone-warning-bg', 'Tone: warning'],
  ['--tbl-tone-danger-bg', 'Tone: danger'],
  ['--tbl-checkbox-checked-bg', 'Checkbox filled'],
  ['--tbl-checkbox-border', 'Checkbox border'],
] as const;

const SIZE_TOKENS = [
  ['--tbl-row-height', 'Row height', 24, 72, 'px'],
  ['--tbl-cell-px', 'Cell padding X', 0, 32, 'px'],
  ['--tbl-cell-py', 'Cell padding Y', 0, 24, 'px'],
  ['--tbl-border-width', 'Border width', 0, 4, 'px'],
  ['--tbl-row-depth-step', 'Depth shading', 0, 30, '%'],
  ['--tbl-radius', 'Corner radius', 0, 24, 'px'],
] as const;

/** Named presets that only touch CSS variables — no component changes at all. */
const PRESETS = {
  'i-ESG (default)': {},
  Ocean: {
    '--tbl-border': '#dbeafe',
    '--tbl-header-bg': '#eff6ff',
    '--tbl-header-fg': '#1e3a8a',
    '--tbl-cell-fg': '#0f172a',
    '--tbl-row-hover-bg': '#f8fafc',
    '--tbl-cell-hover-bg': '#e0f2fe',
    '--tbl-row-selected-bg': '#e0f2fe',
    '--tbl-focus-ring': '#0284c7',
    '--tbl-tone-info-bg': '#e0e7ff',
    '--tbl-radius': '8px',
  },
  Terminal: {
    '--tbl-border': '#3f3f46',
    '--tbl-header-bg': '#18181b',
    '--tbl-header-fg': '#a1a1aa',
    '--tbl-cell-bg': '#09090b',
    '--tbl-cell-fg': '#e4e4e7',
    '--tbl-row-hover-bg': '#18181b',
    '--tbl-cell-hover-bg': '#1c1917',
    '--tbl-row-selected-bg': '#164e63',
    '--tbl-row-selected-fg': '#ecfeff',
    '--tbl-focus-ring': '#22d3ee',
    '--tbl-empty-fg': '#71717a',
    '--tbl-tone-muted-bg': '#18181b',
    '--tbl-tone-muted-fg': '#a1a1aa',
    '--tbl-tone-info-bg': '#1e3a5f',
    '--tbl-tone-info-fg': '#bfdbfe',
    '--tbl-tone-warning-bg': '#422006',
    '--tbl-tone-warning-fg': '#fde68a',
    '--tbl-tone-danger-bg': '#450a0a',
    '--tbl-tone-danger-fg': '#fecaca',
    '--tbl-cell-disabled-bg': '#18181b',
    '--tbl-cell-disabled-fg': '#52525b',
    '--tbl-row-disabled-bg': '#18181b',
    '--tbl-row-disabled-fg': '#52525b',
    '--tbl-checkbox-bg': '#09090b',
    '--tbl-checkbox-border': '#52525b',
    '--tbl-checkbox-checked-bg': '#22d3ee',
    '--tbl-checkbox-checked-border': '#22d3ee',
    '--tbl-checkbox-mark': '#09090b',
    '--tbl-checkbox-disabled-bg': '#18181b',
    '--tbl-checkbox-disabled-border': '#3f3f46',
    '--tbl-radius': '0px',
  },
  Compact: {
    '--tbl-row-height': '28px',
    '--tbl-cell-py': '2px',
    '--tbl-cell-px': '8px',
    '--tbl-border': '#e2e8f0',
    '--tbl-header-bg': '#f8fafc',
    '--tbl-row-selected-bg': '#fef3c7',
    '--tbl-cell-hover-bg': '#fefce8',
    '--tbl-focus-ring': '#f59e0b',
  },
} satisfies Record<string, Record<string, string>>;

type PresetName = keyof typeof PRESETS;

function readVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** getComputedStyle can return rgb(); <input type=color> needs #rrggbb. */
function toHex(value: string) {
  if (value.startsWith('#')) return value.length === 4 ? `#${[...value.slice(1)].map((c) => c + c).join('')}` : value;
  const match = value.match(/\d+/g);
  if (!match || match.length < 3) return '#000000';
  return `#${match
    .slice(0, 3)
    .map((n) => Number(n).toString(16).padStart(2, '0'))
    .join('')}`;
}

export function ThemeEditor() {
  const [preset, setPreset] = useState<PresetName>('i-ESG (default)');
  const [values, setValues] = useState<Record<string, string>>({});
  const [tick, setTick] = useState(0);

  // Applying a preset clears every inline override first, so presets never stack.
  useEffect(() => {
    const root = document.documentElement;
    for (const [token] of COLOR_TOKENS) root.style.removeProperty(token);
    for (const [token] of SIZE_TOKENS) root.style.removeProperty(token);
    for (const token of Object.keys(PRESETS.Terminal)) root.style.removeProperty(token);
    for (const [token, value] of Object.entries(PRESETS[preset])) {
      root.style.setProperty(token, value);
    }
    setValues({});
    setTick((t) => t + 1);
  }, [preset]);

  const setToken = (token: string, value: string) => {
    document.documentElement.style.setProperty(token, value);
    setValues((previous) => ({ ...previous, [token]: value }));
  };

  return (
    <aside className='sticky top-6 h-fit w-72 shrink-0 rounded-lg border border-slate-200 bg-white p-4 text-slate-900 shadow-sm'>
      <h2 className='font-semibold text-sm'>Theme tokens</h2>
      <p className='mt-1 text-slate-500 text-xs leading-relaxed'>
        Every control below writes a CSS variable on <code className='text-[11px]'>:root</code>. No component prop
        changes.
      </p>

      <label className='mt-4 block'>
        <span className='font-medium text-slate-600 text-xs'>Preset</span>
        <select
          className='mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm'
          value={preset}
          onChange={(event) => setPreset(event.target.value as PresetName)}
        >
          {Object.keys(PRESETS).map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>

      <div className='mt-4 space-y-1.5'>
        {COLOR_TOKENS.map(([token, label]) => (
          <label key={token} className='flex items-center justify-between gap-2'>
            <span className='truncate text-slate-600 text-xs' title={token}>
              {label}
            </span>
            <input
              type='color'
              className='h-6 w-10 shrink-0 cursor-pointer rounded border border-slate-300'
              value={values[token] ?? toHex(readVar(token) || '#ffffff')}
              key={`${token}-${tick}`}
              onChange={(event) => setToken(token, event.target.value)}
            />
          </label>
        ))}
      </div>

      <div className='mt-4 space-y-2.5 border-slate-200 border-t pt-4'>
        {SIZE_TOKENS.map(([token, label, min, max, unit]) => {
          const current = Number.parseFloat(values[token] ?? readVar(token)) || 0;
          return (
            <label key={token} className='block'>
              <span className='flex justify-between text-slate-600 text-xs'>
                {label}
                <span className='tabular-nums text-slate-400'>
                  {current}
                  {unit}
                </span>
              </span>
              <input
                type='range'
                className='mt-0.5 w-full accent-slate-700'
                min={min}
                max={max}
                value={current}
                key={`${token}-${tick}`}
                onChange={(event) => setToken(token, `${event.target.value}${unit}`)}
              />
            </label>
          );
        })}
      </div>
    </aside>
  );
}
