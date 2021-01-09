import * as React from 'react'

export function spacing(spacing: number): React.CSSProperties {
    return { margin: `${spacing / 2}px` }
}