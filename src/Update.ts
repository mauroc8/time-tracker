import * as State from './State'
import * as Maybe from './Maybe'
import * as Record from './Record'
import * as CreateRecord from './CreateRecord'
import * as Task from './Task'
import * as Utils from './Utils'
import * as Input from './Input'
import * as Effect from './Effect'



/** Event is what's typically called an "action" in Redux
 * 
*/
export type Event =
    | { tag: "RecordBlur", id: Record.Id }
    | { tag: "CreateRecordBlur" }
    | { tag: "onInput", input: Input.Input, value: string }
    | { tag: "ButtonClick", buttonName: Button }
    | { tag: "submitCreateRecord", preventDefault: () => void }

export function onInput(input: Input.Input, value: string): Event {
    return {
        tag: "onInput",
        input, value,
    }
}

type Button =
    | "stop"
    | "play"


export function clickedStopButton(): Event {
    return {
        tag: "ButtonClick",
        buttonName: "stop",
    }
}

export function clickedPlayButton(): Event {
    return {
        tag: "ButtonClick",
        buttonName: "play",
    }
}

export function submittedCreateRecord(preventDefault: () => void): Event {
    return { tag: "submitCreateRecord", preventDefault }
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
    switch (event.tag) {
        case "onInput":
            return updateInput(event.input, event.value, state)

        case "CreateRecordBlur":
            const newState = {
                ...state,
                createRecord: CreateRecord.normalizeInputs(state.tasks, state.createRecord)
            }

            Effect.saveToLocalStorage(newState).perform()

            return newState

        case "RecordBlur":
            const newState_ = {
                ...state,
                records: Record.mapWithId(
                    state.records,
                    event.id,
                    record => Record.normalizeInputs(state.tasks, record),
                )
            }

            Effect.saveToLocalStorage(newState_).perform()

            return newState_

        case "ButtonClick":
            switch (event.buttonName) {
                case "play":
                    const now = new Date()

                    return {
                        ...state,
                        createRecord: {
                            ...state.createRecord,
                            start: Maybe.just({
                                input: Utils.dateToString(now),
                                date: now
                            })
                        }
                    }

                case "stop":
                    return CreateRecord.toRecord(state.tasks, new Date(), state.createRecord)
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
                        )

            }
            break

        case "submitCreateRecord":
            event.preventDefault()

            return state
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
