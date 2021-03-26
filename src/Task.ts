import * as Utils from './utils/Utils'
import * as Color from './style/Color'
import * as Maybe from './utils/Maybe'
import * as Levenshtein from './utils/Levenshtein'
import * as Decoder from './utils/decoder/Decoder'

// TASK ---


export type Task = {
    id: Id,
    description: string,
}

export type Id = {
    tag: "taskId",
    id: number,
}

export function task(id: Id, name: string): Task {
    return { id, description: name }
}

export function taskId(id: number): Id {
    return { tag: "taskId", id }
}

export function idEq(a: Id, b: Id): boolean {
    return a.id === b.id
}

export function matchesId(id: Id, task: Task): boolean {
    return idEq(id, task.id)
}

export function find(id: Id, tasks: Array<Task>): Maybe.Maybe<Task> {
    return Maybe.fromUndefined(
        tasks.find(task => matchesId(id, task))
    )
}

export function search(query: string, tasks: Array<Task>): Array<Task> {
    if (query === "")
        return []
    else
        return tasks.map<[Task, number]>(task =>
            [task, Levenshtein.distance(query.toLowerCase(), task.description.toLowerCase())]
        )
            .sort((a: [Task, number], b: [Task, number]) => {
                const [taskA, distanceA] = a
                const [taskB, distanceB] = b

                return distanceA - distanceB
            })
            .slice(0, 5)
            .map(([task, _]) => task)
}

export const idDecoder: Decoder.Decoder<Id> =
    Decoder.map2(
        Decoder.property('id', Decoder.literal('taskId')),
        Decoder.property('id', Decoder.number),
        (_, id) =>
            taskId(id)
    )


export const decoder: Decoder.Decoder<Task> =
    Decoder.map2(
        idDecoder,
        Decoder.property('description', Decoder.string),
        (id, description) => ({ id, description })
    )
