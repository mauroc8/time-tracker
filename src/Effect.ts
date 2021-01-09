import * as State from './State'
import * as Maybe from './Maybe'

export type Effect<A> = {
    tag: "Effect",
    type: EffectTypes,
    perform: () => A
}

export type EffectTypes =
    | "localStorage"
    | "preventDefault"
    | "none"

export function saveToLocalStorage(state: State.State): Effect<void> {
    return {
        tag: "Effect",
        type: "localStorage",
        perform: () =>
            localStorage.setItem("state", JSON.stringify(state))
    }
}

export function getFromLocalStorage(): Effect<Maybe.Maybe<State.State>> {
    return {
        tag: "Effect",
        type: "localStorage",
        perform: () => {
            const stateString = localStorage.getItem("state")

            if (stateString === null) {
                return Maybe.nothing()
            }

            try {
                return State.cast(JSON.parse(stateString))
            } catch (e) {
                return Maybe.nothing()
            }
        }
    }
}

export function preventDefault(preventDefault: () => void): Effect<void> {
    return {
        tag: "Effect",
        type: "preventDefault",
        perform: preventDefault
    }
}

export function none(): Effect<void> {
    return {
        tag: "Effect",
        type: "none",
        perform: () => { }
    }
}
