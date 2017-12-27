import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import fs from 'fs-extra'
import { get } from 'lodash'
import { remote } from 'electron'

import { isSubdirectory } from 'views/utils/tools'

const { dialog } = remote.require('electron')
const { config, i18n } = window

const __ = i18n.setting.__.bind(i18n.setting)

const FolderPickerConfig = connect(() => {
  return (state, props) => ({
    value: get(state.config, props.configName, props.defaultVal),
    configName: props.configName,
    label: props.label,
  })
})(class extends Component {
  static propTypes = {
    label: PropTypes.string,
    configName: PropTypes.string,
    value: PropTypes.string,
    isFolder: PropTypes.bool,
    placeholder: PropTypes.string,
    exclude: PropTypes.arrayOf(PropTypes.string),
    defaultVal: PropTypes.string,
  }
  static defaultProps = {
    isFolder: true,
    exclude: [],
  }
  componentDidMount = () => {
    const { exclude, value, defaultVal, configName } = this.props
    if (exclude.length && exclude.some(parent => isSubdirectory(parent, value))) {
      this.emitErrorMessage()
      config.set(configName, defaultVal)
    }
  }
  handleOnDrag = (e) => {
    e.preventDefault()
  }
  synchronize = (callback) => {
    if (this.lock) {
      return
    }
    this.lock = true
    callback()
    this.lock = false
  }
  emitErrorMessage = () => window.toast(__('Selected directory for %s is not valid.', this.props.label), {
    type: 'warning',
    title: __('Error'),
  })
  setPath = (val) => {
    const { exclude } = this.props
    if (exclude.length && exclude.some(parent => isSubdirectory(parent, val))) {
      this.emitErrorMessage()
      return
    }
    config.set(this.props.configName, val)
  }
  handleOnDrop = (e) => {
    e.preventDefault()
    const droppedFiles = e.dataTransfer.files
    if (fs.statSync(droppedFiles[0].path).isDirectory() || !this.props.isFolder) {
      this.setPath(droppedFiles[0].path)
    }
  }
  handleOnClick = () => {
    this.synchronize(() => {
      let defaultPath
      try {
        if (this.props.isFolder) {
          fs.ensureDirSync(this.props.value)
          defaultPath = this.props.value
        }
      } catch (e) {
        defaultPath = remote.app.getPath('desktop')
      }
      const filenames = dialog.showOpenDialog({
        title: this.props.label,
        defaultPath,
        properties: this.props.isFolder ? [
          'openDirectory',
          'createDirectory',
        ] : [
          'openFile',
        ],
      })
      if (filenames !== undefined) {
        this.setPath(filenames[0])
      }
    })
  }
  render() {
    return (
      <div className="folder-picker"
        onClick={this.handleOnClick}
        onDrop={this.handleOnDrop}
        onDragEnter={this.handleOnDrag}
        onDragOver={this.handleOnDrag}
        onDragLeave={this.handleOnDrag}
      >
        {this.props.value || this.props.placeholder}
      </div>
    )
  }
})

export default FolderPickerConfig
