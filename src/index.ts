/** About this code
 * 
 * I'm using The Elm Architecture, which is essentially the same idea as React/Redux.
 * 
 */

import * as State from './State'
import * as Update from './Update'
import * as View from './View'
import * as VirtualDom from './utils/vdom/VirtualDom'
import * as Html from './utils/vdom/Html'

let $rootElement = document.getElementById('root') as Element | Text
let timeout = setTimeout(() => { }, 0)

/** Flags refer to some external state that is passed to app initialization */
const flags = localStorage.getItem("state")

if ($rootElement !== null) {
    let [state, initialEffect] = State.initialState<Update.Event>(flags)
    let view = View.view(state)

    const dispatch = (event: Update.Event) => {
        const [newState, effect] = Update.update(state, event)

        const newView = View.view(newState)
        const patch = VirtualDom.diff(view, newView, dispatch)

        patch($rootElement)
        view = newView
        effect.perform(dispatch)
    }

    const $initialRender = Html.toElement(view, dispatch)
    $rootElement.replaceWith($initialRender)
    $rootElement = $initialRender

    initialEffect.perform(dispatch)
}
