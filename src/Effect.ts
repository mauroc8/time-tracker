import * as State from './State'
import * as Maybe from './Maybe'

export type Effect<A> = {
    tag: "Effect",
    perform: (dispatch: (event: A) => void) => void
}

export function saveToLocalStorage<T>(state: State.State): Effect<T> {
    return {
        tag: "Effect",
        perform: (_) =>
            localStorage.setItem("state", JSON.stringify(state))
    }
}

export function getFromLocalStorage(): Effect<Maybe.Maybe<State.State>> {
    return {
        tag: "Effect",
        perform: (dispatch) => {
            const stateString = localStorage.getItem("state")

            if (stateString === null) {
                dispatch(Maybe.nothing())
            } else {
                try {
                    dispatch(State.cast(JSON.parse(stateString)))
                } catch (e) {
                    dispatch(Maybe.nothing())
                }
            }
        }
    }
}

export function preventDefault<T>(preventDefault: () => void): Effect<T> {
    return {
        tag: "Effect",
        perform: (_) => preventDefault()
    }
}

export function none<T>(): Effect<T> {
    return {
        tag: "Effect",
        perform: (_) => { }
    }
}

export function batch<T>(effects: Array<Effect<T>>): Effect<T> {
    return {
        tag: "Effect",
        perform: (dispatch) => {
            effects.forEach(effect => effect.perform(dispatch))
        }
    }
}
