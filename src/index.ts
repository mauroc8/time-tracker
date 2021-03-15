/** About this code
 * 
 * I'm using The Elm Architecture, which is essentially the same idea as React/Redux.
 * 
 */

import * as State from './State'
import * as Update from './Update'
import * as Records from './Records'
import * as CreateRecord from './CreateRecord'

import * as Html from './utils/vdom/Html'
import * as VirtualDom from './utils/vdom/VirtualDom'

import * as Layout from './utils/layout/Layout'
import * as Attribute from './utils/layout/Attribute'

import * as Color from './style/Color'
import * as  Component from './style/Component'

// --- VIEW


export function view(state: State.State): Html.Html<Update.Event> {
    return Layout.toHtml(
        Layout.column(
            "div",
            [
                Attribute.style("align-items", "center"),
            ],
            [
                // CSS
                Layout.html(
                    Html.node(
                        "style",
                        [
                            Html.key("1"),
                        ],
                        [
                            Html.text(resetCss()),
                            Html.text(bodyCss()),
                            Html.text(Component.textInputCss()),
                        ]
                    )
                ),
                // CONTENT
                Layout.column(
                    "div",
                    [
                        Attribute.style("max-width", (1024 + 40) + "px"),
                        Attribute.style("padding", "0 20px"),
                    ],
                    [
                        Layout.space(50),
                        CreateRecord.view(
                            [
                                Attribute.padding(10),
                            ],
                            {
                                createRecord: state.createRecord,
                                records: state.records,
                                tasks: state.tasks,
                            }
                        ),
                        Records.view(state.records, state.tasks, state.today),
                    ]
                ),
            ]
        )
    )
}

function resetCss(): string {
    return `
* {
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
}
*:hover, *:focus, *:active {
    outline: 0;
}

html {
    box-sizing: border-box;
    line-height: 1;
}
    `
}

function bodyCss(): string {
    return `
body {
    background-color: ${Color.toCssString(Color.background)};
    font-family: Lato, -apple-system, BlinkMacSystemFont, avenir next, avenir,
        helvetica neue, helvetica, Ubuntu, roboto, noto, segoe ui, arial, sans-serif;
    border-top: 6px solid ${Color.toCssString(Color.accent)};
    color: ${Color.toCssString(Color.gray700)};
}
    `
}

// --- MAIN


let $rootElement = document.getElementById('root') as Element | Text
let timeout = setTimeout(() => { }, 0)

/** Flags refer to some external state that is passed to app initialization */
const flags = localStorage.getItem("state")

if ($rootElement !== null) {
    let [state, initialEffect] = State.initialState<Update.Event>(flags)
    let currentView = view(state)

    const dispatch = (event: Update.Event) => {
        const [newState, effect] = Update.update(state, event)

        const newView = view(newState)
        const patch = VirtualDom.diff(currentView, newView, dispatch)

        patch($rootElement)
        currentView = newView
        effect.perform(dispatch)
    }

    const $initialRender = Html.toElement(currentView, dispatch)
    $rootElement.replaceWith($initialRender)
    $rootElement = $initialRender

    initialEffect.perform(dispatch)
}
