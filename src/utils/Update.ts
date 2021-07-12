import * as Task from './Task'

export type Update<A, E> =
    {
        tag: 'Update',
        state: A,
        tasks: Array<Task.Task<E>>
    }
        & UpdatePrototype<A, E>

interface UpdatePrototype<A, E> {
    map<B>(f: (a: A) => B): Update<B, E>
    andThen<B>(f: (a: A) => Update<B, E>): Update<B, E>
    mapTasks<F>(f: (x: E) => F): Update<A, F>
    mapBoth<B, F>(f: (a: A) => B, g: (x: E) => F): Update<B, F>
    addTask(task: Task.Task<E>): Update<A, E>
}

export function of<A, B>(state: A, cmds: Array<Task.Task<B>>): Update<A, B> {
    return {
        tag: 'Update',
        state,
        tasks: cmds,
        map: function (f) { return map(this, f) },
        andThen: function (f) { return andThen(this, f) },
        mapTasks: function(f) { return mapTasks(this, f) },
        mapBoth: function (f, g) { return mapBoth(this, f, g) },
        addTask: function (t) { return addTask(this, t) },
    }
}

export function pure<A>(state: A): Update<A, any> {
    return of(state, [])
}

export function map<A, B, C>(update: Update<A, C>, f: (a: A) => B): Update<B, C> {
    return of(f(update.state), update.tasks)
}

export function andThen<A, B, C>(update: Update<A, C>, f: (a: A) => Update<B, C>): Update<B, C> {
    const { state, tasks: cmds } = update

    const { state: newState, tasks: cmds0 } = f(state)

    return of(newState, [...cmds, ...cmds0])
}

export function mapTasks<A, C, D>(update: Update<A, C>, f: (c: C) => D): Update<A, D> {
    return of(update.state, update.tasks.map(cmd => Task.map(cmd, f)))
}

export function mapBoth<A, B, C, D>(
    update: Update<A, C>,
    f: (a: A) => B,
    g: (c: C) => D,
): Update<B, D> {
    return map(mapTasks(update, g), f)
}

export function addTask<A, B>(update: Update<A, B>, cmd: Task.Task<B>): Update<A, B> {
    return of(update.state, [...update.tasks, cmd])
}
