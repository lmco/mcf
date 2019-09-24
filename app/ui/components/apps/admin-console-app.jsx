/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.apps.admin-console-app
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders the admin console page.
 */
// React Modules
import React from 'react';
import ReactDOM from 'react-dom';

import AdminConsoleHome from '../admin-console-views/admin-console-home.jsx';

// Render on main html element
ReactDOM.render(<AdminConsoleHome />, document.getElementById('main'));
