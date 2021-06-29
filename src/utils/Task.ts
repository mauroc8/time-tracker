import * as Maybe from './Maybe'
import * as Result from './Result'
import * as Date from './Date'
import * as Codec from './Codec';
import * as Utils from './Utils';

/** One important assumption about this module is that each Task calls "dispatch" at most once.
 * (When it calls dispatch 0 times, it will be a Task<never>).
*/

type Dispatch<A> = (a: A) => void

export type Task<A> = {
    tag: "Task",
    execute: (dispatch: Dispatch<A>) => void
} & Interface<A>;

export interface Interface<A> {
    map<B>(f: (a: A) => B): Task<B>
    andThen<B>(f: (a: A) => Task<B>): Task<B>
}

function of<A>(execute: (dispatch: Dispatch<A>) => void): Task<A> {
    return {
        tag: "Task",
        execute,
        map: function(f) { return map(this, f) },
        andThen: function(f) { return andThen(this, f) },
    }
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

export function none<T>(): Task<T> {
    return of(() => {})
}

export function saveToLocalStorage<A>(key: string, value: Utils.Json): Task<never> {
    return of (
        (dispatch) => {
            localStorage.setItem(key, JSON.stringify(value))
        }
    )
}

export function getFromLocalStorage(key: string): Task<Maybe.Maybe<Utils.Json>> {
    return of(
        (dispatch) => {
            const string = localStorage.getItem(key)

            if (string !== null) {
                try {
                    dispatch(Maybe.just(JSON.parse(string)))
                } catch (x) {
                    localStorage.removeItem(key)
                    dispatch(Maybe.nothing())
                }
            } else {
                dispatch(Maybe.nothing())
            }
        }
    )
}

export function preventDefault<T>(event: Event): Task<never> {
    return of(
        (dispatch) => {
            event.preventDefault()
        }
    )
}

export function waitMilliseconds<A>(
    event: (dateTime: Date.Javascript) => A,
    milliseconds: number,
): Task<A> {
    return of(
        (dispatch) => {
            setTimeout(() => dispatch(event(new window.Date())), milliseconds)
        }
    )
}

export function getRectOf(
    id: string
) : Task<Maybe.Interface<{ x: number, y: number, width: number, height: number }>> {
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
