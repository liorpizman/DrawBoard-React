import React, { Component } from 'react';
import Drawing from './Drawing.js';
import pencilImg from '../Resources/pencil.png';
import eraserImg from '../Resources/eraser.png';
const immutable = require("immutable");
const signalR = require('@aspnet/signalr');
require('./drawingApp.css');


export class DrawArea extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isDrawing: false,
            lines: immutable.List(),
            mode: "pencil",
            socketConnection: null,
            boardname: this.props.location.state.boardName,
            numElem: 0,
            clientIP: "8.8.8.8"
        };
        this.getdrawArea = React.createRef();
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.changeMode = this.changeMode.bind(this);
        this.deletePath = this.deletePath.bind(this);
        this.sendPathToServer = this.sendPathToServer.bind(this);

        fetch('api/Board/getClientIp')
            .then(response => response.json())
            .then(data => {
                if (data != null)
                    this.setState({
                        clientIP: data
                    });
            });
    }

    componentDidMount() {
        document.addEventListener("mouseup", this.handleMouseUp);
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
                    let pathToDelete = document.getElementById(pathId);
                    if (pathToDelete)
                        pathToDelete.remove();
                }
            });
        });
    }

    componentWillUnmount() {
        document.removeEventListener("mouseup", this.handleMouseUp);
    }

    componentWillMount() {
        this.getDataFromServer();
    }


    handleMouseUp() { //mouseEvent
        if (this.state.mode === "pencil"/* && !mouseEvent.target.outerHTML.includes("<li")*/) {//tfira al makash delete
            if (this.state.lines.last() !== undefined) {
                this.sendPathToServer(this.state.lines.last().points, this.state.boardname, this.state.clientIP);
                this.setState({ isDrawing: false });
            }
        }
    }
    /*
    getDataFromServer() {
        fetch('api/Board/getPath').then(response =>
            response.json()).then(data => {
                if (data != null)
                    this.createLinesFromDB(data);
            })
    }
    */

    getDataFromServer() {
        fetch('api/Board/getPath', {
            method: 'POST',
            body: JSON.stringify({
                boardname: this.state.boardname
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


    getClientIP() {
        fetch('api/Board/getClientIp').then(response =>
            response.json()).then(data => {
                if (data != null)
                    this.setState({
                        clientIP: data
                    });
            })
    }


    createLinesFromDB(data) {
        let DBlines = immutable.List();
        data.forEach((path) => {
            DBlines = this.pushPath(DBlines, path)
            this.setState({
                lines: DBlines
            })
        })
    }

    pushPath(somelines, path) {
        let pathPoints = path.pathPoints;
        let pathDetails = { id: path.id, ip: path.ip };
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
        return somelines;
    }

    createPoint(point) {
        if (point !== undefined) {
            return new immutable.Map({ // functional programming
                x: point.x,
                y: point.y,
            });
        };
    }

    sendPathToServer(path, boardName, ip) {
        /*
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
        }).then(() => {
            this.sendPathToClients(path);
            });
            */
        let list = document.getElementsByTagName('path');
        let countElem = 0;
        for (let item of list) {
            let _prop = item.outerHTML;
            let _ip = _prop.substring(
                _prop.lastIndexOf("ip=") + 1,
                _prop.lastIndexOf("id=")
            );
            _ip = _ip.replace(/\D/g, '');
            if (this.state.clientIP.toString() === _ip) {
                countElem++;
            }
        }
        this.setState({ numElem: countElem });
        if (this.state.numElem > 4) {
            return;
        }
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
                            lines: prevState.lines.updateIn([prevState.lines.size - 1], line => line = { points: line.points, details: { id: pathId, ip: this.state.clientIP } }),
                        };
                    });

                    this.sendPathToClients(this.state.lines.getIn([this.state.lines.size - 1]));
                }
            });
        let countUp = this.state.numElem + 1;
        this.setState({ numElem: countUp });
    }

    deletePath(e) {// e is the path element
        //switch the default ip with state ip
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
            this.deletePathFromClients(e.currentTarget.getAttribute("id"))
            let countDown = this.state.numElem - 1;
            this.setState({ numElem: countDown });
        }
    }

    /*
    deletePathFromServer(point) {
        fetch('api/Board/deletePath', {
            method: 'POST',
            body: JSON.stringify({
                delPoint: point
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(() => {
            console.log("in delete server");
        });
    }
    */

    sendPathToClients(path) {
        this.state.socketConnection.invoke('sendToAll', this.state.boardname, path).catch(err => {
            console.error(err);
        });
    }

    deletePathFromClients(pathId) {
        this.state.socketConnection.invoke('removePath', this.state.boardname, pathId).catch(err => {
            console.error(err);
        });
    }

    handleMouseMove(mouseEvent) {
        if (!this.state.isDrawing || this.state.mode === "eraser" || this.state.numElem > 4) {
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

    handleMouseDown(mouseEvent) {
        if (mouseEvent.button !== 0 || this.state.mode === "eraser" || this.state.numElem > 4) {
            return;
        }

        const point = this.relativeCoordinatesForEvent(mouseEvent);

        this.setState(prevState => {
            return {
                lines: prevState.lines.push({
                    details: {
                        id: "",                                                               /////////////////////////// check it
                        ip: this.state.clientIP//""
                    },
                    points: immutable.List([point])
                }),
                isDrawing: true,
                mode: prevState.mode
            };
        });
    }

    relativeCoordinatesForEvent(mouseEvent) {
        const boundingRect = this.getdrawArea.current.getBoundingClientRect();
        return new immutable.Map({
            x: mouseEvent.clientX - boundingRect.left,
            y: mouseEvent.clientY - boundingRect.top,
        });
    }

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