import React, { Component } from 'react';
import Drawing from './Drawing.js';
import pencilImg from '../Resources/pencil.png';
import eraserImg from '../Resources/eraser.png';
const immutable = require("immutable");
const signalR = require('@aspnet/signalr');
require('./drawingApp.css');

/**
 * DrawArea component used to display the elements drawn by the user
 */
export class DrawArea extends Component {

    /**
     * DrawArea component constructor
     * @param {any} props
     */
    constructor(props) {
        super(props);

        this.state = {
            isDrawing: false,
            lines: immutable.List(),
            mode: "pencil",
            socketConnection: null,
            boardname: this.props.location.state.boardName,
            clientIP: "8.8.8.8"
        };

        this.getdrawArea = React.createRef();
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.changeMode = this.changeMode.bind(this);
        this.deletePath = this.deletePath.bind(this);
        this.sendPathToServer = this.sendPathToServer.bind(this);

        /*Get current client's IP*/
        fetch('api/Board/getClientIp')
            .then(response => response.json())
            .then(data => {
                if (data != null)
                    this.setState({
                        clientIP: data
                    });
            });
    }

    /* Open a server-to-client communication socket */
    componentDidMount() {
        document.addEventListener("mouseup", this.handleMouseUp); /*Adds a listener to the event that the user releases a mouse button over an element*/
        const socketConnection = new signalR.HubConnectionBuilder().withUrl("/draw").configureLogging(signalR.LogLevel.Information).build();
        this.setState({ socketConnection }, () => {
            this.state.socketConnection.start().then(() => console.log('connection started')).catch(err => console.log('error while establishing connection'));
            this.state.socketConnection.on('sendToAll', (boardname, path) => {
                if (boardname === this.state.boardname) {
                    var newLines = this.pushPath(this.state.lines, path);
                    this.setState({ lines: newLines });
                }
            });
            this.state.socketConnection.on('removePath', (boardname, pathId) => {
                if (boardname === this.state.boardname) {
                    let pathToDelete = document.getElementById(pathId); /*Delete using a unique path identifier */
                    if (pathToDelete)
                        pathToDelete.remove();
                }
            });
        });
    }

    /* Unmounts and destroys DrawArea component */
    componentWillUnmount() {
        /*Removes the listener to the event that the user releases a mouse button over an element*/
        document.removeEventListener("mouseup", this.handleMouseUp);
    }

    /* Actions done right before DrawArea is on */
    componentWillMount() {
        this.getDataFromServer();
    }

    /*Handling in case the user releases the click on an element*/
    handleMouseUp() { 
        if (this.state.mode === "pencil") {
            if (this.state.lines.last() !== undefined) {
                this.sendPathToServer(this.state.lines.last().points, this.state.boardname, this.state.clientIP);
                this.setState({ isDrawing: false });
            }
        }
    }

    /*Pulling all the elements that were drawn on the board in the past from the server */
    getDataFromServer() {
        fetch('api/Board/getPath', {
            method: 'POST',
            body: JSON.stringify({
                boardname: this.state.boardname /*Send the current board name*/
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response =>
            response.json()).then(data => {
                if (data != null)
                    this.createLinesFromDB(data);
            })
    }

    /**
     * Create elements based on a collection of points received from the server
     * @param {any} data
     */
    createLinesFromDB(data) {
        let DBlines = immutable.List();
        data.forEach((path) => {
            DBlines = this.pushPath(DBlines, path)
            this.setState({
                lines: DBlines
            })
        })
    }

    /**
     * Create point and path objects based on information from the server
     * @param {any} somelines
     * @param {any} path
     */
    pushPath(somelines, path) {
        let pathPoints = path.pathPoints;
        let pathDetails = { id: path.id, ip: path.ip };
        if (pathPoints[0] != null) {
            let point = this.createPoint(pathPoints[0]);
            somelines = somelines.push({
                points: immutable.List([point]),
                details: pathDetails
            });
            let newObj = somelines.getIn([somelines.size - 1]);
            for (var i = 1; i < pathPoints.length - 2; i++) {
                point = this.createPoint(pathPoints[i]);
                newObj.points = newObj.points.push(point);
            }
        }
        return somelines;
    }

    /**
     * Create point object using functional programming
     * @param {any} point
     */
    createPoint(point) {
        if (point !== undefined) {
            return new immutable.Map({ 
                x: point.x,
                y: point.y,
            });
        };
    }

    /**
     *Adds the element to a database by sending the information to the server
     * @param {any} path
     * @param {any} boardName
     * @param {any} ip
     */
    sendPathToServer(path, boardName, ip) {
        fetch('api/Board/addPath', {
            method: 'POST',
            body: JSON.stringify({
                path: path,
                boardname: boardName,
                clientIP: ip
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response =>
            response.json()).then(pathId => {
                if (pathId != null) {
                    this.setState(prevState => {
                        return {
                            lines: prevState.lines.updateIn([prevState.lines.size - 1],
                                line => line = { points: line.points, details: { id: pathId, ip: this.state.clientIP } }),
                        };
                    });
                    /*Update the element for all users in the current draw board*/
                    this.sendPathToClients(this.state.lines.getIn([this.state.lines.size - 1]));
                }
            });
    }

    /*Counts the amount of elements created by current user on the current board based on the IP address of each path element*/
    countUserElements() {
        let list = document.getElementsByTagName('path');
        let ids = [];
        let countElem = 0;
        for (let item of list) {
            let _prop = item.outerHTML;
            let _ip = _prop.substring(_prop.lastIndexOf("ip=") + 1, _prop.lastIndexOf("id="));
            _ip = _ip.replace(/\D/g, '');
            if (!ids.includes(item.id) && item.id !== null && item.id !== "" && this.state.clientIP.toString() === _ip) {
                ids.push(item.id);
                countElem++;
            }
        }
        return countElem;
    }

    /**
     * Deletes the current element from the database by sending the current path ID to the server, and updating all the users
     * about the deletion of current element
     * @param {any} e
     */
    deletePath(e) {// e is the path element
        let ip = e.currentTarget.getAttribute("ip").replace(/\s/g, '');
        if (ip === this.state.clientIP.toString()) {
            e.currentTarget.remove();
            fetch('api/Board/deletePath', {
                method: 'POST',
                body: JSON.stringify(e.currentTarget.getAttribute("id")),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            /*Update the deletion of the element for all users in the current draw board*/
            this.deletePathFromClients(e.currentTarget.getAttribute("id"))
        }
    }

    /**
     * Update all users for adding a new element to the draw board
     * @param {any} path
     */
    sendPathToClients(path) {
        this.state.socketConnection.invoke('sendToAll', this.state.boardname, path).catch(err => {
            console.error(err);
        });
    }

    /**
     * Update all users for deleting an element from the draw board
     * @param {any} pathId
     */
    deletePathFromClients(pathId) {
        this.state.socketConnection.invoke('removePath', this.state.boardname, pathId).catch(err => {
            console.error(err);
        });
    }

    /**
     * Handling a situation when the user moving the mouse pointer over an element
     * @param {any} mouseEvent
     */
    handleMouseMove(mouseEvent) {
        let uElements = this.countUserElements();
        if (!this.state.isDrawing || this.state.mode === "eraser" || uElements > 4) {
            return;
        }
        const point = this.relativeCoordinatesForEvent(mouseEvent);

        this.setState(prevState => {
            return {
                lines: prevState.lines.updateIn([prevState.lines.size - 1],
                    line => line = { points: line.points.push(point), details: line.details })
            };
        });
    }

    /**
     * Handling event that occurs when a user presses a mouse button over an element
     * @param {any} mouseEvent
     */
    handleMouseDown(mouseEvent) {
        let uElements = this.countUserElements();
        if (mouseEvent.button !== 0 || this.state.mode === "eraser" || uElements > 4) {
            return;
        }
        const point = this.relativeCoordinatesForEvent(mouseEvent);

        this.setState(prevState => {
            return {
                lines: prevState.lines.push({
                    details: {
                        id: "",
                        ip: this.state.clientIP
                    },
                    points: immutable.List([point])
                }),
                isDrawing: true,
                mode: prevState.mode
            };
        });
    }

    /**
     * Find mouse position relative to element
     * @param {any} mouseEvent
     */
    relativeCoordinatesForEvent(mouseEvent) {
        const boundingRect = this.getdrawArea.current.getBoundingClientRect();
        return new immutable.Map({
            x: mouseEvent.clientX - boundingRect.left,
            y: mouseEvent.clientY - boundingRect.top,
        });
    }

    /*Change the current state between pencil and eraser*/
    changeMode(newMode) {
        this.setState({ mode: newMode });
    }

    render() {
        return (
            <div className="center">
                <h1>Welcome!</h1>
                <h2>Board Name is : <strong>{this.state.boardname}</strong>.</h2>
                <br />
                <h5 className="red-color"><strong>You can draw up to 5 different elements on each drawing board!</strong></h5>
                <div>
                    <ul className="optionsList">
                        <img className="icon-img" src={pencilImg} alt="Pencil" width="30px" height="30px"
                            onClick={() => { this.changeMode("pencil") }} />
                        <br />
                        <br />
                        <img className="icon-img" src={eraserImg} alt="Eraser" width="50px" height="50px"
                            onClick={() => { this.changeMode("eraser") }} />
                    </ul>
                    <div ref={this.getdrawArea} className={"drawArea " + (this.state.mode === "pencil" ? "drawAreaCross" : "drawAreaDelete")}
                        onMouseDown={this.handleMouseDown}
                        onMouseMove={this.handleMouseMove}>
                        <Drawing
                            lines={this.state.lines}
                            deletePath={this.deletePath}
                            mode={this.state.mode}>
                        </Drawing>
                    </div>
                </div>
            </div>
        )
    }
}