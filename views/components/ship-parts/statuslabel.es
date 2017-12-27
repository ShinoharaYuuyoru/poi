import React from 'react'
import FontAwesome from 'react-fontawesome'
import { OverlayTrigger, Tooltip, Label } from 'react-bootstrap'
import { connect } from 'react-redux'
import { isEqual, get } from 'lodash'

const {i18n} = window
const __ = i18n.main.__.bind(i18n.main)

const texts = [
  ['Retreated'],
  ['Repairing'],
  ['Resupply needed'],
]
const styles = [
  'warning',
  'info',
  'warning',
]
const icons = [
  'reply',
  'wrench',
  'database',
]

const initState = {
  color: [],
  mapname: [],
}

const StatusLabel = connect(state => ({
  shipTag: state.fcd.shiptag || initState,
}))(class statusLabel extends React.Component {
  shouldComponentUpdate = (nextProps, nextState) => (
    nextProps.label !== this.props.label || !isEqual(this.props.shipTag, nextProps.shipTag)
  )
  render() {
    const i = this.props.label
    const {color, mapname, fleetname} = this.props.shipTag
    const { language } = window
    if (i != null && 0 <= i) {
      return (
        <OverlayTrigger placement="top" overlay={
          <Tooltip id={`statuslabel-status-${i}`}>
            {
              i > 2
                ? `${get(fleetname, [language, i - 3], __('Ship tag'))} - ${mapname[i - 3] || i - 2}`
                : __(texts[i])
            }
          </Tooltip>
        }>
          <Label
            bsStyle={styles[i] || 'default'}
            style={i > 2 ? {color: color[i - 3] || '' } : {} }
          >
            <FontAwesome key={0} name={icons[i] || 'tag'} />
          </Label>
        </OverlayTrigger>
      )
    } else {
      return <Label bsStyle="default" style={{opacity: 0}}></Label>
    }
  }
})

export default StatusLabel
