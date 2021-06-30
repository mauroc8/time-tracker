import * as Main from './Main'
import { startRuntime } from './runtime'

/** About this code
 * 
 * I'm using The Elm Architecture, which is essentially the same idea as React/Redux.
 * 
 */
let $rootElement = document.getElementById('root')

if ($rootElement === null) {
    throw `The runtime didn't start because it couldn't find a <div id="root"> to plug into`
}

startRuntime(
    $rootElement,
    Main.init(
        localStorage.getItem('state'),
        new window.Date(),
    ),
    Main.view,
    Main.update
)
