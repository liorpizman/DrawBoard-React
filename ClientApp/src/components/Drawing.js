import DrawingLine from "./DrawingLine";
import React from "react";

/**
 * Drawing component function used to display svg element
 */
export default function Drawing(props) {
    return (
        <svg className="drawing">
            {props.lines.map((line, index) => (
                <DrawingLine
                    key={index}
                    line={line}
                    details={line.details}
                    deletePath={props.deletePath}/>
            ))}
        </svg>
    );
}