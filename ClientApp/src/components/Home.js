import React, { Component } from 'react';
import { DrawArea } from './DrawArea';
import { Redirect } from 'react-router-dom';
import logoImg from '../Resources/homeLogo.png';

/**
 * Home component used to display the home page
 */
export class Home extends Component {

    displayName = Home.name

    /*Home component constructor */
    constructor() {
        super();
        this.state = {
            redirect: false,
            title: ''
        };
    }

    /**
     * Update the name of the board selected by the user
     * @param {any} event
     */
    handleChange(event) {
        this.setState({ title: event.target.value });
    }

    /*Enables the web path replacement for the new draw baord*/
    setRedirect = () => {
        this.setState({
            redirect: true
        })
    }

    /*Update the name of the current draw baord in the newly defined web path*/
    renderRedirect = () => {
        if (this.state.redirect) {
            return <Redirect
                to={{
                    pathname: `/drawArea/${this.state.title}`,
                    state: { boardName: `${this.state.title}` }
                }}
                component={DrawArea} />
        }
    }

    render() {
        return (
            <div className="center">
                <h1>Online Draw Board</h1>
                <br />
                <p>Welcome to my new <strong>Online Draw Board</strong> application.</p>
                <ul>
                    <br />
                    <li><code>ASP.NET Core</code> and <code>C#</code> for server-side code</li>
                    <br />
                    <li><code>React</code> for client-side code</li>
                    <br />
                    <li><code>Microsoft SQL Server</code> for database management</li>
                </ul>
                <br />
                <img src={logoImg} alt="Online Draw Board Logo" width="350" height="180" />
                <br />
                <br />
                <div>
                    <input className="board-input left-space" type="text" name="title" required={true} placeholder="Choose Board Name" value={this.state.title}
                        onChange={this.handleChange.bind(this)} />
                    {this.renderRedirect()}
                    <button className="board-btn left-space" onClick={this.setRedirect}>Start Draw!</button>
                </div>
            </div>
        );
    }
}
