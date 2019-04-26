import React, { Component } from 'react';
import Drawing from './Drawing.js';
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
        /*
        let chosenBoardName = this.props.location.state.boardName
        this.setState({
            boardname: chosenBoardName
        });
        */
        const socketConnection = new signalR.HubConnectionBuilder().withUrl("/draw").configureLogging(signalR.LogLevel.Information).build();
        this.setState({ socketConnection }, () => {
            this.state.socketConnection.start().then(() => console.log('connection started')).catch(err => console.log('error while establishing connection'));
            this.state.socketConnection.on('sendToAll', (boardname, path) => {
                if (boardname === this.state.boardname) {
                    var newLines = this.pushPath(this.state.lines, path);
                    this.setState({
                        lines: newLines
                    });
                }
            })
        });

    }
    componentWillUnmount() {
        document.removeEventListener("mouseup", this.handleMouseUp);
    }

    componentWillMount() {
        this.getDataFromServer();
    }


    handleMouseUp() {
        if (this.state.mode == "pencil") {
            this.setState({
                isDrawing: false
            });
            this.sendPathToServer(this.state.lines.last(), this.state.boardname, this.state.clientIP);
        }
    }

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
        var DBlines = immutable.List();
        data.forEach((path) => {
            DBlines = this.pushPath(DBlines, path)
            this.setState({
                lines: DBlines
            })
        })
    }

    pushPath(somelines, path) {
        var pathPoints = path.pathPoints;
        var point = this.createPoint(pathPoints[0]);
        somelines = somelines.push(immutable.List([point]))
        for (var i = 1; i < pathPoints.length; i++) {
            var point = this.createPoint(pathPoints[i]);
            somelines = somelines.updateIn([somelines.size - 1], line => line.push(point));
        }
        return somelines;
    }

    createPoint(point) {
        return new immutable.Map({
            x: point.x,
            y: point.y,
        });
    }

    sendPathToServer(path, boardName, ip) {
        fetch('api/Board/addPath', {
            method: 'POST',
            body: JSON.stringify({
                path: path,
                boardname: boardName,
                clientIP: ip
            }), // body: JSON.stringify(path), 
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(() => {
            this.sendPathToClients(path);
        });
    }

    deletePath(e) {// e is the path element
        /*check if user implement here
        var user = e.getAttribute("user");
        if(user == session[user])
        add fetch to server delete function
        .then(() => {
            e.currentTarget.remove();
        });
        */
        e.currentTarget.remove();

    }

    sendPathToClients(path) {
        this.state.socketConnection.invoke('sendToAll', this.state.boardname, path).catch(err => {
            console.error(err);
        });
    }

    handleMouseMove(mouseEvent) {
        if (!this.state.isDrawing || this.state.mode == "eraser") {
            return;
        }

        const point = this.relativeCoordinatesForEvent(mouseEvent);

        this.setState(prevState => {
            return {
                lines: prevState.lines.updateIn([prevState.lines.size - 1], line => line.push(point)),
            };
        });
    }

    handleMouseDown(mouseEvent) {
        if (mouseEvent.button != 0 || this.state.mode == "eraser") {
            return;
        }

        const point = this.relativeCoordinatesForEvent(mouseEvent);

        this.setState(prevState => {
            return {
                lines: prevState.lines.push(immutable.List([point])),
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
                <div>
                    <ul className="optionsList">
                        <li className="fas fa-pencil-alt"
                            onClick={() => { this.changeMode("pencil") }} >
                        </li>
                        <br />
                        <li className="fas fa-eraser"
                            onClick={() => { this.changeMode("eraser") }}>
                        </li>
                    </ul>
                    <div ref={this.getdrawArea} className={"drawArea " + (this.state.mode == "pencil" ? "drawAreaCross" : "drawAreaDelete")}
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