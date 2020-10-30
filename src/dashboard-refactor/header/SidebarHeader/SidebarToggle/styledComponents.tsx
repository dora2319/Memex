import React from 'react'
import styled, { css } from 'styled-components'
import colors from '../../../colors'

const buttonStyles = `
    height: 26px;
    width: 26px;
    color: ${colors.iconDefault};
    padding: 2px;
    border: none;
    cursor: pointer;
    background-repeat: no-repeat;
    background-position: center center;

    &:active {
        opacity: 1;
    }

    &:focus {
        outline: none;
    }
`

const arrowStyles = `
    position: absolute;
    left: 2px;
    opacity: 1;
    background-size: 18px;
`

export const Container = styled.div`
    height: 30px;
    width: 30px;
    border: none;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
`

export const BtnBackground = styled.div`
    height: 100%;
    width: 100%;
    background-color: ${colors.highlightGrey};
    background-size: 24px;
    background-repeat: no-repeat;
    background-position: center center;
    border-radius: 3px;
`

export const HamburgerButton = styled.div`
    ${buttonStyles}
    background-size: 24px;
    opacity: 0.8;
    background-image: url('/img/hamburger.svg');
`

export const LeftArrow = styled.div`
    ${buttonStyles}
    ${arrowStyles}
    background-image: url('/img/doubleArrow.svg');
    background-position-x: 3px;
`

export const RightArrow = styled.div`
    ${buttonStyles}
    ${arrowStyles}
    background-image: url('/img/doubleArrow.svg');
    transform: rotate(180deg);
    animation: 0.2s cubic-bezier(0.65, 0.05, 0.36, 1);
`
