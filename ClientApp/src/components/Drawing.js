import  DrawingLine from "./DrawingLine";
import React from "react";

export default function Drawing(props) {
  return (
    <svg className = "drawing">
      {props.lines.map((line, index) => (
        <DrawingLine key={index} line={line} deletePath = {props.deletePath} />
      ))}
    </svg>
  );
}