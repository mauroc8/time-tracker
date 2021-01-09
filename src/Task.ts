import * as Utils from './Utils'
import * as Maybe from './Maybe'
import * as Levenshtein from './Levenshtein'

// TASK ---


export type Task = {
    id: Id,
    name: string,
    color: Utils.Rgba,
}

export type Id = {
    tag: "task-id",
    id: number,
}

export function task(id: Id, name: string, color: Utils.Rgba): Task {
    return { id, name, color }
}

export function taskId(id: number): Id {
    return { tag: "task-id", id }
}

export function matchesId(id: Id, task: Task): boolean {
    return id.id === task.id.id
}

export function search(query: string, tasks: Array<Task>): Array<Task> {
    return tasks.reduce<Array<[Task, number]>>(
        (tasks, task) => {
            const distance = Levenshtein.distance(query.toLowerCase(), task.name.toLowerCase())

            tasks.push([task, distance])

            return tasks
        },
        []
    )
        .sort((a: [Task, number], b: [Task, number]) => {
            const [taskA, distanceA] = a
            const [taskB, distanceB] = b

            return distanceA - distanceB
        })
        .slice(0, 5)
        .map(([task, _]) => task)
}

export function cast(json: any): Maybe.Maybe<Task> {
    if (typeof json === "object"
        && typeof json.name === "string"
    )
        return Maybe.map2(
            castId(json.id),
            Utils.castRgba(json.color),
            (id, color) => ({
                id: id,
                name: json.name,
                color: color
            })
        )
    return Maybe.nothing()
}

export function castId(json: any): Maybe.Maybe<Id> {
    if (typeof json === "object"
        && json.tag === "task-id"
        && typeof json.id === "number"
    )
        return Maybe.just(taskId(json.id))
    return Maybe.nothing()
}
