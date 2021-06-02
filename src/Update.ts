import * as Cmd from './utils/Cmd'

export type Update<A, B> =
    { tag: 'Update', state: A, cmd: Cmd.Cmd<B> }

export function of<A, B>(state: A, cmd: Cmd.Cmd<B>): Update<A, B> {
    return { tag: 'Update', state, cmd }
}

export function pure<A, B>(state: A): Update<A, B> {
    return of(state, Cmd.none())
}

export function map<A, B, C>(update: Update<A, C>, f: (a: A) => B): Update<B, C> {
    return of(f(update.state), update.cmd)
}

export function andThen<A, B, C>(update: Update<A, C>, f: (a: A) => Update<B, C>): Update<B, C> {
    const { state, cmd } = update;

    const { state: newState, cmd: cmd0 } = f(state)

    return of(newState, Cmd.batch([ cmd, cmd0 ]))
}

export function mapCmd<A, C, D>(update: Update<A, C>, f: (c: C) => D): Update<A, D> {
    return of(update.state, Cmd.map(update.cmd, f))
}

export function mapBoth<A, B, C, D>(
    update: Update<A, C>,
    f: (a: A) => B,
    g: (c: C) => D,
): Update<B, D> {
    return map(mapCmd(update, g), f)
}
