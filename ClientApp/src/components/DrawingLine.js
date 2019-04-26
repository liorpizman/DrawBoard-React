import React from "react";

function deleteLine(e) {
    console.log("working");
}

export default function DrawingLine(props) {
    /* var lineToDraw = props.line;
     const pathDetails = lineToDraw.getIn([props.line.size - 1]);
     let hasConf = false;
     if (pathDetails.ip && pathDetails.id) {
         lineToDraw = lineToDraw.removeIn([props.line.size - 1]);
         hasConf = true;
     }*/
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
