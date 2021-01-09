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
