import React from 'react'
import ReactDOM from 'react-dom'

import * as Input from './Input'
import * as View from './View'
import * as CreateRecord from './CreateRecord'
import * as Record from './Record'
import * as Task from './Task'

export type AutoCompleteMenu =
    | { tag: "ClosedDropDownMenu" }
    | { tag: "OpenDropDownMenu", input: Input.Input, index: number }


export function closed(): AutoCompleteMenu {
    return { tag: "ClosedDropDownMenu" }
}

export function open(input: Input.Input): AutoCompleteMenu {
    return {
        tag: "OpenDropDownMenu",
        input, index: -1,
    }
}

export type Key =
    | "Enter"
    | "ArrowDown"
    | "ArrowUp"
    | "Escape"
    | undefined

function keyFromString(string: string): Key {
    switch (string) {
        case "Enter":
            return "Enter"
        
        case "ArrowUp":
            return "ArrowUp"
        
        case "ArrowDown":
            return "ArrowDown"
        
        case "Escape":
            return "Escape"

        default:
            return undefined
    }
}

export function inputWithLabel(args : {
    input: Input.Input,
    createRecord: CreateRecord.CreateRecord,
    records: Array<Record.Record>,
    tasks: Array<Task.Task>,
    label: string,
    value: string,
    onChange: (input: Input.Input, value: string) => void,
    onFocus: (input: Input.Input) => void,
    onBlur: (input: Input.Input) => void,
    onKeyDown: (input: Input.Input, key: Key) => void,
    onAutoCompleteItemClick: (input: Input.Input, index: number) => void,
    autoCompleteMenu: AutoCompleteMenu,
    inputProps: React.InputHTMLAttributes<HTMLInputElement>,
}) {
    const input = View.inputWithLabel(
        Input.toStringId(args.input),
        args.label,
        {
            ...args.inputProps,
            value: args.value,
            onChange: event => args.onChange(args.input, event.currentTarget.value),
            onFocus: _ => args.onFocus(args.input),
            onBlur: _ => args.onBlur(args.input),
            onKeyDown: event => args.onKeyDown(args.input, keyFromString(event.key)),
            style: {
                ...(args.inputProps.style || {}),
                width: "100%",
                boxSizing: "border-box",
            }
        }
    )

    if (args.autoCompleteMenu.tag === "OpenDropDownMenu"
        && Input.eq(args.input, args.autoCompleteMenu.input)
    ) {
        return <div
            style={{
                width: "100%",
                position: "relative",
            }}
        >
            {input}
            <div style={{
                position: "absolute",
                top: "100%",
                backgroundColor: "white",
                width: "100%",
                zIndex: 20,
            }}>
                {menuItems(
                    getItems(args.input, args.createRecord, args.records, args.tasks),
                    (index) => args.onAutoCompleteItemClick(args.input, index),
                    args.autoCompleteMenu.index
                )}
            </div>
        </div>
    }
    
    return <div>{input}</div>
}

function menuItems(items: Array<string>, onClick: (i: number) => void, index: number): JSX.Element {
    return <div
        className="menuItems"
    >
        {items.map((item, i) => {
            if (index === i)
                return <div
                    style={{ backgroundColor: "rgb(220, 220, 220)" }}
                    key={item}
                >
                    {item}
                </div>
            else
                return <div
                    onMouseDown={_ => onClick(i)}
                    key={item}
                >
                    {item}
                </div>
        })}
    </div>
}

export function afterKeyDown(
    input: Input.Input,
    key: Key,
    numberOfItems: number,
    autoCompleteMenu: AutoCompleteMenu
): AutoCompleteMenu {
    switch (autoCompleteMenu.tag) {
        case "ClosedDropDownMenu":
            switch (key) {
                case "ArrowDown":
                    return {
                        tag: "OpenDropDownMenu",
                        input,
                        index: -1,
                    }
            }
            return autoCompleteMenu
        
        case "OpenDropDownMenu":
            switch (key) {
                case "ArrowDown":
                    return {
                        tag: "OpenDropDownMenu",
                        input: autoCompleteMenu.input,
                        index: Math.min(numberOfItems - 1, autoCompleteMenu.index + 1),
                    }
                
                case "ArrowUp":
                    return {
                        tag: "OpenDropDownMenu",
                        input: autoCompleteMenu.input,
                        index: Math.max(-1, autoCompleteMenu.index - 1),
                    }
                    
                case "Enter":
                    return { tag: "ClosedDropDownMenu" }
                
                case "Escape":
                    return { tag: "ClosedDropDownMenu" }
                
                case undefined:
                    return {
                        tag: "OpenDropDownMenu",
                        input: autoCompleteMenu.input,
                        index: -1,
                    }
            }
    }
}


export function getItems(
    input: Input.Input,
    createRecord: CreateRecord.CreateRecord,
    records: Array<Record.Record>,
    tasks: Array<Task.Task>
): Array<string> {
    switch (input.tag) {
        case "createRecord":
            switch (input.name) {
                case "task":
                    return Task.search(createRecord.taskInput, tasks).map(task => task.name)
                
                case "description":
                    return Record.search(
                        createRecord.description,
                        createRecord.taskId
                            .map(taskId => Record.filterUsingTask(taskId, records))
                            .withDefault(records)
                    ).map(record => record.description)
                    // Remove duplicates
                    .filter((description, i, array) =>
                        i === array.length || description !== array[i + 1]
                    )
                    .slice(0, 5)
            }
            return []
        
        case "record":
            throw Error("TODO")

            switch (input.name) {
            }
    }
    return []
}
