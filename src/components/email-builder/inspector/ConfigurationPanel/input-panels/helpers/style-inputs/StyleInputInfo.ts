export type StyleInputDef = { key: string; label: string; type: string }

export const ALL_STYLE_INPUTS: StyleInputDef[] = [
  { key: 'backgroundColor', label: 'Background color', type: 'color' },
  { key: 'color', label: 'Text color', type: 'color' },
  { key: 'borderColor', label: 'Border color', type: 'color' },
  { key: 'fontFamily', label: 'Font family', type: 'font-family' },
  { key: 'fontSize', label: 'Font size', type: 'font-size' },
  { key: 'fontWeight', label: 'Font weight', type: 'font-weight' },
  { key: 'textAlign', label: 'Text align', type: 'text-align' },
  { key: 'padding', label: 'Padding', type: 'padding' },
  { key: 'borderRadius', label: 'Border radius', type: 'border-radius' },
]

export const MUI_STYLE_INPUTS = ALL_STYLE_INPUTS

export const STYLE_INPUT_MAP = Object.fromEntries(ALL_STYLE_INPUTS.map((s) => [s.key, s])) as Record<string, StyleInputDef>

export function filterStyleKeys(keys: string[]): StyleInputDef[] {
  return keys.map((k) => STYLE_INPUT_MAP[k]).filter(Boolean)
}
