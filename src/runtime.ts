import { Html } from "./vdom/Html"
import { VirtualDom, patch, replace } from "./vdom/VirtualDom"

import * as Date from './utils/Date'
import * as Task from "./utils/Task"
import { Update } from "./utils/Update"

export function startRuntime<State, Event>(
    $root: Element,
    init: Update<State, Event>,
    view: (state: State) => Html<Event>,
    update: (state: State, event: Event, timestamp: Date.Javascript) => Update<State, Event>,
) {
    requestAnimationFrame(() => {
        executeTasks(init.tasks)
    })

    let currentState = debugCurrentState(init.state)
    let virtualDom: VirtualDom<Event> = replace($root, view(currentState), dispatchSync)

    function debugCurrentState(state: State): State {
        if (process.env.NODE_ENV === 'development') {
            (window as any).currentState = state
        }

        return state
    }

    function executeTasks(
        tasks: Array<Task.Task<Event>>,
    ): void {
        for (const task of tasks) {
            task.execute(dispatchAsync)
        }
    }

    function dispatchSync(event: Event): void {
        try {
            const { state, tasks } = update(currentState, event, new window.Date())

            /* Update state */
            currentState = debugCurrentState(state)

            /* Patch virtual Dom */
            if (currentState !== state) {
                virtualDom = patch(virtualDom, view(currentState), dispatchSync)
            }

            /* Execute side effects */
            executeTasks(tasks)
        } catch (e) {
            console.error(e)
        }
    }

    function dispatchAsync(event: Event) {
        requestAnimationFrame(() => dispatchSync(event))
    }
}
