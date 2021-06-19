import * as DateGroup from './DateGroup'

/** Actions, messages, or events that our application receives.
 * This covers all of our application input. Each Event is handled explicitly in the
 * main `update` function (index.ts).
*/

export type Event =
    | { eventName: 'none' }
    | { eventName: 'gotNewDate', date: globalThis.Date }
    | { eventName: 'dateGroupEvent', event: DateGroup.Event }

export function none(): Event {
    return { eventName: 'none' }
}

export function gotNewDate(date: globalThis.Date): Event {
    return { eventName: 'gotNewDate', date }
}

export function dateGroupEvent(event: DateGroup.Event): Event {
    return { eventName: 'dateGroupEvent', event }
}
