import React from "react";

function deleteLine(e){
    console.log("working");
}
export default function DrawingLine(props) {
    const pathData = "M " +
        props.line.map(p => p.get('x') + ' ' + p.get('y'))
            .join(" L ");

    return <path className="path"
        onClick={(e) => { props.deletePath(e) }}
        d={pathData} />;
}
