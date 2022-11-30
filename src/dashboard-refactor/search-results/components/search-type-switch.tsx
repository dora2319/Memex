import React, { PureComponent } from 'react'
import styled from 'styled-components'

import colors from 'src/dashboard-refactor/colors'
import { SearchType } from '../types'
import * as icons from 'src/common-ui/components/design-library/icons'
import { Icon } from 'src/dashboard-refactor/styled-components'

export interface Props {
    onNotesSearchSwitch: React.MouseEventHandler<HTMLButtonElement>
    onPagesSearchSwitch: React.MouseEventHandler<HTMLButtonElement>
    searchType: SearchType
}

export default class SearchTypeSwitch extends PureComponent<Props> {
    render() {
        return (
            <SearchTypeSwitchContainer>
                <SearchTypeBtn
                    onClick={this.props.onPagesSearchSwitch}
                    disabled={this.props.searchType === 'pages'}
                >
                    <Icon
                        path={icons.cursor}
                        color={
                            this.props.searchType === 'pages'
                                ? 'purple'
                                : 'iconColor'
                        }
                        heightAndWidth="16px"
                        hoverOff
                    />{' '}
                    Web
                </SearchTypeBtn>
                <SearchTypeBtn
                    onClick={this.props.onNotesSearchSwitch}
                    disabled={this.props.searchType === 'notes'}
                >
                    <Icon
                        path={icons.highlight}
                        color={
                            this.props.searchType === 'notes'
                                ? 'purple'
                                : 'iconColor'
                        }
                        heightAndWidth="16px"
                        hoverOff
                    />
                    Highlights
                </SearchTypeBtn>
            </SearchTypeSwitchContainer>
        )
    }
}

const SearchTypeSwitchContainer = styled.div`
    display: flex;
`

const SearchTypeBtn = styled.button`
    color: ${(props) => props.theme.colors.normalText};
    font-weight: 400;
    cursor: pointer;
    outline: none;
    margin-right: 5px;
    padding: 2px 8px 2px 8px;
    display: grid;
    grid-auto-flow: column;
    grid-gap: 7px;
    border: none;
    align-items: center;
    background-color: transparent;
    border-radius: 3px;

    &:hover {
        background: ${(props) => props.theme.colors.darkhover};
    }

    &:disabled {
        cursor: auto;
        background: ${(props) => props.theme.colors.lightHover};
    }
`
