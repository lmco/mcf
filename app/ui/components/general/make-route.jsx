/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.react-components.general-components
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @description This renders a project.
 */

// React Modules
import React from 'react';
import { Route } from 'react-router-dom';

function MakeRoute(route) {
  if (route.props){
    const propsNames = Object.keys(route.props);

    const propValues = routes.props.map(p => p);
  }

  return (
        <Route
            path={route.path}
            render={props => (
                <route.component {...props} />
            )}
        />
  );
}

// Export component
export default MakeRoute
