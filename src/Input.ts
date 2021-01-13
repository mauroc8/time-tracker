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

export function eq(a: Input, b: Input): boolean {
    if (a.tag === "createRecord" && b.tag === "createRecord") {
        return a.name === b.name
    }

    if (a.tag === "record" && b.tag === "record") {
        return Record.idEq(a.id, b.id) && a.name === b.name
    }

    return false
}

export function toStringId(input: Input): string {
    switch (input.tag) {
        case "createRecord":
            return `createRecord-${input.name}`

        case "record":
            return `record-${input.id.id}-${input.name}`
    }
}
