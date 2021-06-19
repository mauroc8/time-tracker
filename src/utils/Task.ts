import * as Maybe from './Maybe'
import * as Result from './Result'
import * as Date from './Date'

type Dispatch<A> = (a: A) => void

export type Task<A> = {
    tag: "Task",
    execute: (dispatch: Dispatch<A>) => void
}

function of<A>(execute: (dispatch: Dispatch<A>) => void): Task<A> {
    return { tag: "Task", execute }
}

export function succeed<A>(a: A): Task<A> {
    return of(
        (dispatch: Dispatch<A>) => {
            dispatch(a)
        }
    )
}

export function map<A, B>(cmd: Task<A>, f: (a: A) => B): Task<B> {
    return of(
        (dispatch: Dispatch<B>) => {
            cmd.execute((a: A) => dispatch(f(a)))
        }
    )
}

export function andThen<A, B>(cmd: Task<A>, f: (a: A) => Task<B>): Task<B> {
    return of(
        (dispatch: Dispatch<B>) => {
            cmd.execute((a: A) => {
                f(a).execute(dispatch)
            })
        }
    )
}

export function map2<A, B, C>(cmd: Task<A>, cmdB: Task<B>, f: (a: A, b: B) => C): Task<C> {
    return andThen(
        cmd,
        a => map(cmdB, b => f(a, b))
    )
}

export function none<T>(): Task<T> {
    return of(() => {})
}

export function saveToLocalStorage<A>(key: string, value: unknown): Task<A> {
    return of (
        (_) => {
            localStorage.setItem(key, JSON.stringify(value))
        }
    )
}

export function getFromLocalStorage(key: string): Task<Maybe.Maybe<string>> {
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

export function preventDefault<T>(event: Event): Task<T> {
    return of(
        (_) => {
            event.preventDefault()
        }
    )
}

export function waitMilliseconds(milliseconds: number): Task<Date.Javascript> {
    return of(
        (dispatch) => {
            setTimeout(() => dispatch(new window.Date()), milliseconds)
        }
    )
}

export function getRectOf(
    id: string
) : Task<Maybe.Maybe<{ x: number, y: number, width: number, height: number }>> {
    return of(
        (dispatch) => {
            try {
                const elem = document.getElementById(id)

                if (elem === null) {
                    dispatch(Maybe.nothing())
                } else {
                    const rect = elem.getBoundingClientRect()

                    dispatch(
                        Maybe.just({
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height,
                        })
                    )
                }
            } catch (e) {
                console.error(e)
                dispatch(Maybe.nothing())
            }
        }
    )
}

export function logInfo<A>(message: string): Task<A> {
    return of(_ => {
        console.info(message)
    })
}

export function logError<A, E>(error: E): Task<A> {
    return of(_ => {
        console.error(error)
    })
}
