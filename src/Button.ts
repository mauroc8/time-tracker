import * as Record from './Record'

export type Button =
    | { tag: "stop" }
    | { tag: "play" }
    | { tag: "deleteRecord", recordId: Record.Id }
    | { tag: "resumeRecord", recordId: Record.Id }

export function stop(): Button {
    return { tag: "stop" }
}

export function play(): Button {
    return { tag: "play" }
}

export function deleteRecord(recordId: Record.Id): Button {
    return { tag: "deleteRecord", recordId }
}

export function resumeRecord(recordId: Record.Id): Button {
    return { tag: "resumeRecord", recordId }
}