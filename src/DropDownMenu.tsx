import React from 'react'
import ReactDOM from 'react-dom'

import * as Input from './Input'

export type DropDownMenu =
    | { tag: "ClosedDropDownMenu" }
    | { tag: "OpenDropDownMenu", input: Input.Input, index: number }


export function closed(): DropDownMenu {
    return { tag: "ClosedDropDownMenu" }
}
