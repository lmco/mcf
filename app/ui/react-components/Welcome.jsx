/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.Welcome
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI
 *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.
 * It is not approved for public release or redistribution.
 *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export
 * control laws. Contact legal and export compliance prior to distribution.
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description This Welcome class is a "Hello, World"-style react component.
 * It is intended to be used as a placeholder or for testing.
 */
class Welcome extends React.Component {
    render() {
        return (<span>Hello, {this.props.name}</span>);
    }
}
