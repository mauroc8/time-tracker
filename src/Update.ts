import * as State from './State'
import * as Maybe from './Maybe'
import * as Record from './Record'
import * as CreateRecord from './CreateRecord'
import * as Task from './Task'
import * as Utils from './Utils'
import * as Input from './Input'
import * as Effect from './Effect'
import * as Button from './Button'
import * as AutoCompleteMenu from './AutoCompleteMenu'



/** Event is what's typically called an "action" in Redux
 * 
*/
export type Event =
    | { tag: "RecordBlur", id: Record.Id }
    | { tag: "CreateRecordBlur" }
    | { tag: "onInput", input: Input.Input, value: string }
    | { tag: "onFocus", input: Input.Input }
    | { tag: "onBlur", input: Input.Input }
    | { tag: "onKeyDown", input: Input.Input, key: AutoCompleteMenu.Key }
    | { tag: "ButtonClick", button: Button.Button }
    | { tag: "onAutoCompleteItemClick", input: Input.Input, index: number }

export function onInput(input: Input.Input, value: string): Event {
    return {
        tag: "onInput",
        input, value,
    }
}

export function onFocus(input: Input.Input): Event {
    return {
        tag: "onFocus",
        input
    }
}

export function onBlur(input: Input.Input): Event {
    return {
        tag: "onBlur",
        input
    }
}

export function onKeyDown(input: Input.Input, key: AutoCompleteMenu.Key): Event {
    return {
        tag: "onKeyDown",
        input, key,
    }
}

export function clickedButton(button: Button.Button): Event {
    return {
        tag: "ButtonClick",
        button
    }
}

export function gotRecordBlur(id: Record.Id): Event {
    return {
        tag: "RecordBlur",
        id
    }
}

export function gotCreateRecordBlur(): Event {
    return { tag: "CreateRecordBlur" }
}

export function onAutoCompleteItemClick(input: Input.Input, index: number): Event {
    return { tag: "onAutoCompleteItemClick", input, index }
}

/** The type of the dispatch function
 * 
 */
export type Dispatch = (event: Event) => void



// UPDATE ---

/** The main update function ("reducer"). Decides how to modify state when an event comes in. Also performs side-effects
 * arbitrarily (BUT it's the ONLY function that can perform side effects in our _whole_ application!)
 * 
 */
export function update(state: State.State, event: Event): State.State {
    const [newState, effect] = update_(state, event);

    console.log(event, newState)

    // Always saveToLocalStorage
    Effect.saveToLocalStorage(newState).perform()

    effect.perform()

    return newState
}

function update_(state: State.State, event: Event): [State.State, Effect.Effect<void>] {
    switch (event.tag) {
        case "onInput":
            return [
                updateInput(event.input, event.value, state),
                Effect.none()
            ]

        case "onFocus":
            return [
                {
                    ...state,
                    autoCompleteMenu: AutoCompleteMenu.open(event.input)
                },
                Effect.none()
            ]

        case "onBlur":
            return [
                {
                    ...state,
                    autoCompleteMenu: AutoCompleteMenu.closed()
                },
                Effect.none()
            ]

        case "onKeyDown":
            var state_ = state

            // If we press enter, alter the selected input's value.
            if (event.key === "Enter" && state.autoCompleteMenu.tag === "OpenDropDownMenu") {
                state_ = Maybe.fromUndefined(
                    AutoCompleteMenu.getItems(
                        event.input,
                        state.createRecord,
                        state.records,
                        state.tasks
                    )[state.autoCompleteMenu.index]
                )
                    .map(inputValue => updateInput(event.input, inputValue, state))
                    .withDefault(state)
            }

            return [
                {
                    ...state_,
                    autoCompleteMenu: AutoCompleteMenu.afterKeyDown(
                        event.input,
                        event.key,
                        AutoCompleteMenu.getItems(event.input, state.createRecord, state.records, state.tasks).length,
                        state.autoCompleteMenu
                    )
                },
                Effect.none()
            ]

        case "CreateRecordBlur":
            return [
                {
                    ...state,
                    createRecord: CreateRecord.normalizeInputs(state.tasks, state.createRecord)
                },
                Effect.none()
            ]

        case "RecordBlur":
            return [
                {
                    ...state,
                    records: Record.mapWithId(
                        state.records,
                        event.id,
                        record => Record.normalizeInputs(state.tasks, record),
                    )
                },
                Effect.none()
            ]

        case "ButtonClick":
            const button = event.button

            switch (button.tag) {
                case "play":
                    return [
                        {
                            ...state,
                            createRecord: {
                                ...state.createRecord,
                                start: Maybe.just(CreateRecord.start(new Date()))
                            }
                        },
                        Effect.none()
                    ]

                case "stop":
                    return [
                        CreateRecord.toRecord(state.tasks, new Date(), state.createRecord)
                            .match(
                                record =>
                                    addRecord(
                                        record,
                                        {
                                            ...state,
                                            createRecord: CreateRecord.empty(""),
                                            createRecordError: Maybe.nothing(),
                                        }
                                    ),
                                validationError => ({
                                    ...state,
                                    createRecordError: Maybe.just(validationError)
                                })
                            ),
                        Effect.none()
                    ]

                case "deleteRecord":
                    return [
                        {
                            ...state,
                            records: Record.deleteWithId(state.records, button.recordId),
                        },
                        Effect.none()
                    ]

                case "resumeRecord":
                    return [
                        {
                            ...state,
                            createRecord:
                                // Find record
                                Maybe.fromUndefined(
                                    state.records.find(record => Record.matchesId(button.recordId, record))
                                )
                                    // Copy its description and task to createRecord
                                    .map(record =>
                                        CreateRecord.fromRecord(record, state.tasks)
                                    )
                                    // Start it immediately if it's not running already
                                    .map(createRecord => {
                                        if (createRecord.start.tag === "nothing") {
                                            return {
                                                ...createRecord,
                                                start: Maybe.just(CreateRecord.start(new Date()))
                                            }
                                        }
                                        return createRecord
                                    })
                                    // Don't do nothing if we didn't find the record
                                    .withDefault(state.createRecord)
                        },
                        Effect.none()
                    ]
            }
            break

        case "onAutoCompleteItemClick":
            return [
                Maybe.fromUndefined(
                    AutoCompleteMenu.getItems(
                        event.input,
                        state.createRecord,
                        state.records,
                        state.tasks
                    )[event.index]
                )
                    .map(inputValue => updateInput(event.input, inputValue, state))
                    .withDefault(state),
                Effect.none()
            ]
    }
}

function addRecord(record: Record.Record, state: State.State): State.State {
    return {
        ...state,
        records: [record, ...state.records]
    }
}


function searchTaskId(inputValue: string, tasks: Array<Task.Task>): Maybe.Maybe<Task.Id> {
    return inputValue === ""
        ? Maybe.nothing()
        : Maybe.fromUndefined(Task.search(inputValue, tasks)[0])
            .map(task => task.id)
}

function updateInput(
    input: Input.Input,
    value: string,
    state: State.State
): State.State {
    switch (input.tag) {
        case "createRecord":
            return {
                ...state,
                createRecord: updateCreateRecordInput(input.name, value, state.tasks, state.createRecord)
            }

        case "record":
            return {
                ...state,
                records: Record.mapWithId(
                    state.records,
                    input.id,
                    record => updateRecordInput(input.name, value, state.tasks, record)
                )
            }
    }
}

function updateCreateRecordInput(
    inputName: Input.CreateRecordInputName,
    value: string,
    tasks: Array<Task.Task>,
    createRecord: CreateRecord.CreateRecord
): CreateRecord.CreateRecord {
    switch (inputName) {
        case "description":
            return { ...createRecord, description: value }
        case "task":
            return CreateRecord.withTask(
                value,
                searchTaskId(value, tasks),
                createRecord
            )
        case "startTime":
            return CreateRecord.updateStartTime(value, createRecord)
    }
}

function updateRecordInput(
    input: Input.RecordInputName,
    value: string,
    tasks: Array<Task.Task>,
    record: Record.Record
): Record.Record {
    switch (input) {
        case "description":
            return { ...record, description: value }

        case "task":
            return Record.withTask(
                value,
                searchTaskId(value, tasks),
                record
            )

        case "startTime":
            return Record.updateStart(value, record)

        case "endTime":
            return Record.updateEnd(value, record)
    }
}
