import React from 'react'

import { Box, Chip } from '@mui/material'

import BaseSidebarPanel from './helpers/BaseSidebarPanel'
import ColorInput from './helpers/inputs/ColorInput'
import RadioGroupInput from './helpers/inputs/RadioGroupInput'
import SliderInput from './helpers/inputs/SliderInput'
import TextInput from './helpers/inputs/TextInput'
import SingleStylePropertyPanel from './helpers/style-inputs/SingleStylePropertyPanel'

import { SOCIAL_PLATFORM_LABELS, SocialPlatform } from '../../../blocks/SocialLinks/SocialLinksIcons'

type Props = {
  data: any
  setData: (data: any) => void
}

const ALLOWED_KEYS = ['textAlign', 'padding']

export default function SocialLinksSidebarPanel({ data, setData }: Props) {
  const style = data.style ?? {}
  const props_ = data.props ?? {}
  const links = props_.links ?? []

  const togglePlatform = (platform: string) => {
    const exists = links.find((l: any) => l.platform === platform)
    let newLinks
    if (exists) {
      newLinks = links.filter((l: any) => l.platform !== platform)
    } else {
      newLinks = [...links, { platform, url: `https://${platform}.com`, enabled: true }]
    }
    setData({ ...data, props: { ...props_, links: newLinks } })
  }

  const updateUrl = (platform: string, url: string | null | undefined) => {
    const newLinks = links.map((l: any) => l.platform === platform ? { ...l, url } : l)
    setData({ ...data, props: { ...props_, links: newLinks } })
  }

  const allPlatforms: SocialPlatform[] = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'github', 'tiktok', 'pinterest', 'globe', 'email']

  return (
    <BaseSidebarPanel title="Social Links">
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {allPlatforms.map((p) => {
          const isActive = links.some((l: any) => l.platform === p)
          return (
            <Chip
              key={p}
              label={SOCIAL_PLATFORM_LABELS[p]}
              size="small"
              variant={isActive ? 'filled' : 'outlined'}
              color={isActive ? 'primary' : 'default'}
              onClick={() => togglePlatform(p)}
            />
          )
        })}
      </Box>

      {links.map((link: any) => (
        <TextInput
          key={link.platform}
          label={`${SOCIAL_PLATFORM_LABELS[link.platform as SocialPlatform] ?? link.platform} URL`}
          value={link.url}
          onChange={(url) => updateUrl(link.platform, url)}
        />
      ))}

      <RadioGroupInput
        label="Layout"
        value={props_.alignment ?? 'horizontal'}
        options={[
          { value: 'horizontal', label: 'Horizontal' },
          { value: 'vertical', label: 'Vertical' },
        ]}
        onChange={(alignment) => setData({ ...data, props: { ...props_, alignment } })}
      />

      <SliderInput label="Icon size" value={style.iconSize} onChange={(iconSize) => setData({ ...data, style: { ...style, iconSize } })} min={12} max={64} />
      <ColorInput label="Icon color" value={style.iconColor} onChange={(iconColor) => setData({ ...data, style: { ...style, iconColor } })} />
      <SliderInput label="Icon gap" value={style.iconGap} onChange={(iconGap) => setData({ ...data, style: { ...style, iconGap } })} min={0} max={48} />
      <ColorInput label="Icon background" value={style.iconBackgroundColor} onChange={(iconBackgroundColor) => setData({ ...data, style: { ...style, iconBackgroundColor } })} />
      <SliderInput label="Icon border radius" value={style.iconBorderRadius} onChange={(iconBorderRadius) => setData({ ...data, style: { ...style, iconBorderRadius } })} min={0} max={30} />
      <SliderInput label="Icon padding" value={style.iconPadding} onChange={(iconPadding) => setData({ ...data, style: { ...style, iconPadding } })} min={0} max={20} />
      <SingleStylePropertyPanel allowedKeys={ALLOWED_KEYS} style={style} onChange={(s) => setData({ ...data, style: { ...style, ...s } })} />
    </BaseSidebarPanel>
  )
}
