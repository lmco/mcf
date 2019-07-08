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
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap';
import ElementTree from './element-tree.jsx';

/* eslint-enable no-unused-vars */

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
      error: null
    };

    if (props.currentSelection) {
      this.state.selectedElementPreview = props.currentSelection;
    }

    this.toggle = this.toggle.bind(this);
    this.selectElementHandler = this.selectElementHandler.bind(this);
    this.select = this.select.bind(this);
    this.clear = this.clear.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentSelection !== this.props.currentSelection) {
      this.setState({ selectedElementPreview: this.props.currentSelection });
    }
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

  clear() {
    this.setState({
      selectedElementPreview: null
    });
  }

  render() {
    let error = '';
    if (this.state.error) {
      error = <span className={'text-danger'}>{this.state.error}</span>;
    }

    return (
      <div className={'element-selector'}>
        <i className={'fas fa-caret-square-down'} onClick={this.toggle}/>
        <Modal size="lg"
               isOpen={this.state.modal}
               toggle={this.toggle}
               className='element-selector-modal element-tree-container'>
          <ModalHeader toggle={this.toggle}>Select an element</ModalHeader>
          <ModalBody>
            <ElementTree project={this.props.project}
                         displayIds={true}
                         linkElements={false}
                         branch={this.props.branch}
                         clickHandler={this.selectElementHandler}/>
          </ModalBody>
          <ModalFooter>
            <p>
              Selected: {this.state.selectedElementPreview}
              {(this.state.selectedElementPreview)
                ? <i className='fas fa-times-circle clear-btn' onClick={this.clear}/>
                : 'null'
              }
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
