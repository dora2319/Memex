import { Browser } from 'webextension-polyfill-ts'
import { UIEvent } from 'ui-logic-core'
import { TaskState } from 'ui-logic-core/lib/types'

import {
    RootState as SearchResultsState,
    Events as SearchResultEvents,
    NoteDataEventArgs,
    PageEventArgs,
} from './search-results/types'
import {
    RootState as ListsSidebarState,
    Events as ListsSidebarEvents,
} from './lists-sidebar/types'
import {
    RootState as SyncModalState,
    Events as SyncModalEvents,
} from './header/sync-status-menu/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { SearchInterface } from 'src/search/background/types'
import { AnnotationInterface } from 'src/annotations/background/types'
import { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { ContentSharingInterface } from 'src/content-sharing/background/types'
import { Analytics } from 'src/analytics'
import { ActivityIndicatorInterface } from 'src/activity-indicator/background'
import { PublicSyncInterface } from 'src/sync/background/types'

export interface RootState {
    loadState: TaskState
    syncMenu: SyncModalState
    searchResults: SearchResultsState
    searchFilters: SearchFiltersState
    listsSidebar: ListsSidebarState
    modals: DashboardModalsState
}

export type Events = UIEvent<
    DashboardModalsEvents &
        SearchResultEvents &
        SearchFilterEvents &
        ListsSidebarEvents &
        SyncModalEvents & {
            search: { paginate?: boolean }
            example: null
        }
>

export interface DashboardDependencies {
    document: Document
    analytics: Analytics
    tagsBG: RemoteTagsInterface
    authBG: AuthRemoteFunctionsInterface
    syncBG: PublicSyncInterface
    contentShareBG: ContentSharingInterface
    listsBG: RemoteCollectionsInterface
    searchBG: SearchInterface
    annotationsBG: AnnotationInterface<'caller'>
    activityIndicatorBG: ActivityIndicatorInterface
    copyToClipboard: (text: string) => Promise<boolean>
    localStorage: Browser['storage']['local']
    openFeedUrl: () => void
}

export interface DropReceivingState {
    isDraggedOver?: boolean
    canReceiveDroppedItems?: boolean
    triggerSuccessfulDropAnimation?: boolean
    onDrop(dataTransfer: DataTransfer): void
    onDragEnter(): void
    onDragLeave(): void
}

export interface SearchResultTextPart {
    text: string
    match: boolean
}

export interface HoverState {
    onHoverEnter(id: number): void
    onHoverLeave(id: number): void
    isHovered: boolean
}

export interface SelectedState {
    onSelection(id: number): void
    isSelected: boolean
}

export interface DashboardModalsState {
    shareListId?: number
    showBetaFeature?: boolean
    showSubscription?: boolean
    showNoteShareOnboarding?: boolean

    deletingListId?: number
    deletingPageArgs?: PageEventArgs
    deletingNoteArgs?: NoteDataEventArgs
}

export type DashboardModalsEvents = UIEvent<{
    setShareListId: { listId?: number }
    setShowBetaFeatureModal: { isShown: boolean }
    setShowSubscriptionModal: { isShown: boolean }
    setShowNoteShareOnboardingModal: { isShown: boolean }

    setDeletingListId: { listId: number }
    setDeletingPageArgs: PageEventArgs
    setDeletingNoteArgs: NoteDataEventArgs
}>

export type ListSource = 'local-lists' | 'followed-list'

// TODO: move this into the filter's dir once merged in
export interface SearchFiltersState {
    searchQuery: string
    isSearchBarFocused: boolean
    searchFiltersOpen: boolean
    isTagFilterActive: boolean
    isDateFilterActive: boolean
    isDomainFilterActive: boolean

    dateFromInput: string
    dateToInput: string
    dateFrom?: number
    dateTo?: number

    tagsIncluded: string[]
    tagsExcluded: string[]
    domainsIncluded: string[]
    domainsExcluded: string[]

    limit: number
    skip: number
}

export type SearchFilterEvents = UIEvent<{
    setSearchQuery: { query: string }
    setSearchBarFocus: { isFocused: boolean }

    setSearchFiltersOpen: { isOpen: boolean }
    setTagFilterActive: { isActive: boolean }
    setDateFilterActive: { isActive: boolean }
    setDomainFilterActive: { isActive: boolean }

    setDateFromInputValue: { value: string }
    setDateToInputValue: { value: string }
    setDateFrom: { value: number }
    setDateTo: { value: number }

    addIncludedTag: { tag: string }
    delIncludedTag: { tag: string }
    addExcludedTag: { tag: string }
    delExcludedTag: { tag: string }

    addIncludedDomain: { domain: string }
    delIncludedDomain: { domain: string }
    addExcludedDomain: { domain: string }
    delExcludedDomain: { domain: string }

    setTagsIncluded: { tags: string[] }
    setTagsExcluded: { tags: string[] }
    setDomainsIncluded: { domains: string[] }
    setDomainsExcluded: { domains: string[] }

    resetFilters: null
}>
