/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.projects
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the user role edit page.
 */

// React Modules
import React, { Component } from 'react';

import { Input } from 'reactstrap';

class CustomMenu extends Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);

        this.state = { value: '' };
    }

    handleChange(e) {
        this.setState({ value: e.target.value.toLowerCase().trim() });
    }

    render() {
        const {
            children,
            style,
            className,
            'aria-labelledby': labeledBy,
        } = this.props;

        let { value } = this.state;

        if (this.props.username) {
            value = this.props.username;
        }

        return (
            <div style={style} className={className} aria-labelledby={labeledBy}>
                <Input autoFocus
                       className="mx-3 my-2 w-auto"
                       placeholder="Type to filter..."
                       onChange={this.props.updateUsername}
                       value={value}/>
                <ul className="list-unstyled" onClick={this.props.updateUsername}>
                    {React.Children.toArray(children).filter(
                        child =>
                            !value || child.props.children.toLowerCase().startsWith(value) || child.props.value.startsWith(value)
                    )}
                </ul>
            </div>
        );
    }
}

// Export component
export default CustomMenu
