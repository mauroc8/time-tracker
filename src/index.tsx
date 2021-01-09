import * as React from 'react'
import ReactDOM from 'react-dom'

/** About this code
 * 
 * I'm using React only as a "virtual dom" library. I'm not creating components, nor
 * using any of React's features. (I find them unnecessary for this project.)
 * 
 * For convenience, I use `useState` once to hook into the v-dom update.
 * 
 * I'm using The Elm Architecture, which is essentially the same idea as React/Redux,
 * made simpler by avoiding local state altogether.
 */

import * as Maybe from './Maybe'
import * as Utils from './Utils'
import * as Style from './Style'

import * as Task from './Task'
import * as CreateRecord from './CreateRecord'
import * as Record from './Record'

import * as View from './View'
import * as Update from './Update'
import * as State from './State'


const App: React.FunctionComponent = () => {
    const [state, setState] = React.useState(State.initialState)

    const dispatch = React.useCallback((event: Update.Event) => {
        setState(state => Update.update(state, event))
    }, [])

    return View.view(state, dispatch)
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
)
