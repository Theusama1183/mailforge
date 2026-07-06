import React from 'react'

import { Box, Divider } from '@mui/material'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import ColorInput from './helpers/inputs/ColorInput'
import RadioGroupInput from './helpers/inputs/RadioGroupInput'
import SliderInput from './helpers/inputs/SliderInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'

type Props = {
  data: any
  setData: (data: any) => void
}

const BASE_KEYS = ['backgroundColor', 'borderColor', 'borderRadius', 'padding']

export default function ContainerSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
  const backgroundType = style.backgroundType ?? 'solid'

  return (
    <BaseSidebarPanel title="Container">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <RadioGroupInput
          label="Display mode"
          value={style.display ?? 'block'}
          options={[
            { value: 'block', label: 'Block' },
            { value: 'flex', label: 'Flex' },
            { value: 'inline-flex', label: 'Inline flex' },
          ]}
          onChange={(display) => setData({ ...data, style: { ...style, display } })}
        />

        {(style.display === 'flex' || style.display === 'inline-flex') && (
          <>
            <RadioGroupInput
              label="Direction"
              value={style.flexDirection ?? 'row'}
              options={[
                { value: 'row', label: 'Row' },
                { value: 'column', label: 'Column' },
                { value: 'row-reverse', label: 'Row reverse' },
                { value: 'column-reverse', label: 'Column reverse' },
              ]}
              onChange={(flexDirection) => setData({ ...data, style: { ...style, flexDirection } })}
            />
            <RadioGroupInput
              label="Wrap"
              value={style.flexWrap ?? 'nowrap'}
              options={[
                { value: 'nowrap', label: 'No wrap' },
                { value: 'wrap', label: 'Wrap' },
              ]}
              onChange={(flexWrap) => setData({ ...data, style: { ...style, flexWrap } })}
            />
            <RadioGroupInput
              label="Align items"
              value={style.alignItems ?? 'stretch'}
              options={[
                { value: 'flex-start', label: 'Start' },
                { value: 'center', label: 'Center' },
                { value: 'flex-end', label: 'End' },
                { value: 'stretch', label: 'Stretch' },
              ]}
              onChange={(alignItems) => setData({ ...data, style: { ...style, alignItems } })}
            />
            <RadioGroupInput
              label="Justify content"
              value={style.justifyContent ?? 'flex-start'}
              options={[
                { value: 'flex-start', label: 'Start' },
                { value: 'center', label: 'Center' },
                { value: 'flex-end', label: 'End' },
                { value: 'space-between', label: 'Space between' },
                { value: 'space-around', label: 'Space around' },
                { value: 'space-evenly', label: 'Space evenly' },
              ]}
              onChange={(justifyContent) => setData({ ...data, style: { ...style, justifyContent } })}
            />
            <SliderInput label="Gap (px)" value={style.gap} onChange={(gap) => setData({ ...data, style: { ...style, gap } })} min={0} max={80} />
          </>
        )}

        <Divider />

        <RadioGroupInput
          label="Background type"
          value={backgroundType}
          options={[
            { value: 'solid', label: 'Solid color' },
            { value: 'gradient', label: 'Gradient' },
          ]}
          onChange={(backgroundType) => setData({ ...data, style: { ...style, backgroundType } })}
        />

        {backgroundType === 'solid' ? (
          <SingleStylePropertyPanel allowedKeys={BASE_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
        ) : (
          <>
            <RadioGroupInput
              label="Gradient type"
              value={style.gradientType ?? 'linear'}
              options={[
                { value: 'linear', label: 'Linear' },
                { value: 'radial', label: 'Radial' },
              ]}
              onChange={(gradientType) => setData({ ...data, style: { ...style, gradientType } })}
            />
            {(!style.gradientType || style.gradientType === 'linear') && (
              <SliderInput label="Angle" value={style.gradientAngle} onChange={(gradientAngle) => setData({ ...data, style: { ...style, gradientAngle } })} min={0} max={360} />
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(style.gradientColorStops?.length ? style.gradientColorStops : [{ color: '#667eea', position: 0 }, { color: '#764ba2', position: 100 }]).map((stop: { color: string; position: number }, i: number) => (
                <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <ColorInput
                    label={`Stop ${i + 1}`}
                    value={stop.color}
                    onChange={(color) => {
                      const stops = [...(style.gradientColorStops ?? [])]
                      if (color) stops[i] = { ...stops[i], color }
                      setData({ ...data, style: { ...style, gradientColorStops: stops } })
                    }}
                  />
                  <SliderInput label="Position" value={stop.position} onChange={(position) => {
                      const stops = [...(style.gradientColorStops ?? [])]
                      stops[i] = { ...stops[i], position: position ?? stop.position }
                      setData({ ...data, style: { ...style, gradientColorStops: stops } })
                    }} min={0} max={100} />
                </Box>
              ))}
              <RadioGroupInput
                label="Stops"
                value={`${style.gradientColorStops?.length ?? 2}`}
                options={[
                  { value: '2', label: '2 stops' },
                  { value: '3', label: '3 stops' },
                ]}
                onChange={(v) => {
                  const count = parseInt(v, 10)
                  const current = style.gradientColorStops ?? [{ color: '#667eea', position: 0 }, { color: '#764ba2', position: 100 }]
                  const stops = count === 2
                    ? [current[0] ?? { color: '#667eea', position: 0 }, current[current.length - 1] ?? { color: '#764ba2', position: 100 }]
                    : [current[0] ?? { color: '#667eea', position: 0 }, { color: '#3b82f6', position: 50 }, current[current.length - 1] ?? { color: '#1e40af', position: 100 }]
                  setData({ ...data, style: { ...style, gradientColorStops: stops } })
                }}
              />
            </Box>
            <SingleStylePropertyPanel allowedKeys={['borderColor', 'borderRadius', 'padding']} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
          </>
        )}

        <Divider />

        <RadioGroupInput
          label="Mobile display"
          value={style.mobileDisplay ?? style.display ?? 'block'}
          options={[
            { value: 'block', label: 'Block' },
            { value: 'flex', label: 'Flex' },
            { value: 'inline-flex', label: 'Inline flex' },
          ]}
          onChange={(mobileDisplay) => setData({ ...data, style: { ...style, mobileDisplay } })}
        />
        <RadioGroupInput
          label="Mobile direction"
          value={style.mobileFlexDirection ?? style.flexDirection ?? 'column'}
          options={[
            { value: 'row', label: 'Row' },
            { value: 'column', label: 'Column' },
            { value: 'row-reverse', label: 'Row reverse' },
            { value: 'column-reverse', label: 'Column reverse' },
          ]}
          onChange={(mobileFlexDirection) => setData({ ...data, style: { ...style, mobileFlexDirection } })}
        />
        <SliderInput label="Mobile gap" value={style.mobileGap} onChange={(mobileGap) => setData({ ...data, style: { ...style, mobileGap } })} min={0} max={80} />

        <Divider />

        <Box sx={{ typography: 'overline', color: 'text.secondary' }}>Advanced</Box>
        <SliderInput
          label="Minimum height (px)"
          value={style.minHeight}
          onChange={(minHeight) => setData({ ...data, style: { ...style, minHeight } })}
          min={0}
          max={1000}
        />
        <RadioGroupInput
          label="Overflow"
          value={style.overflow ?? 'visible'}
          options={[
            { value: 'visible', label: 'Visible' },
            { value: 'hidden', label: 'Hidden' },
            { value: 'scroll', label: 'Scroll' },
            { value: 'auto', label: 'Auto' },
          ]}
          onChange={(overflow) => setData({ ...data, style: { ...style, overflow } })}
        />
      </Box>
    </BaseSidebarPanel>
  )
}

