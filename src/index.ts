/** About this code
 * 
 * I'm using The Elm Architecture, which is essentially the same idea as React/Redux.
 * 
 */

import * as State from './State'
import * as Update from './Update'
import * as Element from './Element'

import * as VirtualDom from './VirtualDom'
import * as Html from './Html'

let $rootElement = document.getElementById('root') as Element | Text
let timeout = setTimeout(() => { }, 0)

/** Flags refer to some external state that is passed to app initialization */
const flags = localStorage.getItem("state")

if ($rootElement !== null) {
    let [state, initialEffect] = State.initialState<Update.Event>(flags)
    let view = Element.view(state)

    const dispatch = (event: Update.Event) => {
        const [newState, effect] = Update.update(state, event)

        // Wait for one frame and apply the changes.
        // This is necessary because performing the effect could call `dispatch` again inmediately!

        clearTimeout(timeout)

        timeout = setTimeout(() => {
            const newView = Element.view(newState)
            const patch = VirtualDom.diff(view, newView, dispatch)

            state = newState
            view = newView

            $rootElement = patch($rootElement);
        }, 0)

        effect.perform(dispatch)
    }

    const $initialRender = Html.toElement(view, dispatch)
    $rootElement.replaceWith($initialRender)
    $rootElement = $initialRender

    initialEffect.perform(dispatch)
}
