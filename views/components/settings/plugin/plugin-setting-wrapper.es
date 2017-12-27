import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { FormControl, Button } from 'react-bootstrap'

const {i18n } = window

const __ = window.i18n.others.__.bind(i18n.others)

export default class PluginSettingWrapper extends Component {
  static propTypes = {
    plugin: PropTypes.object,
  }

  state = {
    hasError: false,
    error: null,
    info: null,
  }

  componentDidCatch = (error, info) => {
    this.setState({
      hasError: true,
      error,
      info,
    })
  }

  shouldComponentUpdate = (nextProps, nextState) =>
    this.props.plugin.timestamp !== nextProps.plugin.timestamp ||
    nextState.hasError === true

  render() {
    const { hasError, error, info } = this.state
    const {plugin} = this.props
    if (hasError) {
      const code = [error.stack, info.componentStack].join('\n')
      return (
        <div>
          <h1>{__('A 🐢 found in %s', plugin.name)}</h1>
          <p>{__('Something went wrong in the plugin, you may report this to plugin author or poi dev team, with the code below.')}</p>
          <FormControl
            componentClass="textarea"
            readOnly
            value={code}
            style={{ height: '10em' }}
          />
          <Button bsStyle="primary" onClick={this.handleCopy}>{__('Copy to clipboard')}</Button>
        </div>
      )
    }
    return <plugin.settingsClass />
  }
}
