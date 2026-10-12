import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../stores/appStore'

describe('container management', () => {
  beforeEach(() => useAppStore.getState().reset())

  it('creates a valid hierarchy and selects a newly created list', () => {
    const store = useAppStore.getState()
    const space = store.createContainer('workspace', 'space', 'Operations').data!
    const folder = useAppStore.getState().createContainer(space.id, 'folder', 'Weekly planning').data!
    const list = useAppStore.getState().createContainer(folder.id, 'list', 'Monday').data!

    expect(list.type).toBe('list')
    expect(useAppStore.getState().selectedListId).toBe(list.id)
    expect(useAppStore.getState().statuses.filter((status) => status.listId === list.id)).toHaveLength(3)
  })

  it('rejects an invalid parent-child relationship and blank names', () => {
    const store = useAppStore.getState()

    expect(store.createContainer('workspace', 'list', 'Invalid')).toMatchObject({ error: { code: 422 } })
    expect(store.createContainer('workspace', 'space', '  ')).toMatchObject({ error: { code: 422 } })
  })

  it('renames and archives a container with descendants', () => {
    const store = useAppStore.getState()

    expect(store.updateContainer('q2', { name: 'Q3 Launch' })).toMatchObject({ data: { name: 'Q3 Launch' } })

    store.archiveContainer('q2')
    const state = useAppStore.getState()

    expect(state.containers.find((item) => item.id === 'q2')?.archivedAt).toBeTruthy()
    expect(state.containers.find((item) => item.id === 'launch')?.archivedAt).toBeTruthy()
    expect(state.containers.find((item) => item.id === 'platform')?.archivedAt).toBeTruthy()
  })

  it('restricts container management to admins', () => {
    const store = useAppStore.getState(); store.setCurrentUser('bob')

    expect(store.createContainer('workspace', 'space', 'Nope')).toMatchObject({ error: { code: 403 } })
  })

  it('reorders siblings while keeping position values normalized', () => {
    const store = useAppStore.getState()

    expect(store.moveContainer('platform', 'up')).toMatchObject({ data: undefined })

    const siblings = useAppStore.getState().containers.filter((item) => item.parentId === 'q2' && !item.archivedAt).sort((a, b) => a.position - b.position)

    expect(siblings.map((item) => item.id)).toEqual(['platform', 'launch'])
    expect(siblings.map((item) => item.position)).toEqual([0, 1])
  })
})
