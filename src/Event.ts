import * as DateGroup from './DateGroup'
import * as Date from './utils/Date'

/** Actions, messages, or events that our application receives.
 * This covers all of our application input. Each Event is handled explicitly in the
 * main `update` function (index.ts).
*/

export type Event =
    | { name: 'none' }
    | { name: 'gotNewDate', date: Date.Javascript }
    | { name: 'dateGroupEvent', event: DateGroup.Event }

export function none(): Event {
    return { name: 'none' }
}

export function gotNewDate(date: Date.Javascript): Event {
    return { name: 'gotNewDate', date }
}

export function dateGroupEvent(event: DateGroup.Event): Event {
    return { name: 'dateGroupEvent', event }
}
