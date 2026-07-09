import { create } from 'zustand'

import getConfiguration from './getConfiguration'

import { TEditorConfiguration } from './core'

const HISTORY_MAX = 50
const AUTOSAVE_KEY = 'mailforge-builder-autosave'

type TValue = {
  document: TEditorConfiguration

  selectedBlockId: string | null
  selectedBlockIds: string[]
  selectedSidebarTab: 'block-configuration' | 'styles'
  selectedMainTab: 'editor' | 'preview' | 'json' | 'html'
  selectedScreenSize: 'desktop' | 'mobile'

  inspectorDrawerOpen: boolean
  samplesDrawerOpen: boolean

  history: TEditorConfiguration[]
  historyIndex: number
  zoom: number

  clipboard: TEditorConfiguration | null

  searchOpen: boolean
  searchQuery: string
}

const initialDoc = getConfiguration(window.location.hash)

const editorStateStore = create<TValue>(() => ({
  document: initialDoc,
  selectedBlockId: null,
  selectedBlockIds: [],
  selectedSidebarTab: 'styles',
  selectedMainTab: 'editor',
  selectedScreenSize: 'desktop',

  inspectorDrawerOpen: true,
  samplesDrawerOpen: true,

  history: [structuredClone(initialDoc)],
  historyIndex: 0,
  zoom: 100,

  clipboard: null,

  searchOpen: false,
  searchQuery: '',
}))

export function useDocument() {
  return editorStateStore((s) => s.document)
}

export function useSelectedBlockId() {
  return editorStateStore((s) => s.selectedBlockId)
}

export function useSelectedBlockIds() {
  return editorStateStore((s) => s.selectedBlockIds)
}

export function useSelectedScreenSize() {
  return editorStateStore((s) => s.selectedScreenSize)
}

export function useSelectedMainTab() {
  return editorStateStore((s) => s.selectedMainTab)
}

export function setSelectedMainTab(selectedMainTab: TValue['selectedMainTab']) {
  return editorStateStore.setState({ selectedMainTab })
}

export function useSelectedSidebarTab() {
  return editorStateStore((s) => s.selectedSidebarTab)
}

export function useInspectorDrawerOpen() {
  return editorStateStore((s) => s.inspectorDrawerOpen)
}

export function useSamplesDrawerOpen() {
  return editorStateStore((s) => s.samplesDrawerOpen)
}

export function useZoom() {
  return editorStateStore((s) => s.zoom)
}

export function useSearchOpen() {
  return editorStateStore((s) => s.searchOpen)
}

export function useSearchQuery() {
  return editorStateStore((s) => s.searchQuery)
}

export function setSelectedBlockId(selectedBlockId: TValue['selectedBlockId']) {
  const selectedSidebarTab = selectedBlockId === null ? 'styles' : 'block-configuration'
  if (selectedBlockId !== null) {
    editorStateStore.setState({ inspectorDrawerOpen: true })
  }
  return editorStateStore.setState({
    selectedBlockId,
    selectedBlockIds: selectedBlockId ? [selectedBlockId] : [],
    selectedSidebarTab,
  })
}

export function toggleBlockSelection(blockId: string) {
  const current = editorStateStore.getState().selectedBlockIds
  const id = editorStateStore.getState().selectedBlockId
  if (current.includes(blockId)) {
    const next = current.filter((b) => b !== blockId)
    editorStateStore.setState({ selectedBlockIds: next, selectedBlockId: next.length === 1 ? next[0] : next.length > 0 ? next[next.length - 1] : null })
  } else {
    const next = [...current, blockId]
    editorStateStore.setState({ selectedBlockIds: next, selectedBlockId: blockId })
  }
}

export function setSelectedBlockIds(ids: string[]) {
  editorStateStore.setState({ selectedBlockIds: ids, selectedBlockId: ids.length === 1 ? ids[0] : ids.length > 0 ? ids[ids.length - 1] : null })
}

export function setSidebarTab(selectedSidebarTab: TValue['selectedSidebarTab']) {
  editorStateStore.setState({ selectedSidebarTab })
}

function pushHistory(document: TEditorConfiguration) {
  const state = editorStateStore.getState()
  const newHistory = state.history.slice(0, state.historyIndex + 1)
  newHistory.push(structuredClone(document))
  if (newHistory.length > HISTORY_MAX) newHistory.shift()
  editorStateStore.setState({ history: newHistory, historyIndex: newHistory.length - 1 })
}

export function resetDocument(document: TValue['document']) {
  editorStateStore.setState({
    document,
    selectedSidebarTab: 'styles',
    selectedBlockId: null,
    selectedBlockIds: [],
  })
  pushHistory(document)
}

export function setDocument(document: TValue['document']) {
  const originalDocument = editorStateStore.getState().document
  const newDoc = { ...originalDocument, ...document }
  editorStateStore.setState({ document: newDoc })
  pushHistory(newDoc)
}

export function toggleInspectorDrawerOpen() {
  const inspectorDrawerOpen = !editorStateStore.getState().inspectorDrawerOpen
  editorStateStore.setState({ inspectorDrawerOpen })
}

export function toggleSamplesDrawerOpen() {
  const samplesDrawerOpen = !editorStateStore.getState().samplesDrawerOpen
  editorStateStore.setState({ samplesDrawerOpen })
}

export function setSelectedScreenSize(selectedScreenSize: TValue['selectedScreenSize']) {
  editorStateStore.setState({ selectedScreenSize })
}

export function getDocumentSnapshot() {
  return editorStateStore.getState().document
}

export function setDocumentFull(document: TValue['document']) {
  editorStateStore.setState({ document, history: [structuredClone(document)], historyIndex: 0 })
}

export function setZoom(zoom: number) {
  editorStateStore.setState({ zoom: Math.max(25, Math.min(200, zoom)) })
}

export function setSearchOpen(open: boolean) {
  editorStateStore.setState({ searchOpen: open })
}

export function setSearchQuery(query: string) {
  editorStateStore.setState({ searchQuery: query })
}

export function clipboardCopy() {
  const state = editorStateStore.getState()
  const ids = state.selectedBlockIds.length > 0 ? state.selectedBlockIds : state.selectedBlockId ? [state.selectedBlockId] : []
  const cloned: TEditorConfiguration = {}
  for (const id of ids) {
    if (state.document[id]) {
      cloned[id] = structuredClone(state.document[id])
    }
  }
  editorStateStore.setState({ clipboard: cloned })
}

export function clipboardPaste() {
  const state = editorStateStore.getState()
  if (!state.clipboard) return
  const newDoc = { ...state.document }
  const newIds: string[] = []
  for (const [id, block] of Object.entries(state.clipboard)) {
    const newId = Math.random().toString(36).substring(2, 10)
    newDoc[newId] = structuredClone(block)
    newIds.push(newId)
  }
  editorStateStore.setState({ document: newDoc })
  pushHistory(newDoc)
  if (newIds.length === 1) {
    setSelectedBlockId(newIds[0])
  } else if (newIds.length > 1) {
    setSelectedBlockIds(newIds)
  }
}

export function clipboardCut() {
  clipboardCopy()
  deleteSelectedBlocks()
}

export function deleteSelectedBlocks() {
  const state = editorStateStore.getState()
  const ids = state.selectedBlockIds.length > 0 ? state.selectedBlockIds : state.selectedBlockId ? [state.selectedBlockId] : []
  if (ids.length === 0) return
  const newDoc = { ...state.document }
  for (const id of ids) {
    delete newDoc[id]
  }
  const removeFromParents = (doc: TEditorConfiguration) => {
    for (const [, block] of Object.entries(doc)) {
      if (block.data?.childrenIds) {
        block.data.childrenIds = block.data.childrenIds.filter((cid: string) => !ids.includes(cid))
      }
      if (block.data?.props?.childrenIds) {
        block.data.props.childrenIds = block.data.props.childrenIds.filter((cid: string) => !ids.includes(cid))
      }
      if (block.data?.props?.columns) {
        for (const col of block.data.props.columns) {
          if (col.childrenIds) {
            col.childrenIds = col.childrenIds.filter((cid: string) => !ids.includes(cid))
          }
        }
      }
    }
  }
  removeFromParents(newDoc)
  editorStateStore.setState({ document: newDoc, selectedBlockId: null, selectedBlockIds: [] })
  pushHistory(newDoc)
}

export function undo() {
  const state = editorStateStore.getState()
  if (state.historyIndex <= 0) return
  const newIndex = state.historyIndex - 1
  editorStateStore.setState({ document: structuredClone(state.history[newIndex]), historyIndex: newIndex })
}

export function redo() {
  const state = editorStateStore.getState()
  if (state.historyIndex >= state.history.length - 1) return
  const newIndex = state.historyIndex + 1
  editorStateStore.setState({ document: structuredClone(state.history[newIndex]), historyIndex: newIndex })
}

export function duplicateSelectedBlocks() {
  clipboardCopy()
  clipboardPaste()
}

export function moveSelectedBlocks(direction: 'up' | 'down') {
  const state = editorStateStore.getState()
  const id = state.selectedBlockId
  if (!id) return

  for (const [, block] of Object.entries(state.document)) {
    const moveIn = (arr: string[]) => {
      const idx = arr.indexOf(id)
      if (idx === -1) return false
      if (direction === 'up' && idx > 0) {
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
        return true
      }
      if (direction === 'down' && idx < arr.length - 1) {
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
        return true
      }
      return false
    }
    if (block.data?.childrenIds && moveIn(block.data.childrenIds)) {
      pushHistory(state.document)
      editorStateStore.setState({ document: { ...state.document } })
      return
    }
    if (block.data?.props?.childrenIds && moveIn(block.data.props.childrenIds)) {
      pushHistory(state.document)
      editorStateStore.setState({ document: { ...state.document } })
      return
    }
    if (block.data?.props?.columns) {
      for (const col of block.data.props.columns) {
        if (col.childrenIds && moveIn(col.childrenIds)) {
          pushHistory(state.document)
          editorStateStore.setState({ document: { ...state.document } })
          return
        }
      }
    }
  }
}

export function scheduleAutoSave() {
  const doc = editorStateStore.getState().document
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(doc))
  } catch {}
}

export function loadAutoSave(): TEditorConfiguration | null {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export function clearAutoSave() {
  try {
    localStorage.removeItem(AUTOSAVE_KEY)
  } catch {}
}

export function searchInDocument(query: string): string[] {
  if (!query.trim()) return []
  const doc = editorStateStore.getState().document
  const results: string[] = []
  const lowerQuery = query.toLowerCase()

  for (const [id, block] of Object.entries(doc)) {
    const asStr = JSON.stringify(block).toLowerCase()
    if (asStr.includes(lowerQuery)) {
      results.push(id)
    }
  }
  return results
}
