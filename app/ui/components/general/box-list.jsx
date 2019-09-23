/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.general.box-list
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * @author Leah De Laurell <leah.p.delaurell@lmco.com>
 *
 * TODO: Put a better description
 * @description This renders a box with a list inside.
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React, { Component } from 'react';

// MBEE Modules
import { Tooltip } from 'reactstrap';
import { Link } from 'react-router-dom';

/* eslint-enable no-unused-vars */

// Define function
class BoxList extends Component {

  constructor(props) {
    // Initialize parent props
    super(props);

    // Initialize state props
    this.state = {
      isTooltipOpen: false
    };

    this.handleTooltipToggle = this.handleTooltipToggle.bind(this);
  }

  // Toggles the tooltip
  handleTooltipToggle() {
    const isTooltipOpen = this.state.isTooltipOpen;

    // Verify component is not unmounted
    if (!this.mounted) {
      return;
    }

    return this.setState({ isTooltipOpen: !isTooltipOpen });
  }

  componentWillUnmount() {
    // Set mounted variable
    this.mounted = false;
  }

  render() {
    const headerBtns = [];
    const footerBtns = [];

    if (this.props.btns) {
      const btnsObj = this.props.btns;
      Object.keys(btnsObj).forEach((key) => {
        headerBtns.push(
          <React.Fragment>
            <i id={`btn-${key}`}
               className={`${btnsObj[key].icon} ${btnsObj[key].className}`}
               onClick={btnsObj[key].onClick}/>
            <Tooltip
              placement='bottom'
              key={`tooltip-${key}`}
              isOpen={this.state.isTooltipOpen}
              target={`btn-${key}`}
              toggle={this.handleTooltipToggle}>
              {key}
            </Tooltip>
          </React.Fragment>
        );
      });
    }

    if (this.props.footer.btn) {
      const footer = this.props.footer.btn;

      Object.keys(footer).forEach((key) => {
        // Initialize variables
        const btnFor = footer[key].for;
        const varClick = footer[key].varForClick;
        const changingPage = footer[key].pages[btnFor];
        let otherPage;
        let otherPageNum;

        // Grab other page number
        if (btnFor === 'branch') {
          otherPage = 'tag';
          otherPageNum = footer[key].pages[otherPage];
        }
        else {
          otherPage = 'branch';
          otherPageNum = footer[key].pages[otherPage];
        }

        // Verify if next or back a page
        if ((key === 'back') && (Number(changingPage) !== 1)) {
          // Initialize search link
          const link = `?${btnFor}=${Number(changingPage) - 1}&${otherPage}=${otherPageNum}`;
          // Push a new btn to array
          footerBtns.push(
              <Link to={{ search: link }}
                    className='footer-btn'
                    key={`footer-${key}`}
                    onClick={() => footer[key].onClick(varClick)}>
                <i id={`for-${btnFor}`}
                   className={footer[key].icon}/>
                <span className='btn-label'>
                  {key}
                </span>
              </Link>
          );
        }
        else if (key === 'next') {
          // Initialize search link
          const link = `?${btnFor}=${Number(changingPage) + 1}&${otherPage}=${otherPageNum}`;
          // Push a new btn to array
          footerBtns.push(
            <Link to={{ search: link }}
                  className='footer-btn'
                  onClick={() => footer[key].onClick(varClick)}
                  key={`footer-${key}`}>
              <span className='btn-label'>
                {key}
              </span>
              <i id={`for-${btnFor}`}
                 className={footer[key].icon}/>
            </Link>
          );
        }
      });

      if ((Object.keys(footer).length === 1) && (footerBtns.length === 1)) {
        footerBtns.push(<i key='filler'/>);
      }
    }

    return (
      <div className='box-list'>
        <div className='box-list-header'>
          <h3 className='bolder-name'>
            {this.props.header}
          </h3>
          <div className='box-list-btns'>
          {(headerBtns.length > 0)
            ? headerBtns
            : ''
          }
          </div>
        </div>
        <div>
          {this.props.children}
        </div>
        <div className='box-list-footer'>
          {(footerBtns.length !== 1)
            ? footerBtns
            : (<React.Fragment>
                <i/>
                {footerBtns}
               </React.Fragment>)
          }
        </div>
      </div>
    );
  }

}

// Export function
export default BoxList;
