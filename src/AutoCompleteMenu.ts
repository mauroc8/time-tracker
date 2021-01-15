
import * as Input from './Input'
import * as View from './View'
import * as CreateRecord from './CreateRecord'
import * as Record from './Record'
import * as Task from './Task'
import * as Html from './Html'

export type AutoCompleteMenu =
    | { tag: "ClosedAutoCompleteMenu" }
    | { tag: "OpenAutoCompleteMenu", input: Input.Input, index: number }


export function closed(): AutoCompleteMenu {
    return { tag: "ClosedAutoCompleteMenu" }
}

export function open(input: Input.Input): AutoCompleteMenu {
    return {
        tag: "OpenAutoCompleteMenu",
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

export function inputWithLabel<T>(args: {
    input: Input.Input,
    createRecord: CreateRecord.CreateRecord,
    records: Array<Record.Record>,
    tasks: Array<Task.Task>,
    label: string,
    value: string,
    attributes: Array<Html.Attribute<T>>,
    onAutoCompleteItemClick: (input: Input.Input, index: number) => T,
    autoCompleteMenu: AutoCompleteMenu,
    inputAttributes: Array<Html.Attribute<T>>,
}): Html.Html<T> {
    const input = View.inputWithLabel<T>(
        Input.toStringId(args.input),
        args.label,
        [
            ...args.inputAttributes,
            Html.property("value", args.value),
        ],
    )

    if (args.autoCompleteMenu.tag === "OpenAutoCompleteMenu"
        && Input.equals(args.input, args.autoCompleteMenu.input)
    ) {
        return Html.node(
            "div",
            [
                ...args.attributes,
                Html.style("position", "relative"),
            ],
            [
                input,
                Html.node(
                    "div",
                    [
                        Html.style("position", "absolute"),
                        Html.style("top", "100%"),
                        Html.style("backgroundColor", "white"),
                        Html.style("zIndex", "20"),
                    ],
                    menuItems<T>(
                        getItems(args.input, args.createRecord, args.records, args.tasks),
                        (index) => args.onAutoCompleteItemClick(args.input, index),
                        args.autoCompleteMenu.index
                    )
                )
            ]
        )
    }

    return Html.node("div", args.attributes, [input])
}

function menuItems<T>(items: Array<string>, onClick: (i: number) => T, index: number): Array<Html.Html<T>> {
    return items.map((item, i) => {
        if (index === i)
            return Html.node(
                "div",
                [
                    Html.style("backgroundColor", "rgb(220, 220, 220)"),
                ],
                [
                    Html.text(item)
                ]
            )
        else
            return Html.node(
                "div",
                [
                    Html.on("mousedown", (_) => onClick(i)),
                ],
                [
                    Html.text(item)
                ]
            )
    })
}

export function afterKeyDown(
    input: Input.Input,
    key: Key,
    numberOfItems: number,
    autoCompleteMenu: AutoCompleteMenu
): AutoCompleteMenu {
    switch (autoCompleteMenu.tag) {
        case "ClosedAutoCompleteMenu":
            switch (key) {
                case "ArrowDown":
                    return {
                        tag: "OpenAutoCompleteMenu",
                        input,
                        index: -1,
                    }
            }
            return autoCompleteMenu

        case "OpenAutoCompleteMenu":
            switch (key) {
                case "ArrowDown":
                    return {
                        tag: "OpenAutoCompleteMenu",
                        input: autoCompleteMenu.input,
                        index: Math.min(numberOfItems - 1, autoCompleteMenu.index + 1),
                    }

                case "ArrowUp":
                    return {
                        tag: "OpenAutoCompleteMenu",
                        input: autoCompleteMenu.input,
                        index: Math.max(-1, autoCompleteMenu.index - 1),
                    }

                case "Enter":
                    return { tag: "ClosedAutoCompleteMenu" }

                case "Escape":
                    return { tag: "ClosedAutoCompleteMenu" }

                case undefined:
                    return {
                        tag: "OpenAutoCompleteMenu",
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


export function keyDownEventKeyDecoder(event: any): Key {
    switch (event?.key) {
        case "Enter":
            return "Enter"

        case "ArrowDown":
            return "ArrowDown"

        case "ArrowUp":
            return "ArrowUp"

        case "Escape":
            return "Escape"

        default:
            return undefined
    }
}
