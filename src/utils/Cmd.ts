import * as State from '../State'
import * as Maybe from './Maybe'
import * as Result from './Result'
import * as Decoder from './decoder/Decoder'

export type Func<A, B> = (a: A) => B

export type Cmd<A> =
    | { tag: "Cmd", execute: Func<Func<A, void>, void> }

function of<A>(execute: Func<Func<A, void>, void>): Cmd<A> {
    return { tag: "Cmd", execute }
}

export function map<A, B>(cmd: Cmd<A>, f: (a: A) => B): Cmd<B> {
    return of(
        (dispatch: Func<B, void>) => {
            cmd.execute((a: A) => dispatch(f(a)))
        }
    )
}

export function andThen<A, B>(cmd: Cmd<A>, f: (a: A) => Cmd<B>): Cmd<B> {
    return of(
        (dispatch: Func<B, void>) => {
            cmd.execute((a: A) => {
                f(a).execute(dispatch)
            })
        }
    )
}

// Ejecuta secuencialmente.
export function map2<A, B, C>(cmd: Cmd<A>, cmdB: Cmd<B>, f: (a: A, b: B) => C): Cmd<C> {
    return of(
        (dispatch: Func<C, void>) => {
            cmd.execute((a: A) => {
                cmdB.execute((b: B) => {
                    dispatch(f(a, b))
                })
            })
        }
    )
}

export function none<T>(): Cmd<T> {
    return of(() => {})
}

export function batch<T>(cmds: Array<Cmd<T>>): Cmd<T> {
    return of(
        (dispatch) => {
            for (const cmd of cmds) {
                cmd.execute(dispatch)
            }
        }
    )
}

export function saveToLocalStorage<A>(key: string, value: unknown): Cmd<A> {
    return of (
        (_) => {
            localStorage.setItem(key, JSON.stringify(value))
        }
    )
}

export function getFromLocalStorage(key: string): Cmd<Maybe.Maybe<string>> {
    return of(
        (dispatch) => {
            const stateString = localStorage.getItem(key)

            if (stateString !== null) {
                dispatch(Maybe.just(stateString))
            } else {
                dispatch(Maybe.nothing())
            }
        }
    )
}

export function preventDefault<T>(event: Event): Cmd<T> {
    return of(
        (_) => {
            event.preventDefault()
        }
    )
}
