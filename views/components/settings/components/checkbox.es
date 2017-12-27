import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import {  Checkbox } from 'react-bootstrap'
import { get } from 'lodash'

const { config } = window

const CheckboxLabelConfig = connect(() => {
  return (state, props) => ({
    value: get(state.config, props.configName, props.defaultVal),
    configName: props.configName,
    undecided: props.undecided,
    label: props.label,
  })
})(class checkboxLabelConfig extends Component {
  static propTypes = {
    label: PropTypes.string,
    configName: PropTypes.string,
    value: PropTypes.bool,
    undecided: PropTypes.bool,
  }
  handleChange = () => {
    config.set(this.props.configName, !this.props.value)
  }
  render () {
    return (
      <div className={this.props.undecided ? 'undecided-checkbox-inside' : ''} >
        <Checkbox
          disabled={this.props.undecided}
          checked={this.props.undecided ? false : this.props.value}
          onChange={this.props.undecided ? null : this.handleChange}>
          {this.props.label}
        </Checkbox>
      </div>
    )
  }
})

export default CheckboxLabelConfig
