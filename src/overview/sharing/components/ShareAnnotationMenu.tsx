import React, { PureComponent } from 'react'
import styled from 'styled-components'
import Mousetrap from 'mousetrap'
import { TaskState } from 'ui-logic-core/lib/types'

import { executeReactStateUITask } from 'src/util/ui-logic'
import SharePrivacyOption, {
    Props as PrivacyOptionProps,
} from './SharePrivacyOption'
import { TypographyTextNormal } from 'src/common-ui/components/design-library/typography'
import { LoadingIndicator } from 'src/common-ui/components'
import * as icons from 'src/common-ui/components/design-library/icons'
import { ClickAway } from 'src/util/click-away-wrapper'
import Margin from 'src/dashboard-refactor/components/Margin'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const COPY_TIMEOUT = 2000

export interface ShorcutHandlerDict {
    [shortcut: string]: () => Promise<void>
}

export interface Props {
    onCopyLinkClick: () => Promise<void>
    privacyOptionsTitleCopy: React.ReactNode
    shortcutHandlerDict?: ShorcutHandlerDict
    onClickOutside?: React.MouseEventHandler
    onPlusBtnClick?: React.MouseEventHandler
    privacyOptions: PrivacyOptionProps[]
    linkTitleCopy: React.ReactNode
    isLoading: boolean
    showLink: boolean
    link: string
}

interface State {
    copyState: TaskState
}

class ShareAnnotationMenu extends PureComponent<Props, State> {
    copyTimeout?: ReturnType<typeof setTimeout>
    state: State = { copyState: 'pristine' }

    componentDidMount() {
        if (this.props.shortcutHandlerDict) {
            for (const [shortcut, handler] of Object.entries(
                this.props.shortcutHandlerDict,
            )) {
                Mousetrap.bind(shortcut, handler)
            }
        }
    }

    componentWillUnmount() {
        if (this.copyTimeout) {
            clearTimeout(this.copyTimeout)
        }

        if (this.props.shortcutHandlerDict) {
            for (const shortcut of Object.keys(
                this.props.shortcutHandlerDict,
            )) {
                Mousetrap.unbind(shortcut)
            }
        }
    }

    private handleLinkCopy = async () => {
        await executeReactStateUITask<State, 'copyState'>(
            this,
            'copyState',
            () => this.props.onCopyLinkClick(),
        )
        this.copyTimeout = setTimeout(
            () => this.setState({ copyState: 'pristine' }),
            COPY_TIMEOUT,
        )
    }

    private renderLinkContent() {
        const { copyState } = this.state

        if (copyState === 'running' || this.props.isLoading) {
            return <LoadingIndicator />
        } else if (copyState === 'success') {
            return <LinkContent>Copied to Clipboard</LinkContent>
        } else {
            return (
                <LinkBox>
                    <LinkContent>{this.props.link.split('://')[1]}</LinkContent>
                    <Icon filePath={icons.copy} heightAndWidth="14px" />
                </LinkBox>
            )
        }
    }

    render() {
        return (
            <ClickAway onClickAway={this.props.onClickOutside}>
                <Menu>
                    {this.props.isLoading ? (
                        <LoadingBox>
                            <LoadingIndicator />
                        </LoadingBox>
                    ) : (
                        <>
                            {this.props.showLink && (
                                <TopArea>
                                    <PrivacyTitle>
                                        {this.props.linkTitleCopy}
                                    </PrivacyTitle>
                                    {/* {this.props.onPlusBtnClick && (
                                    <Icon
                                        icon="plus"
                                        height="18px"
                                        onClick={this.props.onPlusBtnClick}
                                    />
                                )} */}
                                    <LinkCopierBox>
                                        <LinkCopier
                                            state={this.state.copyState}
                                            onClick={this.handleLinkCopy}
                                        >
                                            {this.renderLinkContent()}
                                        </LinkCopier>
                                    </LinkCopierBox>
                                </TopArea>
                            )}
                            <PrivacyContainer isLinkShown={this.props.showLink}>
                                <TopArea>
                                    <PrivacyTitle>
                                        {this.props.privacyOptionsTitleCopy}
                                    </PrivacyTitle>
                                    <PrivacyOptionContainer top="5px">
                                        {this.props.privacyOptions.map(
                                            (props, i) => (
                                                <SharePrivacyOption
                                                    key={i}
                                                    {...props}
                                                />
                                            ),
                                        )}
                                    </PrivacyOptionContainer>
                                </TopArea>
                            </PrivacyContainer>
                        </>
                    )}
                </Menu>
            </ClickAway>
        )
    }
}

export default ShareAnnotationMenu

const Menu = styled.div`
    padding: 5px 0px;

    & * {
        font-family: ${(props) => props.theme.fonts.primary};
    }
`

const TopArea = styled.div`
    padding: 10px 15px 10px 15px;
`

const TitleContainer = styled.div`
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
`

const SectionTitle = styled.div`
    font-size: 13px;
    font-weight: normal;
    opacity: 0.5;
    color: ${(props) => props.theme.colors.primary};
`

const LinkCopierBox = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
    margin: 5px 0;
    background-color: ${(props) => props.theme.colors.lighterText};
    border-radius: 5px;
`

const LoadingBox = styled.div`
    width: 100%;
    display: flex;
    height: 60px;
    align-items: center;
    justify-content: center;
`

const LinkCopier = styled.button`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 0;
    border-radius: 3px;
    height: 30px;
    padding: 0 10px;
    outline: none;
    cursor: pointer;
    overflow: hidden;

    & > span {
        overflow: hidden;
        width: 90%;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`

const LinkBox = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
`

const LinkContent = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    width: -webkit-fill-available;
    text-overflow: ellipsis;
    overflow: hidden;
`

const PrivacyContainer = styled.div<{ isLinkShown: boolean }>`
    width: 100%;

    &:first-child {
        padding-top: ${(props) => (props.isLinkShown ? '15px' : '0px')};
    }
`

const PrivacyTitle = styled.div`
    font-size: 14px;
    font-weight: normal;
    margin-bottom: 10px;
    color: ${(props) => props.theme.colors.normalText};
`

const PrivacyOptionContainer = styled(Margin)`
    min-height: 100px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
`
