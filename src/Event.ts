import * as DateGroup from './DateGroup'
import * as Date from './utils/Date'
import * as Record from './Record'
import * as Time from './utils/Time'
import * as Create from './Create'

/** Actions, messages, or events that our application receives.
 * This covers all of our application input. Each Event is handled explicitly in the
 * main `update` function (index.ts).
*/

export type Event =
    | { name: 'none' }
    | { name: 'gotNewTime', dateTime: Date.Javascript }
    | { name: 'dateGroupEvent', event: DateGroup.Event }
    | { name: 'onRecordPlay', id: Record.Id }
    | { name: 'onRecordDelete', id: Record.Id }
    | { name: 'onRecordInput', id: Record.Id, input: Record.InputName, value: string }
    | { name: 'onRecordChange', id: Record.Id, input: Record.InputName, value: string }
    | { name: 'onCreateStart' }
    | { name: 'onCreateInput', input: Create.InputName, value: string }
    | { name: 'onCreateChange', input: Create.InputName, value: string }
    | { name: 'onCreateStop' }
    | { name: 'onCreateStopTime', dateTime: Date.Javascript }

export const none: Event = { name: 'none' }

export function gotNewTime(date: Date.Javascript): Event {
    return { name: 'gotNewTime', dateTime: date }
}

export function dateGroupEvent(event: DateGroup.Event): Event {
    return { name: 'dateGroupEvent', event }
}

export function onRecordPlay(id: Record.Id): Event {
    return { name: 'onRecordPlay', id }
}

export function onRecordDelete(id: Record.Id): Event {
    return { name: 'onRecordDelete', id }
}

export function onRecordInput(id: Record.Id, input: Record.InputName, value: string): Event {
    return { name: 'onRecordInput', id, input, value }
}

export function onRecordChange(id: Record.Id, input: Record.InputName, value: string): Event {
    return { name: 'onRecordChange', id, input, value }
}

export const onCreateStart: Event = { name: 'onCreateStart' }

export function onCreateInput(input: Create.InputName, value: string): Event {
    return { name: 'onCreateInput', input, value }
}

export function onCreateChange(input: Create.InputName, value: string): Event {
    return { name: 'onCreateChange', input, value }
}

export function onCreateStopTime(dateTime: Date.Javascript): Event {
    return { name: 'onCreateStopTime', dateTime }
}

export const onCreateStop: Event = { name: 'onCreateStop' }
