import * as State from './State'
import * as Maybe from './utils/Maybe'
import * as Record from './Record'
import * as CreateRecord from './CreateRecord'
import * as Task from './Task'
import * as Utils from './utils/Utils'
import * as Input from './Input'
import * as Effect from './utils/Effect'
import * as Button from './Button'



/** Event is what's typically called an "action" in Redux
 * 
*/
export type Event =
    | { tag: "onInput", input: Input.Input, value: string }
    | { tag: "ButtonClick", button: Button.Button }

export function onInput(input: Input.Input, value: string): Event {
    return {
        tag: "onInput",
        input, value,
    }
}

export function clickedButton(button: Button.Button): Event {
    return {
        tag: "ButtonClick",
        button
    }
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
export function update(state: State.State, event: Event): [State.State, Effect.Effect<Event>] {
    const [newState, effect] = update_(state, event);

    return [
        newState,
        Effect.batch([
            Effect.saveToLocalStorage(newState),
            effect,
        ])
    ]
}

function update_(state: State.State, event: Event): [State.State, Effect.Effect<Event>] {
    switch (event.tag) {
        case "onInput":
            return [
                updateInput(event.input, event.value, state),
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
                                        }
                                    ),
                                validationError => state
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
                                        return createRecord.start.map(_ => ({
                                            ...createRecord,
                                            start: Maybe.just(CreateRecord.start(new Date()))
                                        })).orElse(() => createRecord)
                                    })
                                    // Don't do nothing if we didn't find the record
                                    .withDefault(state.createRecord)
                        },
                        Effect.none()
                    ]
            }
            break
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
