export * from '@worldbrain/memex-common/lib/content-sharing/client-storage/types'
import type {
    ListKeysServiceInterface,
    ListSharingServiceInterface,
    AnnotationSharingServiceInterface,
} from '@worldbrain/memex-common/lib/content-sharing/service/types'
import type { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type {
    RemoteFunction,
    RemoteFunctionRole,
} from 'src/util/webextensionRPC'

export interface ContentSharingInterface
    extends Pick<
            ListKeysServiceInterface,
            'deleteKeyLink' | 'getExistingKeyLinksForList'
        >,
        Pick<
            AnnotationSharingServiceInterface,
            | 'shareAnnotation'
            | 'setAnnotationPrivacyLevel'
            | 'getAnnotationSharingState'
            | 'getAnnotationSharingStates'
        >,
        Pick<ListSharingServiceInterface, 'shareList'> {
    shareAnnotations(options: {
        annotationUrls: string[]
        shareToLists?: boolean
        setBulkShareProtected?: boolean
    }): Promise<{ sharingStates: AnnotationSharingStates }>
    unshareAnnotations(options: {
        annotationUrls: string[]
        setBulkShareProtected?: boolean
    }): Promise<{ sharingStates: AnnotationSharingStates }>
    ensureRemotePageId(normalizedPageUrl: string): Promise<string>
    getRemoteAnnotationLink(params: {
        annotationUrl: string
    }): Promise<string | null>
    generateRemoteAnnotationId(): Promise<string>
    getRemoteListId(options: { localListId: number }): Promise<string | null>
    getRemoteListIds(options: {
        localListIds: number[]
    }): Promise<{ [localListId: number]: string | null }>
    getRemoteAnnotationIds(params: {
        annotationUrls: string[]
    }): Promise<{ [localId: string]: string | number }>
    getRemoteAnnotationMetadata(params: {
        annotationUrls: string[]
    }): Promise<{
        [localId: string]: {
            localId: string
            remoteId: string | number
            excludeFromLists?: boolean
        }
    }>
    shareAnnotationToSomeLists(options: {
        annotationUrl: string
        localListIds: number[]
        protectAnnotation?: boolean
    }): Promise<{ sharingState: AnnotationSharingState }>
    unshareAnnotationFromList(options: {
        annotationUrl: string
        localListId: number
    }): Promise<{ sharingState: AnnotationSharingState }>
    executePendingActions(): Promise<void>
    findAnnotationPrivacyLevels(params: {
        annotationUrls: string[]
    }): Promise<{
        [annotationUrl: string]: AnnotationPrivacyLevels
    }>
}

export interface RemoteContentSharingByTabsInterface<
    Role extends RemoteFunctionRole
> {
    schedulePageLinkCreation: RemoteFunction<
        Role,
        {
            fullPageUrl: string
            now?: number
        },
        {
            listTitle: string
            localListId: number
            remoteListId: AutoPk
            remoteListEntryId: AutoPk
        }
    >
    waitForPageLinkCreation: RemoteFunction<
        Role,
        { fullPageUrl: string },
        { keyString: string }
    >
}

/**
 * These are all old, no-longer-used content sharing BG RPCs.
 * Don't want to delete the implementations just yet, but still want to separate them from the used interface.
 */
export interface __DeprecatedContentSharingInterface {
    shareAnnotationsToAllLists(options: {
        annotationUrls: string[]
    }): Promise<{ sharingStates: AnnotationSharingStates }>
    unshareAnnotation(options: {
        annotationUrl: string
    }): Promise<{ sharingState: AnnotationSharingState }>
    deleteAnnotationShare(params: { annotationUrl: string }): Promise<void>
    deleteAnnotationPrivacyLevel(params: { annotation: string }): Promise<void>
    suggestSharedLists(params: {
        prefix: string
    }): Promise<
        Array<{
            localId: number
            name: string
            remoteId: string
            createdAt: number
        }>
    >
    canWriteToSharedList(params: { localId: number }): Promise<boolean>
    canWriteToSharedListRemoteId(params: { remoteId: string }): Promise<boolean>
    unshareAnnotationsFromAllLists(options: {
        annotationUrls: string[]
        setBulkShareProtected?: boolean
    }): Promise<{ sharingStates: AnnotationSharingStates }>
    getAllRemoteLists(): Promise<
        Array<{ localId: number; remoteId: string; name: string }>
    >
    areListsShared(options: {
        localListIds: number[]
    }): Promise<{ [listId: number]: boolean }>
    waitForSync(): Promise<void>
}

export interface ContentSharingEvents {
    pageAddedToSharedList(options: { pageUrl: string }): void
    pageRemovedFromSharedList(options: { pageUrl: string }): void
}

export interface AnnotationSharingState {
    hasLink: boolean
    remoteId?: string | number
    privacyLevel: AnnotationPrivacyLevels
    privateListIds: number[]
    sharedListIds: number[]
}

export interface AnnotationSharingStates {
    [annotationUrl: string]: AnnotationSharingState
}
