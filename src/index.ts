/** About this code
 * 
 * I'm using The Elm Architecture, which is essentially the same idea as React/Redux.
 * 
 */

import * as State from './State'
import * as Update from './Update'
import * as Record from './Record'
import * as Records from './Records'
import * as CreateRecord from './CreateRecord'

import * as Html from './utils/vdom/Html'
import * as VirtualDom from './utils/vdom/VirtualDom'

import * as Layout from './utils/layout/Layout'

import * as Color from './style/Color'
import * as  Component from './style/Component'


// --- UPDATE

/** The type of the dispatch function
 */
 export type Dispatch = (event: Event) => void

 /** Event is what's typically called an "action" in Redux
 */
 export type Event =
     | { event: "none" }


function update(state: State.State, event: Event): Update.Update<State.State, Event> {
    return Update.pure(state)
}


// --- VIEW

const globalCss: { [selector: string]: string } = {
    "*": `
        margin: 0;
        padding: 0;
        text: inherit;
        box-sizing: inherit;
        text-decoration: inherit;
        font-weight: inherit;
        font-size: inherit;
        background: transparent;
        border: 0;
        transition: all 0.2s ease-out;
        color: inherit;
        text-align: inherit;
        outline-color: transparent;
    `,
    "button, summary": `cursor: pointer;`,
    "*:focus": `outline: 1px dashed rgba(255, 255, 255, 0.15);`,
    "html": `box-sizing: border-box; line-height: 1;`,
    "body": `
        background-color: ${Color.toCssString(Color.background)};
        font-family: Lato, -apple-system, BlinkMacSystemFont, avenir next, avenir,
            helvetica neue, helvetica, Ubuntu, roboto, noto, segoe ui, arial, sans-serif;
        border-top: 6px solid ${Color.toCssString(Color.accent)};
        color: ${Color.toCssString(Color.gray700)};
    `
}

export function view(state: State.State): Html.Html<Event> {
    return Layout.toHtml(
        "div",
        [
            Html.style("display", "flex"),
            Html.style("flex-direction", "column"),
            Html.style("align-items", "center"),
        ],
        Layout.withCss(
            globalCss,
            Layout.column(
                "div",
                [
                    Html.style("max-width", (1024 + 40) + "px"),
                    Html.paddingXY(0, 20),
                ],
                [
                    Layout.space(50),
                    CreateRecord.view(
                        [
                            Html.padding(10),
                        ],
                        {
                            createRecord: state.createRecord,
                            records: state.records,
                        }
                    ),
                    Records.view(state.records, state.today),
                ]
            )
        )
    )
}

// --- MAIN


let $rootElement = document.getElementById('root') as Element | Text

/** Flags refer to some external state that is passed to app initialization */
const flags = localStorage.getItem("state")

if ($rootElement !== null) {
    let [state, initialCmd] = State.initialState<Event>(flags, { day: 23, month: 4, year: 2021 })
    let currentView = view(state)

    const dispatch = (event: Event) => {
        const { state: newState, cmd } = update(state, event)

        const newView = view(newState)
        const patch = VirtualDom.diff(currentView, newView, dispatch)

        patch($rootElement)
        currentView = newView
        cmd.execute(dispatch)
    }

    const $initialRender = Html.toElement(currentView, dispatch)
    $rootElement.replaceWith($initialRender)
    $rootElement = $initialRender

    requestAnimationFrame(() => {
        initialCmd.execute(dispatch)
    })
}
