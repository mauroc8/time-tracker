import * as Record from './Record'

export type Input =
    | { tag: "createRecord", name: CreateRecordInputName }
    | { tag: "record", id: Record.Id, name: RecordInputName }

export type CreateRecordInputName = "description" | "task" | "startTime"
export type RecordInputName = "description" | "task" | "startTime" | "endTime"

export function record(record: Record.Record, name: RecordInputName): Input {
    return { tag: "record", id: record.id, name }
}

export function createRecord(name: CreateRecordInputName): Input {
    return { tag: "createRecord", name }
}
