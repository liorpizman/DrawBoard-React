import React from "react";
require('./Footer.css');

/**
 * Footer component function used to display the sticky footer
 */
export default function Footer(props) {
    return (
        <div>
            <div className="footer">
                <div className="center">
                    <b> Ⓒ  Designed By Lior Pizman - 2019  Ⓒ </b>
                </div>
            </div>
        </div>
    )
}