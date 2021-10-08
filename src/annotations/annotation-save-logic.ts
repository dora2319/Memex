import { getNoteShareUrl } from 'src/content-sharing/utils'
import { AnnotationPrivacyLevels } from './types'
import type { AnnotationInterface } from './background/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { Anchor } from 'src/highlighting/types'

export interface AnnotationShareOpts {
    shouldShare?: boolean
    shouldUnshare?: boolean
    shouldShareToList?: boolean
    isBulkShareProtected?: boolean
}

type AnnotationCreateData = {
    fullPageUrl: string
    pageTitle?: string
    localId?: string
    createdWhen?: Date
    selector?: Anchor
} & ({ body: string; comment?: string } | { body?: string; comment: string })

interface AnnotationUpdateData {
    localId: string
    comment: string
}

export interface SaveAnnotationParams<
    T extends AnnotationCreateData | AnnotationUpdateData
> {
    annotationData: T
    annotationsBG: AnnotationInterface<'caller'>
    contentSharingBG: ContentSharingInterface
    shareOpts?: AnnotationShareOpts
    skipPageIndexing?: boolean
}

export interface SaveAnnotationReturnValue {
    remoteAnnotationLink: string | null
    savePromise: Promise<string>
}

export async function createAnnotation({
    annotationData,
    annotationsBG,
    contentSharingBG,
    skipPageIndexing,
    shareOpts,
}: SaveAnnotationParams<AnnotationCreateData>): Promise<
    SaveAnnotationReturnValue
> {
    let remoteAnnotationId: string
    if (shareOpts?.shouldShare) {
        remoteAnnotationId = await contentSharingBG.generateRemoteAnnotationId()
    }
    return {
        remoteAnnotationLink: shareOpts?.shouldShare
            ? getNoteShareUrl({ remoteAnnotationId })
            : null,
        savePromise: (async () => {
            const annotationUrl = await annotationsBG.createAnnotation(
                {
                    url: annotationData.localId,
                    createdWhen: annotationData.createdWhen,
                    pageUrl: annotationData.fullPageUrl,
                    selector: annotationData.selector,
                    title: annotationData.pageTitle,
                    comment: annotationData.comment,
                    body: annotationData.body,
                    isBulkShareProtected: shareOpts?.isBulkShareProtected,
                },
                { skipPageIndexing },
            )

            if (shareOpts?.shouldShare) {
                await contentSharingBG.shareAnnotation({
                    annotationUrl,
                    remoteAnnotationId,
                    shareToLists: shareOpts?.shouldShareToList,
                })
            }

            return annotationUrl
        })(),
    }
}

export async function updateAnnotation({
    annotationData,
    annotationsBG,
    contentSharingBG,
    shareOpts,
}: SaveAnnotationParams<AnnotationUpdateData>): Promise<
    SaveAnnotationReturnValue
> {
    let remoteAnnotationId: string
    if (shareOpts?.shouldShare) {
        remoteAnnotationId = await contentSharingBG.generateRemoteAnnotationId()
    }

    return {
        remoteAnnotationLink: shareOpts?.shouldShare
            ? getNoteShareUrl({ remoteAnnotationId })
            : null,
        savePromise: (async () => {
            await annotationsBG.editAnnotation(
                annotationData.localId,
                annotationData.comment,
            )

            await Promise.all([
                shareOpts?.shouldUnshare
                    ? contentSharingBG.unshareAnnotation({
                          annotationUrl: annotationData.localId,
                      })
                    : shareOpts?.shouldShare &&
                      contentSharingBG.shareAnnotation({
                          remoteAnnotationId,
                          annotationUrl: annotationData.localId,
                          shareToLists: shareOpts?.shouldShareToList,
                      }),
                shareOpts?.isBulkShareProtected &&
                    annotationsBG.updateAnnotationPrivacyLevel({
                        annotation: annotationData.localId,
                        privacyLevel: AnnotationPrivacyLevels.PROTECTED,
                    }),
            ])
            return annotationData.localId
        })(),
    }
}
