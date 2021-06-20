import * as Html from './Html'

import * as Utils from '../utils/Utils'
import * as Pair from '../utils/Pair'
import * as Maybe from '../utils/Maybe'
import * as Result from '../utils/Result'
import * as Array_ from '../utils/Array'
import * as Decoder from '../utils/Decoder'

export type Patch = ($node: Element | Text) => void

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
        }
    }
}

function unkeyChildren<T>(children: Array<[string, Html.Html<T>]> | Array<Html.Html<T>>): Array<Html.Html<T>> {
    return children.map((child: [string, Html.Html<T>] | Html.Html<T>) =>
        child instanceof Array
            ? child[1]
            : child
    )
}

function replace<T>(
    newVDom: Html.Html<T>,
    dispatch: (event: T) => void,
) {
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
    switch (attribute.tag) {
        case 'attribute':
            $element.setAttribute(attribute.name, attribute.value)
            return

        case 'property':
            ($element as any)[attribute.name] = attribute.value
            return

        case 'eventHandler':
            ($element as any)[`on${attribute.eventName}`] = (event: Event) =>
                dispatch(attribute.handler(event))

            return

        case 'style':
            ($element as any).style[attribute.property] = attribute.value
            return

        case 'class':
            try {
                $element.classList.add(attribute.value)
            } catch (e) {
                // ¯\_(ツ)_/¯
            }
            return
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
): ($parent: Element | Text) => void {
    return $parent => {
        if ($parent instanceof Element) {
            /** We need to calculate all the patches and then apply them because we could alter the indexes
             * when applying some patch.
             */
            const patches = getChildrenPatches(oldChildren, newChildren, dispatch, $parent)
            patches.forEach(patch => patch())
        }
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
            let keyedOldChildren = toKeyedNode(oldChildren, $node)
            let oldChildrenDict = Array_.toDictionary(keyedOldChildren, child => child.key)

            /** Diff elements that share keys. */

            for (const [key, html] of newChildren) {
                const oldChild = oldChildrenDict[key]

                if (oldChild) {
                    diff(oldChild.html, html, dispatch)(oldChild.node)
                }
            }

            /** Remove all elements that are not present in the newChildren list */

            const keyedNewChildrenDict = Array_.toDictionary(newChildren, child => child[0])

            for (const {key, node} of keyedOldChildren) {
                if (keyedNewChildrenDict[key] === undefined) {
                    node.remove()
                }
            }
            
            /** Update the dictionary references */

            keyedOldChildren = toKeyedNode(
                oldChildren.filter(child => keyedNewChildrenDict[child[0]] !== undefined),
                $node
            )
            oldChildrenDict = Array_.toDictionary(keyedOldChildren, child => child.key)


            /** Order elements based on the `newChildren` order */

            let nextNode: Element | Text | null = null
        
            // A reversed loop is convenient because we want to use `Node.prototype.insertBefore`
            // to reorder nodes.
            for (let i = newChildren.length - 1; i >= 0; i = i - 1) {
                const [key, html] = newChildren[i]

                let node: Element | Text

                if (oldChildrenDict[key] === undefined) {
                    // The element didn't exist. Create it and insert it.
                    node = $node.insertBefore(
                        render(html, dispatch),
                        nextNode
                    )
                } else {
                    // The element might have changed its order. Force it where it belongs.
                    node = $node.insertBefore(
                        oldChildrenDict[key].node,
                        nextNode
                    )
                }

                nextNode = node
            }
        }
    }
}

type KeyedNode<E> = {
    key: string,
    html: Html.Html<E>,
    node: Element | Text,
    nextKey: string | null,
}

function toKeyedNode<T>(
    children: Array<[string, Html.Html<T>]>,
    $parent: Element
): Array<KeyedNode<T>> {
    return children.map(([key, html], i) => ({
        key,
        html,
        node: $parent.childNodes[i] as Element | Text,
        nextKey: children[i + 1] === undefined ? null : children[i + 1][0]
    }))
}
