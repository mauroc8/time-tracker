import * as Cmd from './utils/Task'

export type Update<A, B> =
    { tag: 'Update', state: A, cmds: Array<Cmd.Task<B>> }

export function of<A, B>(state: A, cmds: Array<Cmd.Task<B>>): Update<A, B> {
    return { tag: 'Update', state, cmds }
}

export function pure<A, B>(state: A): Update<A, B> {
    return of(state, [])
}

export function map<A, B, C>(update: Update<A, C>, f: (a: A) => B): Update<B, C> {
    return of(f(update.state), update.cmds)
}

export function andThen<A, B, C>(update: Update<A, C>, f: (a: A) => Update<B, C>): Update<B, C> {
    const { state, cmds } = update

    const { state: newState, cmds: cmds0 } = f(state)

    return of(newState, [...cmds, ...cmds0])
}

export function mapCmd<A, C, D>(update: Update<A, C>, f: (c: C) => D): Update<A, D> {
    return of(update.state, update.cmds.map(cmd => Cmd.map(cmd, f)))
}

export function mapBoth<A, B, C, D>(
    update: Update<A, C>,
    f: (a: A) => B,
    g: (c: C) => D,
): Update<B, D> {
    return map(mapCmd(update, g), f)
}

export function addCmd<A, B>(update: Update<A, B>, cmd: Cmd.Task<B>): Update<A, B> {
    return of(update.state, [...update.cmds, cmd])
}
