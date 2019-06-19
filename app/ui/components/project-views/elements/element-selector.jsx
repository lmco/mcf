/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.components.project-views.elements.element-selector
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 *
 * @owner Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @author Josh Kaplan <joshua.d.kaplan@lmco.com>
 *
 * @description Renders an element selector that has two parts: the selected
 * element and the modal to select an element..
 */

/* Modified ESLint rules for React. */
/* eslint-disable no-unused-vars */

// React Modules
import React from 'react';

// MBEE Modules
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import ElementTree from './element-tree.jsx';


class ElementSelector extends React.Component {

  /**
   *
   * @param props
   * @param props.self (optional)
   */
  constructor(props) {
    super(props);
    this.state = {
      modal: false,
      selectedElement: '',
      selectedElementPreview: '',
      childrenOpen: {},
      error: null
    };

    this.toggle = this.toggle.bind(this);
    this.getRootElement = this.getRootElement.bind(this);
    this.selectElementHandler = this.selectElementHandler.bind(this);
    this.select = this.select.bind(this);
    this.setChildOpen = this.setChildOpen.bind(this);
  }

  componentDidMount() {
    this.getRootElement();
  }

  /**
   * Toggles the state of the modal.
   */
  toggle() {
    this.setState(prevState => ({
      modal: !prevState.modal
    }));
  }

  /**
   * Gets the current model root element. This is used to render the tree.
   *
   * TODO (jk) - the tree currently requires us to do this work whenever we
   * need it. We should consider creating a tree wrapper to handle this.
   */
  getRootElement() {
    const opts = '?fields=id,name,contains,type&minified=true';
    const url = `${this.props.url}/elements/model${opts}`;
    $.ajax({
      method: 'GET',
      url: url,
      statusCode: {
        200: (data) => { this.setState({ treeRoot: data }); },
        401: () => {
          this.setState({ treeRoot: null });

          // Refresh when session expires
          window.location.reload();
        },
        403: (err) => {
          this.setState({ error: err.responseText });
        },
        404: (err) => {
          this.setState({ error: err.responseText });
        }
      }
    });
  }

  /**
   * This is the click handler used to select an element.
   */
  selectElementHandler(id, refreshFunction) {
    // Cannot select self
    if (id === this.props.self) {
      this.setState({
        selectedElementPreview: null,
        selectDisabled: true,
        error: 'Element cannot select self.'
      });
      return;
    }
    // Otherwise, reset error to null and set selected state
    this.setState({
      selectedElementPreview: id,
      error: null,
      selectDisabled: false
    });
  }

  setChildOpen(id, state) {
    this.state.childrenOpen[id] = state;
  }

  /**
   * Confirms and finalizes the element selection. Then closes the modal.
   */
  select() {
    this.setState({ selectedElement: this.state.selectedElementPreview });
    this.toggle();

    // Using preview here because it appears setState is async.
    // When using this.state.selectedElement here is is not yet set when it
    // is passed into the selectedHandler
    this.props.selectedHandler(this.state.selectedElementPreview);
  }

  render() {
    let tree = '';
    if (this.state.treeRoot !== null) {
      tree = <ElementTree id='model'
                          data={this.state.treeRoot}
                          project={this.props.project}
                          parent={null}
                          isOpen={true}
                          childrenOpen={this.state.childrenOpen}
                          setChildOpen={this.setChildOpen}
                          parentRefresh={this.getRootElement}
                          clickHandler={this.selectElementHandler}/>;
    }


    let error = '';
    if (this.state.error) {
      error = <span className={'text-danger'}>{this.state.error}</span>;
    }

    return (
      <div className={'element-selector'}>
        <i className={'fas fa-caret-square-down'} onClick={this.toggle}></i>
        <Modal size="lg"
               isOpen={this.state.modal}
               toggle={this.toggle}
               className='element-selector-modal element-tree-container'>
          <ModalHeader toggle={this.toggle}>Select an element</ModalHeader>
          <ModalBody>
            { tree }
          </ModalBody>
          <ModalFooter>
            <p>
              Selected: {this.state.selectedElementPreview}
              {error}
            </p>
            <Button color="primary"
                    disabled={this.state.selectDisabled}
                    onClick={this.select}>Select</Button>
            <Button color="secondary" onClick={this.toggle}>Cancel</Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }

}

// Export component
export default ElementSelector;
