import * as Html from './Html'

import * as Utils from '../utils/Utils'
import * as Array_ from '../utils/Array'

/** Note: references a mutable domNode. */
export type VirtualDom<E> = {
    vNode: Html.Html<E>,
    domNode: Element | Text,
}

export function patch<E>(
    virtualDom: VirtualDom<E>,
    vNode: Html.Html<E>,
    dispatch: (event: E) => void
): VirtualDom<E> {
    if (virtualDom.vNode === vNode) {
        return virtualDom
    }

    switch (virtualDom.vNode.nodeType) {
        case 'text':
            return replace(virtualDom.domNode, vNode, dispatch)

        case 'node':
            switch (vNode.nodeType) {
                case 'text':
                    return replace(virtualDom.domNode, vNode, dispatch)
                case 'lazy':
                    return patch(virtualDom, getLazyValue(vNode), dispatch)
                default:
                    if (virtualDom.vNode.tagName === vNode.tagName && virtualDom.domNode instanceof Element) {
                        patchAttributes(
                            virtualDom.domNode,
                            virtualDom.vNode.attributes,
                            vNode.attributes,
                            dispatch
                        )
                        patchChildren(
                            virtualDom.domNode,
                            virtualDom.vNode.children,
                            unkeyChildren(vNode.children),
                            dispatch
                        )
                        return { vNode, domNode: virtualDom.domNode }
                    } else {
                        return replace(virtualDom.domNode, vNode, dispatch)
                    }
            }

        case 'keyed':
            switch (vNode.nodeType) {
                    case 'text':
                        return replace(virtualDom.domNode, vNode, dispatch)
                    case 'keyed':
                        if (virtualDom.vNode.tagName === vNode.tagName && virtualDom.domNode instanceof Element) {
                            patchAttributes(
                                virtualDom.domNode,
                                virtualDom.vNode.attributes,
                                vNode.attributes,
                                dispatch
                            )
                            patchKeyedChildren(
                                virtualDom.domNode,
                                virtualDom.vNode.children,
                                vNode.children,
                                dispatch
                            )
                            return { vNode, domNode: virtualDom.domNode }
                        } else {
                            return replace(virtualDom.domNode, vNode, dispatch)
                        }
                    case 'node':
                        if (virtualDom.vNode.tagName === vNode.tagName && virtualDom.domNode instanceof Element) {
                            patchAttributes(
                                virtualDom.domNode,
                                virtualDom.vNode.attributes,
                                vNode.attributes,
                                dispatch
                            )
                            patchChildren(
                                virtualDom.domNode,
                                unkeyChildren(virtualDom.vNode.children),
                                vNode.children,
                                dispatch
                            )
                            return { vNode, domNode: virtualDom.domNode }
                        } else {
                            return replace(virtualDom.domNode, vNode, dispatch)
                        }
                    case 'lazy':
                        return patch(virtualDom, getLazyValue(vNode), dispatch)
            }

        case 'lazy':
            switch (vNode.nodeType) {
                case 'lazy':
                    return patch(virtualDom, lazyToHtml(virtualDom.vNode, vNode), dispatch)
                default:
                    return patch(
                        {
                            vNode: getLazyValue(virtualDom.vNode),
                            domNode: virtualDom.domNode
                        },
                        vNode,
                        dispatch
                    )
            }
    }
}

export function replace<E>(domNode: Element | Text, vNode: Html.Html<E>, dispatch: (event: E) => void): VirtualDom<E> {
    const newDomNode = render(vNode, dispatch)
    domNode.replaceWith(newDomNode)
    return { domNode: newDomNode, vNode }
}

function unkeyChildren<T>(children: Array<[string, Html.Html<T>]> | Array<Html.Html<T>>): Array<Html.Html<T>> {
    if (children.length > 0 && children[0] instanceof Array) {
        return unkeyChildrenHelp(children as any)
    }

    return children as any
}

function unkeyChildrenHelp<T>(children: Array<[string, Html.Html<T>]>): Array<Html.Html<T>> {
    return children.map((child: [string, Html.Html<T>]) => child[1])
}

function render<Evt>(html: Html.Html<Evt>, dispatch: (evt: Evt) => void): Element | Text {
    switch (html.nodeType) {
        case 'node':
            const element = document.createElement(html.tagName)

            for (let attribute of html.attributes)
                applyAttribute(attribute, dispatch, element)

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

        case 'lazy':
            return render(getLazyValue(html), dispatch)
    }
}

function applyAttribute<Evt>(attribute: Html.Attribute<Evt>, dispatch: (evt: Evt) => void, $element: Element): void {
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
function weirdZipLikeThing<A, B>(
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

// --- Attributes

function patchAttributes<T>(
    domNode: Element,
    currentAttributes: Array<Html.Attribute<T>>,
    newAttributes: Array<Html.Attribute<T>>,
    dispatch: (event: T) => void,
): void {
    weirdZipLikeThing(
        currentAttributes,
        newAttributes,
        (oldAttr, newAttr, i) => {
            if (!attributeEquality(oldAttr, newAttr)) {
                replaceAttribute(oldAttr, newAttr, dispatch, domNode)
            }
        },
        (oldAttr, i) => {
            removeAttribute(oldAttr, domNode)
        },
        (newAttr, i) => {
            applyAttribute(newAttr, dispatch, domNode)
        }
    )
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
    applyAttribute(newAttr, dispatch, $node)
}

function attributeEquality<T>(a: Html.Attribute<T>, b: Html.Attribute<T>): boolean {
    if (a.tag === 'attribute' && b.tag === 'attribute') {
        return a.name === b.name && a.value === b.value
    } else if (a.tag === 'property' && b.tag === 'property') {
        return a.name === b.name && Utils.equals(a.value, b.value)
    } else if (a.tag === 'eventHandler' && b.tag === 'eventHandler') {
        // The function comparison will most likely always return false
        // a smarter implementation could optimize this case somehow ?
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


// --- CHILDREN

function patchChildren<T>(
    domNode: Element,
    currentChildren: Array<Html.Html<T>>,
    newChildren: Array<Html.Html<T>>,
    dispatch: (event: T) => void,
): void {
    /** We need to calculate all the patches and then apply them because we could alter the indexes
     * when applying some patch.
     */
    const patches = weirdZipLikeThing(
        currentChildren,
        newChildren,
        (currentChild, newChild, i) => {
            const $child = domNode.childNodes[i]

            return () => {
                if ($child instanceof Element || $child instanceof Text)
                    patch({ domNode: $child, vNode: currentChild }, newChild, dispatch)
                else
                    throw { domNode, currentChild, newChild, $child }
            }
        },
        (_, i) => {
            const $child = domNode.childNodes[i]

            return () => {
                $child.remove()
            }
        },
        (newChild, _) => () => {
            domNode.appendChild(render(newChild, dispatch))
        }
    )

    patches.forEach(patch => patch())
}

// -- KEYED

function patchKeyedChildren<T>(
    domNode: Element,
    currentChildren: Array<[string, Html.Html<T>]>,
    newChildren: Array<[string, Html.Html<T>]>,
    dispatch: (event: T) => void,
): void {
    patchKeyedNodes(
        toKeyedNodes(currentChildren, domNode),
        newChildren,
        domNode,
        dispatch
    )
}

type KeyedNodes<E> =
    | {
        tag: 'keyedNodes',
        array: Array<KeyedNode<E>>,
        dictionary: { [key: string]: KeyedNode<E> },
        indices: { [key: string]: number | undefined },
    }
    | { tag: 'delete', index: number, key: string, keyedNodes: KeyedNodes<E> }
    | { tag: 'append', keyedNode: KeyedNode<E>, keyedNodes: KeyedNodes<E> }
    | { tag: 'move', from: number, to: number, keyedNodes: KeyedNodes<E> }

function getKeyedNodesLength<E>(keyedNodes: KeyedNodes<E>): number {
    switch (keyedNodes.tag) {
        case 'keyedNodes':
            return keyedNodes.array.length
        case 'delete':
            return getKeyedNodesLength(keyedNodes.keyedNodes) - 1
        case 'append':
            return getKeyedNodesLength(keyedNodes.keyedNodes) + 1
        case 'move':
            return getKeyedNodesLength(keyedNodes.keyedNodes)
    }
}

function getKeyedNodeFromIndex<E>(keyedNodes: KeyedNodes<E>, index: number): KeyedNode<E> | undefined {
    switch (keyedNodes.tag) {
        case 'keyedNodes':
            return keyedNodes.array[index]

        case 'delete':
            if (keyedNodes.index <= index) {
                return getKeyedNodeFromIndex(keyedNodes.keyedNodes, index + 1)
            }
            return getKeyedNodeFromIndex(keyedNodes.keyedNodes, index)

        case 'append':
            if (getKeyedNodesLength(keyedNodes.keyedNodes) === index) {
                return keyedNodes.keyedNode
            }

            return getKeyedNodeFromIndex(keyedNodes.keyedNodes, index)

        case 'move':
            return getKeyedNodeFromIndex(keyedNodes.keyedNodes, reorderedIndex(index, keyedNodes.to, keyedNodes.from))
    }
}

function getKeyedNodeFromKey<E>(keyedNodes: KeyedNodes<E>, key: string): KeyedNode<E> | undefined {
    switch (keyedNodes.tag) {
        case 'keyedNodes':
            return keyedNodes.dictionary[key]

        case 'delete':
            if (keyedNodes.key === key) {
                return undefined
            }
            return getKeyedNodeFromKey(keyedNodes.keyedNodes, key)

        case 'append':
            if (keyedNodes.keyedNode.key === key) {
                return keyedNodes.keyedNode
            }
            return getKeyedNodeFromKey(keyedNodes.keyedNodes, key)

        case 'move':
            return getKeyedNodeFromKey(keyedNodes.keyedNodes, key)

    }
}

function indexOfKeyedNode<E>(keyedNodes: KeyedNodes<E>, key: string): number | undefined {
    switch (keyedNodes.tag) {
        case 'keyedNodes':
            return keyedNodes.indices[key]

        case 'delete':
            const originalIndexOf = indexOfKeyedNode(keyedNodes.keyedNodes, key)

            if (originalIndexOf === undefined) {
                return undefined
            } else {
                if (originalIndexOf == keyedNodes.index) {
                    return undefined
                }
        
                if (originalIndexOf > keyedNodes.index) {
                    return originalIndexOf - 1
                }
        
                return originalIndexOf
            }
        
        case 'append':
            if (keyedNodes.keyedNode.key === key) {
                return getKeyedNodesLength(keyedNodes.keyedNodes)
            }
            return indexOfKeyedNode(keyedNodes.keyedNodes, key)

        case 'move':
            const index = indexOfKeyedNode(keyedNodes.keyedNodes, key)

            if (index === undefined) {
                return undefined
            } else {
                return reorderedIndex(index, keyedNodes.from, keyedNodes.to)
            }
    }
}

type KeyedNode<E> = {
    key: string,
    virtualDom: VirtualDom<E>,
}

function toKeyedNodes<E>(
    vdom: Array<[string, Html.Html<E>]>,
    $parent: Element,
): KeyedNodes<E> {
    const indices: { [key: string]: number | undefined } = vdom.reduce(
        (prev, [key, _], i) => {
            prev[key] = i
            return prev
        },
        {} as any
    )

    const array: Array<KeyedNode<E>> = vdom.map(([key, html], i) => ({
        key,
        virtualDom: {
            domNode: $parent.childNodes[i] as Element | Text,
            vNode: html,
        },
    }))

    const dictionary: { [key: string]: KeyedNode<E> } = array.reduce(
        (prev, curr, i) => {
            prev[curr.key] = curr
            return prev
        },
        {} as any
    )

    return {
        tag: 'keyedNodes',
        indices, array, dictionary,
    }
}

function deleteFromKeyedNodes<E>(
    keyedNodes: KeyedNodes<E>,
    deletedIndex: number,
    deletedKey: string
): KeyedNodes<E> {
    return {
        tag: 'delete',
        index: deletedIndex,
        key: deletedKey,
        keyedNodes
    }
}

function appendToKeyedNodes<E>(
    keyedNodes: KeyedNodes<E>,
    keyedNode: KeyedNode<E>,
): KeyedNodes<E> {
    return {
        tag: 'append',
        keyedNode,
        keyedNodes
    }
}

function patchKeyedNodes<E>(
    initialKeyedNodes: KeyedNodes<E>,
    newChildren: Array<[string, Html.Html<E>]>,
    domElement: Element,
    dispatch: (event: E) => void,
): KeyedNodes<E> {
    const newChildrenDict = Array_.toDictionary(newChildren, Utils.id)
    let keyedNodes = initialKeyedNodes

    /** Traverse the current `keyedNodes_` in the DOM, removing or patching nodes. */
    for (
        let i = 0, removed = 0, keyedNode = getKeyedNodeFromIndex(keyedNodes, i - removed);
        keyedNode !== undefined;
        i = i + 1, keyedNode = getKeyedNodeFromIndex(keyedNodes, i - removed)
    ) {
        const newVNode = newChildrenDict[keyedNode.key]

        if (newVNode === undefined) {
            /** REMOVE */
            try {
                keyedNode.virtualDom.domNode.remove()
            } catch (e) {
                Utils.debugException('keyed.node.remove()', e)
            }

            keyedNodes = deleteFromKeyedNodes(keyedNodes, i, keyedNode.key)

            removed = removed + 1
        } else {
            /** APPLY MUTATIONS IN PLACE, IGNORING THE FACT THAT THE ELEMENT MAY BE OUT OF ORDER */
            try {
                keyedNode.virtualDom = patch(keyedNode.virtualDom, newVNode, dispatch)
            } catch (e) {
                Utils.debugException('keyed.node diff()', e)
            }
        }
    }

    /** Traverse the `newChildren` into the `keyedNodes_`, creating or reordering nodes. */

    /** CREATE */
    for (
        let i = 0,
        length = newChildren.length;
        i < length;
        i = i + 1
    ) {
        const [key, html] = newChildren[i]

        const expectedNode = getKeyedNodeFromKey(keyedNodes, key)
        const currentNode = getKeyedNodeFromIndex(keyedNodes, i)
        const expectedNodeIndex = indexOfKeyedNode(keyedNodes, key)

        if (expectedNode === undefined) {
            try {
                const keyed: KeyedNode<E> = {
                    key,
                    virtualDom: {
                        vNode: html,
                        domNode: domElement.insertBefore(render(html, dispatch), null),
                    },
                }
    
                keyedNodes = appendToKeyedNodes(keyedNodes, keyed)
            } catch (e) {
                Utils.debugException('insertBefore(render())', e)
            }
        } else if (
            currentNode !== undefined
                && expectedNodeIndex !== undefined
                && expectedNode.key !== currentNode.key
        ) {
            // Reorder nodes using O(n) DOM mutations in the worst case, but close to O(1) in common scenarios.
            keyedNodes = keyedNodesMove(
                keyedNodes,
                expectedNode,
                expectedNodeIndex,
                i,
                domElement
            )
        
        }
    }

    return keyedNodes
}

function keyedNodesMove<E>(
    keyedNodes: KeyedNodes<E>,
    keyed: KeyedNode<E>,
    from: number,
    to: number,
    $parent: Element,
): KeyedNodes<E> {
    const desiredNextSibling = getKeyedNodeFromIndex(keyedNodes, to + 1)?.virtualDom?.domNode || null

    if (desiredNextSibling === keyed.virtualDom.domNode) {
        // If we're right next to where we want to be, we can move the previous element
        // to the end so that we can take its place.
        //
        // This helps the simple reorder "move one element to the end of the list"
        // to be very fast.
        try {
            $parent.insertBefore(
                getKeyedNodeFromIndex(keyedNodes, to)?.virtualDom?.domNode || null as any,
                null
            )
        } catch (e) {
            Utils.debugException('insertBefore() case 1', e)
        }

        return movedKeyNode(keyedNodes, to, getKeyedNodesLength(keyedNodes) - 1)
    } else {
        // Otherwise just move the element from its current position to the desired position.
        try {
            $parent.insertBefore(
                keyed.virtualDom.domNode,
                desiredNextSibling
            )
        } catch (e) {
            Utils.debugException('insertBefore() case 2', e)
        }

        return movedKeyNode(keyedNodes, from, to)
    }

}

function movedKeyNode<E>(
    keyedNodes: KeyedNodes<E>,
    from: number,
    to: number,
): KeyedNodes<E> {
    return {
        tag: 'move',
        from,
        to,
        keyedNodes
    }
}

function reorderedIndex(
    originalIndex: number,
    from: number,
    to: number
): number {
    if (from < to) {
        if (originalIndex === from) {
            return to
        } else if (from < originalIndex && originalIndex <= to) {
            return originalIndex - 1
        } else {
            return originalIndex
        }
    } else if (from > to) {
        if (originalIndex === from) {
            return to
        } else if (to <= originalIndex && originalIndex < from) {
            return originalIndex + 1
        } else {
            return originalIndex
        }
    } else {
        return originalIndex
    }
}


// --- LAZY

type Lazy<E, A> = {
    type: 'Html',
    nodeType: 'lazy',
    argument: EqualityRecord<A>,
    getValue: (argument: A) => Html.Html<E>,
    value?: Html.Html<E>,
}

type EqualityRecord<A> =
    { [Key in keyof A]: Equality<A[Key]> }

type Equality<A> =
    | { tag: 'structural', value: A }
    | { tag: 'referential', value: A }

function equality<A>(a: Equality<A>, b: Equality<A>): boolean {
    if (a.tag === 'referential' && b.tag === 'referential') {
        return a.value === b.value
    }

    return Utils.equals(a.value, b.value)
}

function equalityWithUndefined<A>(a: Equality<A>, b: Equality<A> | undefined): boolean {
    if (b === undefined) {
        return false
    }

    return equality(a, b)
}

function equalityRecordsMatch<A>(
    a: EqualityRecord<A>,
    b: EqualityRecord<A>,
): boolean {
    for (const key in a) if (Utils.hasOwnProperty(a, key)) {
        if (!equalityWithUndefined(a[key], b[key])) {
            return false
        }
    }

    return true
}

function unwrapEqualityRecord<A>(record: EqualityRecord<A>): A {
    const x = {} as A

    for (const key in record) if (Utils.hasOwnProperty(record, key)) {
        x[key] = record[key].value
    }

    return x
}

function getLazyValue<E, A>(lazy: Lazy<E, A>): Html.Html<E> {
    if (lazy.value !== undefined) {
        return lazy.value
    }

    return lazy.value = lazy.getValue(unwrapEqualityRecord(lazy.argument))
}

function lazyToHtml<E, A>(
    currentLazy: Lazy<E, A>,
    lazy: Lazy<E, A>,
): Html.Html<E> {
    if (equalityRecordsMatch(currentLazy.argument, lazy.argument)) {
        return getLazyValue(currentLazy)
    }

    return getLazyValue(lazy)
}
