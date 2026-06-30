import {
  type AppearanceSettings,
  type EnvironmentPreset,
  DEFAULT_APPEARANCE,
} from '../scenery/appearance-context'

const ENVIRONMENT_PRESETS: EnvironmentPreset[] = [
  'apartment',
  'city',
  'dawn',
  'forest',
  'lobby',
  'night',
  'park',
  'studio',
  'sunset',
  'warehouse',
]

interface AppearancePanelProps {
  settings: AppearanceSettings
  onUpdate: (patch: Partial<AppearanceSettings>) => void
}

const S = {
  panel: {
    width: '260px',
    maxHeight: '75vh',
    overflowY: 'auto' as const,
    padding: '10px',
    fontSize: '11px',
    color: '#ccc',
    boxSizing: 'border-box' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  headerLabel: {
    fontWeight: 700,
    fontSize: '11px',
    color: '#aaa',
    letterSpacing: '0.05em',
  },
  resetBtn: {
    fontSize: '10px',
    padding: '2px 8px',
    border: '1px solid #555',
    borderRadius: '3px',
    background: 'transparent',
    color: '#aaa',
    cursor: 'pointer',
  },
  section: {
    borderTop: '1px solid #444',
    marginTop: '10px',
    paddingTop: '6px',
    marginBottom: '4px',
  },
  sectionLabel: {
    fontSize: '9px',
    fontWeight: 700,
    color: '#666',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: '6px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '5px',
  },
  label: {
    flex: '0 0 72px',
    fontSize: '11px',
    color: '#888',
  },
  value: {
    flex: '0 0 44px',
    textAlign: 'right' as const,
    fontSize: '10px',
    color: '#666',
  },
  slider: {
    flex: 1,
    accentColor: '#c47c2a',
    cursor: 'pointer',
    minWidth: 0,
  },
  colorSwatch: {
    width: '24px',
    height: '18px',
    padding: '1px',
    border: '1px solid #555',
    borderRadius: '3px',
    cursor: 'pointer',
    background: 'transparent',
    flexShrink: 0,
  },
  colorHex: {
    fontSize: '10px',
    color: '#666',
    fontFamily: 'monospace',
  },
  select: {
    flex: 1,
    fontSize: '11px',
    padding: '2px 4px',
    border: '1px solid #555',
    borderRadius: '3px',
    background: '#1a1a1a',
    color: '#aaa',
    cursor: 'pointer',
    minWidth: 0,
  },
}

interface SliderRowProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  unit?: string
  onChange: (value: number) => void
}

function SliderRow({ label, min, max, step, value, unit, onChange }: SliderRowProps) {
  const decimals = step < 0.1 ? 2 : step < 1 ? 1 : 0
  const display = value.toFixed(decimals) + (unit ? ` ${unit}` : '')
  return (
    <div style={S.row}>
      <span style={S.label}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={S.slider}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span style={S.value}>{display}</span>
    </div>
  )
}

interface ColorRowProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function ColorRow({ label, value, onChange }: ColorRowProps) {
  return (
    <div style={S.row}>
      <span style={S.label}>{label}</span>
      <input
        type="color"
        value={value}
        style={S.colorSwatch}
        onChange={(e) => onChange(e.target.value)}
      />
      <span style={S.colorHex}>{value}</span>
    </div>
  )
}

interface SelectRowProps {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}

function SelectRow({ label, value, options, onChange }: SelectRowProps) {
  return (
    <div style={S.row}>
      <span style={S.label}>{label}</span>
      <select
        value={value}
        style={S.select}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

function Section({ title }: { title: string }) {
  return (
    <div style={S.section}>
      <div style={S.sectionLabel}>{title}</div>
    </div>
  )
}

export function AppearancePanel({ settings, onUpdate }: AppearancePanelProps) {
  return (
    <div style={S.panel}>

      <div style={S.header}>
        <span style={S.headerLabel}>Lighting</span>
        <button style={S.resetBtn} type="button" onClick={() => onUpdate(DEFAULT_APPEARANCE)}>
          Reset
        </button>
      </div>

      {/* ── Environment ── */}
      <Section title="Environment (IBL)" />
      <SelectRow
        label="Preset"
        value={settings.environmentPreset}
        options={ENVIRONMENT_PRESETS}
        onChange={(v) => onUpdate({ environmentPreset: v as EnvironmentPreset })}
      />
      <SliderRow
        label="Intensity"
        min={0} max={3} step={0.05}
        value={settings.environmentIntensity}
        onChange={(v) => onUpdate({ environmentIntensity: v })}
      />

      {/* ── Sun light ── */}
      <Section title="Sun light (directional)" />
      <SliderRow
        label="Azimuth"
        min={0} max={360} step={1}
        value={settings.keyLightAzimuth}
        unit="°"
        onChange={(v) => onUpdate({ keyLightAzimuth: v })}
      />
      <SliderRow
        label="Elevation"
        min={5} max={85} step={1}
        value={settings.keyLightElevation}
        unit="°"
        onChange={(v) => onUpdate({ keyLightElevation: v })}
      />
      <SliderRow
        label="Intensity"
        min={0} max={10} step={0.1}
        value={settings.keyLightIntensity}
        onChange={(v) => onUpdate({ keyLightIntensity: v })}
      />
      <ColorRow
        label="Color"
        value={settings.keyLightColor}
        onChange={(v) => onUpdate({ keyLightColor: v })}
      />

      {/* ── Shadows ── */}
      <Section title="Shadows (PCSS)" />
      <SliderRow
        label="Penumbra"
        min={1} max={100} step={1}
        value={settings.shadowSize}
        onChange={(v) => onUpdate({ shadowSize: v })}
      />
      <SliderRow
        label="Samples"
        min={4} max={32} step={4}
        value={settings.shadowSamples}
        onChange={(v) => onUpdate({ shadowSamples: v })}
      />

      {/* ── Ambient ── */}
      <Section title="Ambient fill" />
      <SliderRow
        label="Intensity"
        min={0} max={1} step={0.02}
        value={settings.ambientIntensity}
        onChange={(v) => onUpdate({ ambientIntensity: v })}
      />

      {/* ── Ambient Occlusion ── */}
      <Section title="Ambient Occlusion (N8AO)" />
      <div style={S.row}>
        <span style={S.label}>Enabled</span>
        <input
          type="checkbox"
          checked={settings.n8aoEnabled}
          onChange={(e) => onUpdate({ n8aoEnabled: e.target.checked })}
        />
      </div>
      {settings.n8aoEnabled && (
        <>
          <SliderRow
            label="Intensity"
            min={0} max={20} step={0.5}
            value={settings.n8aoIntensity}
            onChange={(v) => onUpdate({ n8aoIntensity: v })}
          />
          <SliderRow
            label="Radius"
            min={0.05} max={2} step={0.05}
            value={settings.n8aoRadius}
            onChange={(v) => onUpdate({ n8aoRadius: v })}
          />
          <SliderRow
            label="Falloff"
            min={0.1} max={5} step={0.1}
            value={settings.n8aoDistanceFalloff}
            onChange={(v) => onUpdate({ n8aoDistanceFalloff: v })}
          />
        </>
      )}

    </div>
  )
}
