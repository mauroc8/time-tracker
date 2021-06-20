import { Update } from "./Update"
import { Html } from "./vdom/Html"
import { diff, render } from "./vdom/VirtualDom"

export function startRuntime<State, Event>(
    $root: Element,
    init: Update<State, Event>,
    view: (state: State) => Html<Event>,
    update: (state: State, event: Event) => Update<State, Event>,
) {
    let currentState = init.state
    let $rootElement: Element | Text = $root

    if (process.env.NODE_ENV === 'development') {
        (window as any).currentState = currentState;
    }

    requestAnimationFrame(() => {
        for (const cmd of init.cmds) {
            cmd.execute(deferedDispatch)
        }
    })

    let currentView = view(currentState)

    const dispatch = (event: Event) => {
        const updateResult = update(currentState, event)

        const updatedView = view(updateResult.state)
        const patch = diff(currentView, updatedView, dispatch)

        try {
            patch($rootElement)
            currentState = updateResult.state
            currentView = updatedView

            if (process.env.NODE_ENV === 'development') {
                (window as any).currentState = currentState;
            }

            for (const cmd of updateResult.cmds) {
                cmd.execute(deferedDispatch)
            }
        } catch (e) {
            console.error(e)
        }
    }

    /** All commands are executed sinchronously, but their events are dispatched in the next frame.
    */
    function deferedDispatch(event: Event) {
        requestAnimationFrame(() => dispatch(event))
    }

    const $initialRender = render(currentView, dispatch)
    $rootElement.replaceWith($initialRender)
    $rootElement = $initialRender
}
