import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Col, Grid, Radio } from 'react-bootstrap'
import { get } from 'lodash'

const { config } = window

const RadioConfig = connect(() => {
  return (state, props) => ({
    value: get(state.config, props.configName, props.defaultVal),
    configName: props.configName,
    label: props.label,
    availableVal: props.availableVal,
  })
})(class RadioConfig extends Component {
  static propTypes = {
    label: PropTypes.string,
    configName: PropTypes.string,
    value: PropTypes.string,
    availableVal: PropTypes.array,
  }
  onSelect = (value) => {
    config.set(this.props.configName, value)
  }
  render() {
    return (
      <Grid>
        {
          this.props.availableVal.map((item, index) => {
            return (
              <Col key={index} xs={3}>
                <Radio checked={this.props.value === item.value}
                  onChange={this.onSelect.bind(this, item.value)} >
                  {item.name}
                </Radio>
              </Col>
            )
          })
        }
      </Grid>
    )
  }
})

export default RadioConfig
