import * as Utils from './utils/Utils'
import * as Color from './style/Color'
import * as Maybe from './utils/Maybe'
import * as Levenshtein from './utils/Levenshtein'

// TASK ---


export type Task = {
    id: Id,
    description: string,
}

export type Id = {
    tag: "task-id",
    id: number,
}

export function task(id: Id, name: string): Task {
    return { id, description: name }
}

export function taskId(id: number): Id {
    return { tag: "task-id", id }
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

export function decode(json: unknown): Maybe.Maybe<Task> {
    if (typeof json === "object"
        && json !== null
        && typeof (json as { description?: unknown }).description === "string"
    )
        return decodeJsonId((json as { id?: unknown }).id)
            .map(id => ({
                id: id,
                description: (json as { description: string }).description,
            }))

    return Maybe.nothing()
}

export function decodeJsonId(json: any): Maybe.Maybe<Id> {
    if (typeof json === "object"
        && json.tag === "task-id"
        && typeof json.id === "number"
    )
        return Maybe.just(taskId(json.id))
    return Maybe.nothing()
}
