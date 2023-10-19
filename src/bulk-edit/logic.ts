import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'
import { executeUITask, loadInitial } from 'src/util/ui-logic'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { TaskState } from 'ui-logic-core/lib/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import { deleteBulkEdit, getBulkEditItems } from './utils'
import { browser } from 'webextension-polyfill-ts'
import { SearchInterface } from 'src/search/background/types'
import { BULK_SELECT_STORAGE_KEY } from './constants'

export interface Dependencies {
    // contentSharingBG: ContentSharingInterface
    // spacesBG: RemoteCollectionsInterface
    // searchBG: SearchInterface
    deleteBulkSelection: (pageId) => Promise<void>
    selectAllPages: () => Promise<void>
    clearBulkSelection: () => Promise<void>
    bulkDeleteLoadingState: TaskState
}

export type Event = UIEvent<{
    showBulkEditSelectionBox: { isShown: boolean }
    promptConfirmDeleteBulkSelection: { isShown: boolean }
    deleteBulkSelection: { pageId: boolean }
    selectAllPages: null
}>

export interface State {
    loadState: TaskState
    showBulkEditSelectionBox: boolean
    bulkSelectedItems: []
    itemCounter: number
    showConfirmBulkDeletion: boolean
}

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class BulkEditLogic extends UILogic<State, Event> {
    static MSG_TIMEOUT = 2000

    constructor(protected dependencies: Dependencies) {
        super()
        this.listenToNewBulkItems = this.listenToNewBulkItems.bind(this)
    }

    getInitialState = (): State => ({
        loadState: 'pristine',
        showBulkEditSelectionBox: false,
        bulkSelectedItems: [],
        itemCounter: null,
        showConfirmBulkDeletion: false,
    })

    init: EventHandler<'init'> = async ({ previousState }) => {
        const selectedItems = await getBulkEditItems()
        const itemCounter = selectedItems.length

        this.emitMutation({
            bulkSelectedItems: { $set: selectedItems },
            itemCounter: { $set: itemCounter },
        })

        browser.storage.onChanged.addListener(this.listenToNewBulkItems)
    }

    listenToNewBulkItems(changes, area) {
        const changedItems = Object.keys(changes)
        for (const item of changedItems) {
            if (item === BULK_SELECT_STORAGE_KEY) {
                this.emitMutation({
                    bulkSelectedItems: { $set: changes[item].newValue },
                    itemCounter: { $set: changes[item].newValue?.length },
                })
            }
        }
    }

    showBulkEditSelectionBox: EventHandler<
        'showBulkEditSelectionBox'
    > = async ({ previousState, event }) => {
        this.emitMutation({
            showBulkEditSelectionBox: { $set: event.isShown },
        })
    }

    promptConfirmDeleteBulkSelection: EventHandler<
        'promptConfirmDeleteBulkSelection'
    > = async ({ previousState, event }) => {
        this.emitMutation({
            showConfirmBulkDeletion: { $set: event.isShown },
        })
    }

    deleteBulkSelection: EventHandler<'deleteBulkSelection'> = async ({
        previousState,
        event,
    }) => {
        await deleteBulkEdit(this.dependencies.deleteBulkSelection)
    }
    selectAllPages: EventHandler<'selectAllPages'> = async ({
        previousState,
        event,
    }) => {
        await this.dependencies.selectAllPages()
    }
}
