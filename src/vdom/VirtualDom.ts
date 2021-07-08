import * as Html from './Html'

import * as Utils from '../utils/Utils'
import * as Array_ from '../utils/Array'

export type Patch = ($node: Element | Text) => Element | Text

export function diff<T>(
    oldVDom: Html.Html<T>,
    newVDom: Html.Html<T>,
    dispatch: (event: T) => void,
): Patch {
    if (
        oldVDom.nodeType === 'text'
            || newVDom.nodeType === 'text'
            || oldVDom.tagName !== newVDom.tagName
    ) {
        return replace(newVDom, dispatch)
    } else {
        const patchAttributes = diffAttributes(oldVDom.attributes, newVDom.attributes, dispatch)

        const patchChildren = oldVDom.nodeType === 'keyed' && newVDom.nodeType === 'keyed'
            ? diffKeyedChildren(oldVDom.children, newVDom.children, dispatch)
            : diffChildren(unkeyChildren(oldVDom.children), unkeyChildren(newVDom.children), dispatch)

        return $node => {
            patchAttributes($node)
            patchChildren($node)

            return $node
        }
    }
}

function isKeyedChildren<T>(
    children: Array<[string, Html.Html<T>]> | Array<Html.Html<T>>
): children is Array<[string, Html.Html<T>]> {
    return children[0] instanceof Array
}

function unkeyChildren<T>(children: Array<[string, Html.Html<T>]> | Array<Html.Html<T>>): Array<Html.Html<T>> {
    if (isKeyedChildren(children)) {
        return children.map((child: [string, Html.Html<T>]) => child[1])
    }

    return children
}

function replace<T>(
    newVDom: Html.Html<T>,
    dispatch: (event: T) => void,
): Patch {
    return ($node: Element | Text) => {
        const $newNode = render(newVDom, dispatch)
        $node.replaceWith($newNode)

        return $newNode
    }
}

export function render<Evt>(html: Html.Html<Evt>, dispatch: (evt: Evt) => void): Element | Text {
    switch (html.nodeType) {
        case 'node':
            const element = document.createElement(html.tagName)

            for (let attribute of html.attributes)
                toDomAttribute(attribute, dispatch, element)

            for (let child of html.children)
                element.appendChild(render(child, dispatch))

            return element

        case 'text':
            return document.createTextNode(html.text)
        
        case 'keyed':
            return render(
                Html.node(
                    html.tagName,
                    html.attributes,
                    html.children.map(([_, child]) => child)
                ),
                dispatch
            )
    }
}

function toDomAttribute<Evt>(attribute: Html.Attribute<Evt>, dispatch: (evt: Evt) => void, $element: Element): void {
    try {
        switch (attribute.tag) {
            case 'attribute':
                $element.setAttribute(attribute.name, attribute.value)
                return
    
            case 'property':
                ($element as any)[attribute.name] = attribute.value
                return
    
            case 'eventHandler':
                ($element as any)[`on${attribute.eventName}`] = (event: Utils.Json) =>
                    dispatch(attribute.handler(event))
    
                return
    
            case 'style':
                ($element as any).style[attribute.property] = attribute.value
                return
    
            case 'class':
                if (attribute.value !== '') {
                    $element.classList.add(attribute.value)
                }
        }
    } catch (e) {
        Utils.debugException('toDomAttribute', e)
    }
}

/** A list's indexed map2 but without dropping elements.
 */
function map2Extra<A, B>(
    xs: Array<A>,
    ys: Array<A>,
    bothPresent: (x: A, y: A, index: number) => B,
    xPresent: (x: A, index: number) => B,
    yPresent: (y: A, index: number) => B
): Array<B> {
    const array: Array<B> = []

    for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
        array.push(bothPresent(xs[i], ys[i], i))
    }

    for (let i = ys.length; i < xs.length; i++) {
        array.push(xPresent(xs[i], i))
    }

    for (let i = xs.length; i < ys.length; i++) {
        array.push(yPresent(ys[i], i))
    }

    return array
}

// diffAttributes

function diffAttributes<T>(
    oldAttributes: Array<Html.Attribute<T>>,
    newAttributes: Array<Html.Attribute<T>>,
    dispatch: (event: T) => void,
): ($node: Element | Text) => void {

    const patches = map2Extra(
        oldAttributes,
        newAttributes,
        (oldAttr, newAttr, i) => ($node: Element) => {
            if (!attributeEquality(oldAttr, newAttr)) {
                replaceAttribute(oldAttr, newAttr, dispatch, $node)
            }
        },
        (oldAttr, i) => $node => {
            removeAttribute(oldAttr, $node)
        },
        (newAttr, i) => $node => {
            toDomAttribute(newAttr, dispatch, $node)
        }
    )

    return $node => {
        if ($node instanceof Element)
            patches.forEach(patch => patch($node))
    }
}

function replaceAttribute<A>(
    oldAttr: Html.Attribute<A>,
    newAttr: Html.Attribute<A>,
    dispatch: (event: A) => void,
    $node: Element
) {
    /** Handle this special case for input.value and similar. */
    if (oldAttr.tag === 'property' && newAttr.tag === 'property') {
        if (oldAttr.name === newAttr.name) {
            if (($node as any)[newAttr.name] !== newAttr.value) {
                ($node as any)[newAttr.name] = newAttr.value;
            }
            return
        }
    }

    removeAttribute(oldAttr, $node)
    toDomAttribute(newAttr, dispatch, $node)
}

function attributeEquality<T>(a: Html.Attribute<T>, b: Html.Attribute<T>): boolean {
    if (a.tag === 'attribute' && b.tag === 'attribute') {
        return a.name === b.name && a.value === b.value
    } else if (a.tag === 'property' && b.tag === 'property') {
        return a.name === b.name && Utils.equals(a.value, b.value)
    } else if (a.tag === 'eventHandler' && b.tag === 'eventHandler') {
        // The function comparison will most likely always return false
        // a smarter implementation could optimize this case somehow.
        return a.eventName === b.eventName && a.handler === b.handler
    } else if (a.tag === 'style' && b.tag === 'style') {
        return a.property === b.property && a.value === b.value
    } else if (a.tag === 'class' && b.tag === 'class') {
        return a.value === b.value
    }

    return false
}

function removeAttribute<T>(attr: Html.Attribute<T>, $node: Element): void {
    if ($node instanceof Text) {
        // Text nodes don't have attributes
        return
    }

    try {
        switch (attr.tag) {
            case 'attribute':
                $node.removeAttribute(attr.name)
                return
            case 'property':
                ($node as any)[attr.name] = undefined
                return
            case 'eventHandler':
                ($node as any)[`on${attr.eventName}`] = undefined
                return
            case 'style':
                ($node as any).style[attr.property] = ''
                return
            case 'class':
                $node.classList.remove(attr.value)
                return
        }
    } catch (e) {
        // ¯\_(ツ)_/¯
        return
    }
}


// diffChildren

function diffChildren<T>(
    oldChildren: Array<Html.Html<T>>,
    newChildren: Array<Html.Html<T>>,
    dispatch: (event: T) => void,
): Patch {
    return $parent => {
        if ($parent instanceof Element) {
            /** We need to calculate all the patches and then apply them because we could alter the indexes
             * when applying some patch.
             */
            const patches = getChildrenPatches(oldChildren, newChildren, dispatch, $parent)
            patches.forEach(patch => patch())
        }

        return $parent
    }
}

function getChildrenPatches<T>(
    oldChildren: Array<Html.Html<T>>,
    newChildren: Array<Html.Html<T>>,
    dispatch: (event: T) => void,
    $parent: Element,
): Array<() => void> {
    return map2Extra(
        oldChildren,
        newChildren,
        (oldChild, newChild, i) => {
            const $child = $parent.childNodes[i]

            return () => {
                if ($child instanceof Element || $child instanceof Text)
                    diff(oldChild, newChild, dispatch)($child)
                else
                    throw { $parent, oldChild, newChild, $child }
            }
        },
        (_, i) => {
            const $child = $parent.childNodes[i]

            return () => {
                $child.remove()
            }
        },
        (newChild, _) => () => {
            $parent.appendChild(render(newChild, dispatch))
        }
    )
}

function diffKeyedChildren<T>(
    oldChildren: Array<[string, Html.Html<T>]>,
    newChildren: Array<[string, Html.Html<T>]>,
    dispatch: (event: T) => void,
): Patch {
    return ($node: Element | Text) => {
        if ($node instanceof Element) {
            // We use this auxiliary data structure that performs DOM
            // mutations while also mutating the VDOM children.
            const children = keyedNodes(oldChildren, $node)
            const newChildrenDict = Array_.toDictionary(newChildren, Utils.id)

            // Remove children.

            keyedNodesRemove(
                children,
                newChildrenDict,
            )

            // Diff remaining children.

            keyedNodesDiff(
                children,
                newChildrenDict,
                dispatch
            )

            // Create children.

            keyedNodesCreate(
                children,
                newChildren,
                $node,
                dispatch
            )

            // Reorder.

            keyedNodesReorder(
                children,
                newChildren,
                $node
            )
        }

        return $node
    }
}

type KeyedNodes<E> = {
    asArray: Array<KeyedNode<E>>,
    asDictionary: { [key: string]: KeyedNode<E> | undefined },
}

type KeyedNode<E> = {
    key: string,
    html: Html.Html<E>,
    node: Element | Text,
}

function keyedNodes<E>(
    vdom: Array<[string, Html.Html<E>]>,
    $parent: Element,
): KeyedNodes<E> {
    const asArray = vdom.map(([key, html], i) => ({
        key,
        html,
        node: $parent.childNodes[i] as Element | Text
    }))

    return {
        asArray,
        asDictionary: asArray.reduce(
            (prev, curr, i) => {
                prev[curr.key] = curr
                return prev
            },
            Utils.id<{ [key: string]: KeyedNode<E> }>({})
        )
    }
}

/** Remove nodes that are not present in newChildrenDict. Mutates in place */
function keyedNodesRemove<E>(
    keyedNodes: KeyedNodes<E>,
    newChildrenDict: { [key: string]: Html.Html<E> | undefined },
): void {
    for (
        let i = 0,
            length = keyedNodes.asArray.length,
            removed = 0;
        i < length;
        i = i + 1
    ) {
        const keyed = keyedNodes.asArray[i - removed]

        if (newChildrenDict[keyed.key] === undefined) {
            // Delete from DOM
            try {
                keyed.node.remove()
            } catch (e) {
                Utils.debugException('keyed.node.remove()', e)
            }

            // Delete from array
            keyedNodes.asArray.splice(i, 1)

            // Delete from Dictionary
            delete (keyedNodes.asDictionary)[keyed.key]            

            removed = removed + 1
        }
    }
}

/** Diff elements already existing. Mutates in place. */
function keyedNodesDiff<E>(
    keyedNodes: KeyedNodes<E>,
    newHtmls: { [key: string]: Html.Html<E> | undefined },
    dispatch: (event: E) => void,
): void {
    for (
        let i = 0,
            length = keyedNodes.asArray.length;
        i < length;
        i = i + 1
    ) {
        const keyed = keyedNodes.asArray[i]

        const newHtml = newHtmls[keyed.key]

        if (newHtml) {
            // Update the DOM
            try {
                keyed.node = diff(keyed.html, newHtml, dispatch)(keyed.node)
            } catch (e) {
                Utils.debugException('keyed.node diff()', e)
            }

            // Update the Html
            keyed.html = newHtml
        }
    }
}

function keyedNodesCreate<E>(
    keyedNodes: KeyedNodes<E>,
    newChildren: Array<[string, Html.Html<E>]>,
    $parent: Element | Text,
    dispatch: (event: E) => void,
): void {
    for (
        let i = 0,
            length = newChildren.length;
        i < length;
        i = i + 1
    ) {
        const [key, html] = newChildren[i]

        if (keyedNodes.asDictionary[key] === undefined) {
            try {
                const keyed: KeyedNode<E> = {
                    key,
                    html,
                    node: $parent.insertBefore(render(html, dispatch), null)
                }
    
                keyedNodes.asArray.push(keyed)
                keyedNodes.asDictionary[key] = keyed
            } catch (e) {
                Utils.debugException('insertBefore(render())', e)
            }
        }
    }
}

// Warn: This is O(n^2) in the worst case.
// But when reordering one element it's O(n).
// The worst case is when the order is reversed, or when two
// consecutive elements are reordered.
function keyedNodesReorder<E>(
    keyedNodes: KeyedNodes<E>,
    newChildren: Array<[string, Html.Html<E>]>,
    $parent: Element,
): void {
    for (
        let i = 0,
            length = newChildren.length;
        i < length;
        i = i + 1
    ) {
        const [key] = newChildren[i]

        const newNode = keyedNodes.asDictionary[key]
        const oldNode = keyedNodes.asArray[i]

        if (newNode && newNode !== oldNode) {
            keyedNodesMove(keyedNodes, newNode, i, $parent)
        }
    }
}

// O(n)
function keyedNodesMove<E>(
    keyedNodes: KeyedNodes<E>,
    keyed: KeyedNode<E>,
    desiredPosition: number,
    $parent: Element,
): void {
    const desiredNextSibling = keyedNodes.asArray[desiredPosition + 1]?.node || null

    if (desiredNextSibling === keyed.node) {
        // If we're right next to where we want to be, we can move the previous element
        // to the end so that we can take its place.
        try {
            $parent.insertBefore(
                keyedNodes.asArray[desiredPosition].node,
                null
            )
        } catch (e) {
            Utils.debugException('insertBefore() case 1', e)
        }

        keyedNodes.asArray.push(
            ...keyedNodes.asArray.splice(desiredPosition, 1)
        )

        // This helps the simple reorder "move one element to the end of the list"
        // to be very fast.
    } else {
        // Otherwise just move the element from its current position to the desired position.
        try {
            $parent.insertBefore(
                keyed.node,
                desiredNextSibling
            )
        } catch (e) {
            Utils.debugException('insertBefore() case 2', e)
        }

        const currentPosition = keyedNodes.asArray.findIndex((x) => x === keyed)
        keyedNodes.asArray.splice(currentPosition, 1)
        keyedNodes.asArray.splice(desiredPosition, 0, keyed)
    }

}
