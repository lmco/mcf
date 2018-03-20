/*****************************************************************************
 * Classification: UNCLASSIFIED                                              *
 *                                                                           *
 * Copyright (C) 2018, Lockheed Martin Corporation                           *
 *                                                                           *
 * LMPI WARNING: This file is Lockheed Martin Proprietary Information.       *
 * It is not approved for public release or redistribution.                  *
 *                                                                           *
 * EXPORT CONTROL WARNING: This software may be subject to applicable export *
 * control laws. Contact legal and export compliance prior to distribution.  *
 *****************************************************************************/

/**
 * App.jsx
 *
 * Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * This defines the MBEE application.
 */
class App extends React.Component {
    render() {
        return (
            <div class="container-fluid">
            <h1><Welcome name={this.props.name} /></h1>
            <OrgList/>
            </div>
        );
    }
}