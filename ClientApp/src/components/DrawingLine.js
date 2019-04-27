import React from "react";

/**
 * Drawing component function used to display path element
 */
export default function DrawingLine(props) {

    /*The x and y coordinates of the current path drawn by the user*/
    const pathData = "M " +
        props.line.points.map(p => p.get('x') + ' ' + p.get('y'))
            .join(" L ");

    return <path
        ip={props.line.details.ip}
        id={props.line.details.id}
        className="path"
        onClick={(e) => { props.deletePath(e) }}
        d={pathData}
    />;
}
