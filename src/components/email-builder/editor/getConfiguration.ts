import { TEditorConfiguration } from './core'

export const EMPTY_DOCUMENT: TEditorConfiguration = {
  root: {
    type: 'EmailLayout',
    data: {
      backdropColor: '#F5F5F5',
      canvasColor: '#FFFFFF',
      textColor: '#262626',
      fontFamily: 'MODERN_SANS',
      childrenIds: [],
    },
  },
}

export default function getConfiguration(
  _template?: string
): TEditorConfiguration {
  return EMPTY_DOCUMENT
}
