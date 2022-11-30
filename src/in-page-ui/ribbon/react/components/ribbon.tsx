import React, { Component, KeyboardEventHandler } from 'react'
import qs from 'query-string'
import styled, { css } from 'styled-components'

import extractQueryFilters from 'src/util/nlp-time-filter'
import { Tooltip, ButtonTooltip } from 'src/common-ui/components/'
import {
    shortcuts,
    ShortcutElData,
} from 'src/options/settings/keyboard-shortcuts'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import type {
    Shortcut,
    BaseKeyboardShortcuts,
} from 'src/in-page-ui/keyboard-shortcuts/types'
import { HighlightInteractionsInterface } from 'src/highlighting/types'
import { RibbonSubcomponentProps } from './types'
import TagPicker from 'src/tags/ui/TagPicker'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import AnnotationCreate from 'src/annotations/components/AnnotationCreate'
import BlurredSidebarOverlay from 'src/in-page-ui/sidebar/react/components/blurred-overlay'
import QuickTutorial from '@worldbrain/memex-common/lib/editor/components/QuickTutorial'
import { FeedActivityDot } from 'src/activity-indicator/ui'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import type { ListDetailsGetter } from 'src/annotations/types'
import ExtraButtonsPanel from './extra-buttons-panel'
import FeedPanel from './feed-panel'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import browser from 'webextension-polyfill'

export interface Props extends RibbonSubcomponentProps {
    getRemoteFunction: (name: string) => (...args: any[]) => Promise<any>
    setRef?: (el: HTMLElement) => void
    isExpanded: boolean
    isRibbonEnabled: boolean
    shortcutsData: ShortcutElData[]
    showExtraButtons: boolean
    showTutorial: boolean
    getListDetailsById: ListDetailsGetter
    toggleShowExtraButtons: () => void
    toggleShowTutorial: () => void
    handleRibbonToggle: () => void
    handleRemoveRibbon: () => void
    highlighter: Pick<HighlightInteractionsInterface, 'removeHighlights'>
    hideOnMouseLeave?: boolean
    toggleFeed: () => void
    showFeed: boolean
}

interface State {
    shortcutsReady: boolean
    blockListValue: string
}

export default class Ribbon extends Component<Props, State> {
    static defaultProps: Pick<Props, 'shortcutsData'> = {
        shortcutsData: shortcuts,
    }

    private keyboardShortcuts: BaseKeyboardShortcuts
    private shortcutsData: Map<string, ShortcutElData>
    private openOverviewTabRPC
    private openOptionsTabRPC
    private annotationCreateRef // TODO: Figure out how to properly type refs to onClickOutside HOCs

    state: State = {
        shortcutsReady: false,
        blockListValue: this.getDomain(window.location.href),
    }

    constructor(props: Props) {
        super(props)
        this.shortcutsData = new Map(
            props.shortcutsData.map((s) => [s.name, s]) as [
                string,
                ShortcutElData,
            ][],
        )
        this.openOverviewTabRPC = this.props.getRemoteFunction(
            'openOverviewTab',
        )
        this.openOptionsTabRPC = this.props.getRemoteFunction('openOptionsTab')
    }

    async componentDidMount() {
        this.keyboardShortcuts = await getKeyboardShortcutsState()
        this.setState(() => ({ shortcutsReady: true }))
    }

    focusCreateForm = () => this.annotationCreateRef?.getInstance()?.focus()

    private handleSearchEnterPress: KeyboardEventHandler<HTMLInputElement> = (
        event,
    ) => {
        const queryFilters = extractQueryFilters(this.props.search.searchValue)
        const queryParams = qs.stringify(queryFilters)

        this.openOverviewTabRPC(queryParams)
        this.props.search.setShowSearchBox(false)
        this.props.search.setSearchValue('')
    }

    private handleCommentIconBtnClick = (event) => {
        if (event.shiftKey) {
            if (this.props.sidebar.isSidebarOpen) {
                this.props.sidebar.setShowSidebarCommentBox(true)
                return
            }
            this.props.commentBox.setShowCommentBox(
                !this.props.commentBox.showCommentBox,
            )
        } else {
            this.props.sidebar.openSidebar({})
        }
    }

    private getTooltipText(name: string): string {
        const elData = this.shortcutsData.get(name)
        const short: Shortcut = this.keyboardShortcuts[name]

        if (!elData) {
            return ''
        }

        let source = elData.tooltip

        if (['createBookmark', 'toggleSidebar'].includes(name)) {
            source = this.props.bookmark.isBookmarked
                ? elData.toggleOff
                : elData.toggleOn
        }

        return short.shortcut && short.enabled
            ? `${source} (${short.shortcut})`
            : source
    }

    private hideTagPicker = () => {
        this.props.tagging.setShowTagsPicker(false)
    }
    private hideListPicker = () => {
        this.props.lists.setShowListsPicker(false)
    }

    private renderTagsPicker() {
        if (!this.props.tagging.showTagsPicker) {
            return null
        }

        return (
            <HoverBox position="absolute" top="160px" right="40px">
                <BlurredSidebarOverlay
                    onOutsideClick={this.hideTagPicker}
                    skipRendering={!this.props.sidebar.isSidebarOpen}
                >
                    <TagPicker
                        {...this.props.tagging}
                        onUpdateEntrySelection={this.props.tagging.updateTags}
                        actOnAllTabs={this.props.tagging.tagAllTabs}
                        initialSelectedEntries={
                            this.props.tagging.fetchInitialTagSelections
                        }
                        onEscapeKeyDown={this.hideTagPicker}
                        handleClickOutside={this.hideTagPicker}
                    />
                </BlurredSidebarOverlay>
            </HoverBox>
        )
    }

    private renderCollectionsPicker() {
        if (!this.props.lists.showListsPicker) {
            return null
        }

        return (
            <HoverBox
                padding="10px 0"
                position="absolute"
                top="30px"
                right="40px"
            >
                <BlurredSidebarOverlay
                    onOutsideClick={this.hideListPicker}
                    skipRendering={!this.props.sidebar.isSidebarOpen}
                >
                    <CollectionPicker
                        {...this.props.lists}
                        spacesBG={this.props.spacesBG}
                        contentSharingBG={this.props.contentSharingBG}
                        actOnAllTabs={this.props.lists.listAllTabs}
                        initialSelectedListIds={
                            this.props.lists.fetchInitialListSelections
                        }
                        onEscapeKeyDown={this.hideListPicker}
                        handleClickOutside={this.hideListPicker}
                    />
                </BlurredSidebarOverlay>
            </HoverBox>
        )
    }

    private renderTutorial() {
        if (!this.props.showTutorial) {
            return
        }

        return (
            <BlurredSidebarOverlay
                onOutsideClick={() => this.props.toggleShowTutorial()}
                skipRendering={!this.props.sidebar.isSidebarOpen}
            >
                <QuickTutorial
                    getKeyboardShortcutsState={getKeyboardShortcutsState}
                    onClickOutside={() => this.props.toggleShowTutorial()}
                    onSettingsClick={() => this.openOptionsTabRPC('settings')}
                    onEscapeKeyDown={() => this.props.toggleShowTutorial()}
                />
            </BlurredSidebarOverlay>
        )
    }

    private whichFeed = () => {
        if (process.env.NODE_ENV === 'production') {
            return 'https://memex.social/feed'
        } else {
            return 'https://staging.memex.social/feed'
        }
    }

    private renderFeedInfo() {
        if (!this.props.showFeed) {
            return
        }

        return (
            <BlurredSidebarOverlay
                onOutsideClick={() => this.props.toggleFeed()}
                skipRendering={!this.props.sidebar.isSidebarOpen}
            >
                <FeedPanel closePanel={() => this.props.toggleFeed()}>
                    <FeedContainer>
                        <TitleContainer>
                            <Icon
                                heightAndWidth="30px"
                                filePath="feed"
                                hoverOff
                            />
                            <TitleContent>
                                <SectionTitle>Activity Feed</SectionTitle>
                                <SectionDescription>
                                    Updates from Spaces you follow or
                                    conversation you participate in
                                </SectionDescription>
                            </TitleContent>
                        </TitleContainer>
                        <FeedFrame src={this.whichFeed()} />
                    </FeedContainer>
                </FeedPanel>
            </BlurredSidebarOverlay>
        )
    }

    private getDomain(url) {
        const withoutProtocol = url.split('//')[1]

        if (withoutProtocol.startsWith('www.')) {
            return withoutProtocol.split('www.')[1].split('/')[0]
        } else {
            return withoutProtocol.split('/')[0]
        }
    }

    async addItemToBlockList(value) {
        // fetch current list
        const blockList = await browser.storage.local.get('blacklist')
        const currentBlockListJSON = blockList['blacklist']
        const currentBlockList = !currentBlockListJSON
            ? []
            : JSON.parse(currentBlockListJSON)

        const expression = value.replace(/\s+/g, '').replace('.', '\\.')

        // define new entry
        const newEntry = {
            expression: expression,
            dateAdded: Date.now(),
        }

        // write new list
        currentBlockList.push(newEntry)
        const serialized = JSON.stringify(currentBlockList)
        return browser.storage.local.set({ blacklist: serialized })

        // const currentBlockListJSON = JSON.parse(currentBlocklist['blacklist'])}
        // const newBlockListString = JSON.stringify(newBlockList[0])
        // const newBlockListFinal = { 'blacklist': "[" + newBlockListString + "]}" }

        // await browser.storage.local.set(newBlockListFinal)
    }

    private renderExtraButtons() {
        if (!this.props.showExtraButtons) {
            return
        }

        return (
            <BlurredSidebarOverlay
                onOutsideClick={() => this.props.toggleShowExtraButtons()}
                skipRendering={!this.props.sidebar.isSidebarOpen}
            >
                <ExtraButtonsPanel
                    closePanel={() => this.props.toggleShowExtraButtons()}
                >
                    <BlockListArea>
                        <BlockListTitleArea>
                            <Icon
                                filePath={'block'}
                                heightAndWidth="16px"
                                hoverOff
                            />
                            <InfoText>Disable Ribbon on this page</InfoText>
                            <Icon
                                onClick={() =>
                                    this.openOptionsTabRPC('blocklist')
                                }
                                filePath={'settings'}
                                heightAndWidth={'14px'}
                                color={'purple'}
                            />
                        </BlockListTitleArea>
                        <TextBoxArea>
                            <TextField
                                value={this.state.blockListValue}
                                onChange={(event) =>
                                    this.setState({
                                        blockListValue: (event.target as HTMLInputElement)
                                            .value,
                                    })
                                }
                                width="fill-available"
                            />
                            <Icon
                                heightAndWidth="22px"
                                filePath="plus"
                                color="purple"
                                onClick={() => {
                                    this.addItemToBlockList(
                                        this.state.blockListValue,
                                    )
                                    this.setState({
                                        blockListValue: 'Added to block list',
                                    })
                                    setTimeout(
                                        () => this.props.handleRemoveRibbon(),
                                        2000,
                                    )
                                }}
                            />
                        </TextBoxArea>
                    </BlockListArea>
                    <ExtraButtonRow
                        onClick={() => {
                            this.props.handleRibbonToggle()
                            this.props.sidebar.closeSidebar()
                        }}
                    >
                        <Icon
                            filePath={icons.quickActionRibbon}
                            heightAndWidth="22px"
                            hoverOff
                        />
                        {this.props.isRibbonEnabled ? (
                            <InfoText>Disable Ribbon</InfoText>
                        ) : (
                            <InfoText>Enable Ribbon</InfoText>
                        )}
                    </ExtraButtonRow>
                    <ExtraButtonRow
                        onClick={this.props.highlights.handleHighlightsToggle}
                    >
                        <Icon
                            filePath={
                                this.props.highlights.areHighlightsEnabled
                                    ? icons.highlighterFull
                                    : icons.highlighterEmpty
                            }
                            heightAndWidth="22px"
                            hoverOff
                        />
                        {this.props.isRibbonEnabled ? (
                            <InfoText>Hide Highlights</InfoText>
                        ) : (
                            <InfoText>Show Highlights</InfoText>
                        )}
                    </ExtraButtonRow>

                    <ExtraButtonRow
                        onClick={this.props.tooltip.handleTooltipToggle}
                    >
                        <Icon
                            filePath={
                                this.props.tooltip.isTooltipEnabled
                                    ? icons.tooltipOn
                                    : icons.tooltipOff
                            }
                            heightAndWidth="22px"
                            hoverOff
                        />
                        {this.props.isRibbonEnabled ? (
                            <InfoText>Hide Highlighter Tooltip</InfoText>
                        ) : (
                            <InfoText>Show Highlighter Tooltip</InfoText>
                        )}
                    </ExtraButtonRow>
                    <ExtraButtonRow
                        onClick={() =>
                            window.open('https://worldbrain.io/tutorials')
                        }
                    >
                        <Icon
                            filePath={icons.helpIcon}
                            heightAndWidth="22px"
                            hoverOff
                        />
                        <InfoText>Tutorials</InfoText>
                    </ExtraButtonRow>
                    <ExtraButtonRow
                        onClick={() => this.openOptionsTabRPC('settings')}
                    >
                        <Icon
                            filePath={icons.settings}
                            heightAndWidth="16px"
                            hoverOff
                        />
                        <InfoText>Settings</InfoText>
                    </ExtraButtonRow>
                    <ExtraButtonRow
                        onClick={() =>
                            window.open('https://worldbrain.io/feedback')
                        }
                    >
                        <Icon
                            filePath={icons.sadFace}
                            heightAndWidth="16px"
                            hoverOff
                        />
                        <InfoText>Feature Requests & Bugs</InfoText>
                    </ExtraButtonRow>
                </ExtraButtonsPanel>
            </BlurredSidebarOverlay>
        )
    }

    private renderTagsUIs() {
        if (!this.props.tagging.shouldShowTagsUIs) {
            return false
        }

        return (
            <>
                <ButtonTooltip
                    tooltipText={this.getTooltipText('addTag')}
                    position="leftNarrow"
                >
                    <Icon
                        onClick={() =>
                            this.props.tagging.setShowTagsPicker(
                                !this.props.tagging.showTagsPicker,
                            )
                        }
                        color={'greyScale9'}
                        heightAndWidth="22px"
                        filePath={
                            this.props.tagging.pageHasTags ||
                            this.props.tagging.tags.length > 0
                                ? icons.tagFull
                                : icons.tagEmpty
                        }
                    />
                </ButtonTooltip>
                {this.renderTagsPicker()}
            </>
        )
    }

    render() {
        if (!this.state.shortcutsReady) {
            return false
        }

        return (
            <OuterRibbon
                isPeeking={this.props.isExpanded}
                isSidebarOpen={this.props.sidebar.isSidebarOpen}
            >
                <InnerRibbon
                    ref={this.props.setRef}
                    isPeeking={this.props.isExpanded}
                    isSidebarOpen={this.props.sidebar.isSidebarOpen}
                >
                    {(this.props.isExpanded ||
                        this.props.sidebar.isSidebarOpen) && (
                        <React.Fragment>
                            <UpperPart>
                                <FeedIndicatorBox
                                    isSidebarOpen={
                                        this.props.sidebar.isSidebarOpen
                                    }
                                    onClick={() => this.props.toggleFeed()}
                                >
                                    <ButtonTooltip
                                        tooltipText={'View Feed Updates'}
                                        position="leftNarrow"
                                    >
                                        <FeedActivityDot
                                            key="activity-feed-indicator"
                                            {...this.props.activityIndicator}
                                        />
                                    </ButtonTooltip>
                                </FeedIndicatorBox>
                                {this.props.showFeed && (
                                    <HoverBox
                                        withRelativeContainer
                                        right="45px"
                                        height={'600px'}
                                        width={'500px'}
                                        padding={'0px'}
                                    >
                                        {this.renderFeedInfo()}
                                    </HoverBox>
                                )}
                                <HorizontalLine
                                    sidebaropen={
                                        this.props.sidebar.isSidebarOpen
                                    }
                                />
                                <PageAction>
                                    <ButtonTooltip
                                        tooltipText={this.getTooltipText(
                                            'createBookmark',
                                        )}
                                        position="leftNarrow"
                                    >
                                        <Icon
                                            onClick={() =>
                                                this.props.bookmark.toggleBookmark()
                                            }
                                            color={
                                                this.props.bookmark.isBookmarked
                                                    ? 'purple'
                                                    : 'greyScale9'
                                            }
                                            heightAndWidth="22px"
                                            filePath={
                                                this.props.bookmark.isBookmarked
                                                    ? icons.heartFull
                                                    : icons.heartEmpty
                                            }
                                        />
                                    </ButtonTooltip>
                                    {this.props.commentBox.showCommentBox && (
                                        <HoverBox
                                            position="absolute"
                                            top="115px"
                                            right="40px"
                                            padding={'0px'}
                                        >
                                            <AnnotationCreate
                                                {...this.props.tagging}
                                                ref={(ref) =>
                                                    (this.annotationCreateRef = ref)
                                                }
                                                hide={() =>
                                                    this.props.commentBox.setShowCommentBox(
                                                        false,
                                                    )
                                                }
                                                onSave={
                                                    this.props.commentBox
                                                        .saveComment
                                                }
                                                onCancel={
                                                    this.props.commentBox
                                                        .cancelComment
                                                }
                                                onTagsUpdate={
                                                    this.props.commentBox
                                                        .updateCommentBoxTags
                                                }
                                                onCommentChange={
                                                    this.props.commentBox
                                                        .changeComment
                                                }
                                                comment={
                                                    this.props.commentBox
                                                        .commentText
                                                }
                                                tags={
                                                    this.props.commentBox.tags
                                                }
                                                lists={
                                                    this.props.commentBox.lists
                                                }
                                                getListDetailsById={
                                                    this.props
                                                        .getListDetailsById
                                                }
                                                createNewList={
                                                    this.props.lists
                                                        .createNewEntry
                                                }
                                                addPageToList={
                                                    this.props.lists.selectEntry
                                                }
                                                removePageFromList={
                                                    this.props.lists
                                                        .unselectEntry
                                                }
                                                isRibbonCommentBox
                                                spacesBG={this.props.spacesBG}
                                                contentSharingBG={
                                                    this.props.contentSharingBG
                                                }
                                                autoFocus
                                            />
                                        </HoverBox>
                                    )}
                                    <ButtonTooltip
                                        tooltipText={this.getTooltipText(
                                            'addToCollection',
                                        )}
                                        position="leftNarrow"
                                    >
                                        <Icon
                                            onClick={() =>
                                                this.props.lists.setShowListsPicker(
                                                    !this.props.lists
                                                        .showListsPicker,
                                                )
                                            }
                                            color={
                                                this.props.lists.pageListIds
                                                    .length > 0
                                                    ? 'purple'
                                                    : 'greyScale9'
                                            }
                                            heightAndWidth="22px"
                                            filePath={
                                                this.props.lists.pageListIds
                                                    .length > 0
                                                    ? icons.collectionsFull
                                                    : icons.collectionsEmpty
                                            }
                                        />
                                    </ButtonTooltip>
                                    {this.renderCollectionsPicker()}
                                    {!this.props.sidebar.isSidebarOpen && (
                                        <ButtonTooltip
                                            tooltipText={
                                                <span>
                                                    {this.getTooltipText(
                                                        'toggleSidebar',
                                                    )}
                                                    <br />{' '}
                                                    <SubText>
                                                        Shift+Click to add note
                                                    </SubText>
                                                </span>
                                            }
                                            position="leftNarrow"
                                        >
                                            <Icon
                                                onClick={(e) =>
                                                    this.handleCommentIconBtnClick(
                                                        e,
                                                    )
                                                }
                                                color={'greyScale9'}
                                                heightAndWidth="22px"
                                                filePath={
                                                    this.props.commentBox
                                                        .isCommentSaved
                                                        ? icons.saveIcon
                                                        : // : this.props.hasAnnotations
                                                          // ? icons.commentFull
                                                          icons.commentEmpty
                                                }
                                            />
                                        </ButtonTooltip>
                                    )}
                                    <ButtonTooltip
                                        tooltipText={this.getTooltipText(
                                            'openDashboard',
                                        )}
                                        position="leftNarrow"
                                    >
                                        <Icon
                                            onClick={() =>
                                                this.openOverviewTabRPC()
                                            }
                                            color={'greyScale9'}
                                            heightAndWidth="22px"
                                            filePath={icons.searchIcon}
                                        />
                                    </ButtonTooltip>
                                </PageAction>
                            </UpperPart>
                            {!this.props.sidebar.isSidebarOpen && (
                                <HorizontalLine
                                    sidebaropen={
                                        this.props.sidebar.isSidebarOpen
                                    }
                                />
                            )}
                            <BottomSection
                                sidebaropen={this.props.sidebar.isSidebarOpen}
                            >
                                <ButtonTooltip
                                    tooltipText="Settings"
                                    position="leftNarrow"
                                >
                                    <Icon
                                        onClick={() =>
                                            this.props.toggleShowExtraButtons()
                                        }
                                        color={'darkText'}
                                        heightAndWidth="22px"
                                        filePath={icons.settings}
                                    />
                                </ButtonTooltip>
                                {this.props.showExtraButtons && (
                                    <HoverBox
                                        position="absolute"
                                        bottom="0px"
                                        right="45px"
                                        padding={'0px'}
                                    >
                                        {this.renderExtraButtons()}
                                    </HoverBox>
                                )}
                                <ButtonTooltip
                                    tooltipText="Quick Tutorial & Help"
                                    position="leftNarrow"
                                >
                                    <Icon
                                        onClick={() =>
                                            this.props.toggleShowTutorial()
                                        }
                                        color={'darkText'}
                                        heightAndWidth="22px"
                                        filePath={icons.helpIcon}
                                    />
                                </ButtonTooltip>
                                {this.props.showTutorial && (
                                    <HoverBox
                                        position="absolute"
                                        bottom="0px"
                                        right="45px"
                                        padding={'0px'}
                                        width={'400px'}
                                    >
                                        {this.renderTutorial()}
                                    </HoverBox>
                                )}
                                {!this.props.sidebar.isSidebarOpen && (
                                    <ButtonTooltip
                                        tooltipText={
                                            <span>
                                                Close sidebar this once.
                                                <br />
                                                <SubText>
                                                    Shift+Click to disable.
                                                </SubText>
                                            </span>
                                        }
                                        position="leftNarrow"
                                    >
                                        <Icon
                                            onClick={(event) => {
                                                if (
                                                    event.shiftKey &&
                                                    this.props.isRibbonEnabled
                                                ) {
                                                    this.props.handleRibbonToggle()
                                                } else {
                                                    this.props.handleRemoveRibbon()
                                                }
                                            }}
                                            color={'darkText'}
                                            heightAndWidth="22px"
                                            filePath={icons.removeX}
                                        />
                                    </ButtonTooltip>
                                )}
                            </BottomSection>
                        </React.Fragment>
                    )}
                </InnerRibbon>
            </OuterRibbon>
        )
    }
}

const BlockListArea = styled.div`
    padding: 0px 10px 15px 5px;
    border-bottom: 1px solid ${(props) => props.theme.colors.lightHover};
    display: flex;
    flex-direction: column;
    grid-gap: 5px;
    align-items: flex-start;
    margin-bottom: 5px;
`

const BlockListTitleArea = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    padding: 5px 10px;
`

const TextBoxArea = styled.div`
    display: flex;
    align-items: center;
    padding: 0 0 0 10px;
    width: fill-available;
    grid-gap: 5px;
`

const UpperPart = styled.div``

const BottomSection = styled.div<{ sidebaropen: boolean }>`
    align-self: center;
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    justify-content: center;
    align-items: center;
    padding: 8px 0px;
`

const OuterRibbon = styled.div<{ isPeeking; isSidebarOpen }>`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-self: center;
    width: 24px;
    height: 400px;

    /* box-shadow: -1px 2px 5px 0px rgba(0, 0, 0, 0.16); */
    line-height: normal;
    text-align: start;
    align-items: center;
    background: transparent;
    z-index: 2147483644;
    animation: slide-in ease-out;
    animation-duration: 0.05s;

    ${(props) =>
        props.isPeeking &&
        css`
            align-items: flex-end;
            width: 44px;
            padding-right: 25px;
        `}

    ${(props) =>
        props.isSidebarOpen &&
        css`
            box-shadow: none;
            display: flex;
            justify-content: center;
            height: 105vh;
            width: 40px;
            border-left: 1px solid ${(props) => props.theme.colors.lineGrey};
            align-items: flex-start;
            padding: 0 5px;
            background: ${(props) => props.theme.colors.backgroundColor};

            & .removeSidebar {
                visibility: hidden;
                display: none;
            }
        `}

        @keyframes slide-in {
        0% {
            right: -600px;
            opacity: 0%;
        }
        100% {
            right: 0px;
            opacity: 100%;
        }
    }
`

const InnerRibbon = styled.div<{ isPeeking; isSidebarOpen }>`
    position: absolute;
    top: 20px;
    width: 44px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5px 0;
    display: none;
    background: ${(props) => props.theme.colors.backgroundColorDarker};
    border: 1px solid ${(props) => props.theme.colors.lineGrey};

    ${(props) =>
        props.isPeeking &&
        css`
            border-radius: 8px;
            display: flex;
            box-shadow: 0px 22px 26px 18px rgba(0, 0, 0, 0.03);
            background: ${(props) => props.theme.colors.backgroundColorDarker};
        }
    `}

    ${(props) =>
        props.isSidebarOpen &&
        css`
            box-shadow: none;
            height: 90%;
            top: 0px;
            width: 40px;
            justify-content: space-between;
            padding-top: 17px;
            display: flex;
            background: transparent;
            border: none;
            align-items: center;
            background: ${(props) => props.theme.colors.backgroundColor};
        `}
`

const ExtraButtonRow = styled.div`
    height: 40px;
    display: flex;
    grid-gap: 10px;
    align-items: center;
    width: fill-available;
    cursor: pointer;
    border-radius: 3px;
    padding: 0 15px;

    &:hover {
        background: ${(props) => props.theme.colors.backgroundColorDarker};
    }
`

const GeneralActions = styled.div`
    display: grid;
    grid-gap: 5px;
    margin-top: 15px;
    grid-auto-flow: row;
    align-items: center;
    justify-content: center;
`

const HorizontalLine = styled.div<{ sidebaropen: boolean }>`
    width: 100%;
    margin: 5px 0;
    height: 1px;
    background-color: ${(props) => props.theme.colors.lightHover};
`

const PageAction = styled.div`
    display: grid;
    grid-gap: 10px;
    grid-auto-flow: row;
    align-items: center;
    justify-content: center;
    padding: 10px;
`

const SubText = styled.span`
    font-size: 10px;
`

const FeedIndicatorBox = styled.div<{ isSidebarOpen: boolean }>`
    display: flex;
    justify-content: center;
    margin: ${(props) => (props.isSidebarOpen ? '2px 0 15px' : '10px 0')};
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    font-weight: 400;
`

const FeedFrame = styled.iframe`
    width: fill-available;
    height: 600px;
    border: none;
    border-radius: 10px;
`

const FeedContainer = styled.div`
    display: flex;
    width: fill-available;
    height: 580px;
    justify-content: flex-start;
    align-items: center;
    flex-direction: column;
    grid-gap: 20px;
    padding-top: 20px;
    max-width: 800px;
    background: ${(props) => props.theme.colors.backgroundColor};
    border-radius: 10px;
`

const TitleContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    grid-gap: 15px;
    width: fill-available;
    padding: 0 20px 20px 20px;
    border-bottom: 1px solid ${(props) => props.theme.colors.lightHover};
`
const TitleContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    grid-gap: 10px;
    width: fill-available;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 20px;
    font-weight: bold;
`
const SectionDescription = styled.div`
    color: ${(props) => props.theme.colors.greyScale8};
    font-size: 14px;
    font-weight: 300;
`
