import * as DateGroup from './DateGroup'
import * as Date from './utils/Date'
import * as Record from './Record'

/** Actions, messages, or events that our application receives.
 * This covers all of our application input. Each Event is handled explicitly in the
 * main `update` function (index.ts).
*/

export type Event =
    | { name: 'none' }
    | { name: 'gotNewDate', date: Date.Javascript }
    | { name: 'dateGroupEvent', event: DateGroup.Event }
    | { name: 'onRecordPlay', id: Record.Id }
    | { name: 'onRecordDelete', id: Record.Id }
    | { name: 'onRecordInput', id: Record.Id, input: Record.InputName, value: string }
    | { name: 'onRecordChange', id: Record.Id, input: Record.InputName, value: string }

export function none(): Event {
    return { name: 'none' }
}

export function gotNewDate(date: Date.Javascript): Event {
    return { name: 'gotNewDate', date }
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

