import path from 'path-extra'
import fs from 'fs-extra'
import { shell } from 'electron'
import { Grid, Col, Button, FormControl, Checkbox, Overlay, Tooltip } from 'react-bootstrap'
import { connect } from 'react-redux'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { get } from 'lodash'
import FolderPicker from '../components/folder-picker'
import { fileUrl } from 'views/utils/tools'

const {config, toggleModal, i18n, EXROOT} = window
const {openItem} = shell
const __ = i18n.setting.__.bind(i18n.setting)

const toggleModalWithDelay = (...arg) => setTimeout(() => toggleModal(...arg), 1500)

const ThemeConfig = connect((state, props) => ({
  themes: get(state, 'ui.themes'),
  theme: get(state.config, 'poi.theme', 'paperdark'),
  enableSVGIcon: get(state.config, 'poi.useSVGIcon', false),
  enableTransition: get(state.config, 'poi.transition.enable', true),
  useGridMenu: get(state.config, 'poi.tabarea.grid', navigator.maxTouchPoints !== 0),
  vibrant: get(state.config, 'poi.vibrant', 0), // 0: disable, 1: macOS vibrant, 2: custom background
  background: get(state.config, 'poi.background'),
})
)(class ThemeConfig extends Component {
  static propTypes = {
    themes: PropTypes.arrayOf(PropTypes.string),
    theme: PropTypes.string,
    enableSVGIcon: PropTypes.bool,
    enableTransition: PropTypes.bool,
    useGridMenu: PropTypes.bool,
    vibrant: PropTypes.number,
    background: PropTypes.string,
  }
  state = {
    show: false,
  }
  handleSetTheme = (e) => {
    const theme = e.target.value
    if (this.props.theme !== theme) {
      return window.applyTheme(theme)
    }
  }
  handleOpenCustomCss = (e) => {
    try {
      const d = path.join(EXROOT, 'hack', 'custom.css')
      fs.ensureFileSync(d)
      return openItem(d)
    } catch (e) {
      return toggleModalWithDelay(__('Edit custom CSS'), __("Failed. Perhaps you don't have permission to it."))
    }
  }
  handleSetSVGIcon = () => {
    config.set('poi.useSVGIcon', !this.props.enableSVGIcon)
  }
  handleSetTransition = () => {
    config.set('poi.transition.enable', !this.props.enableTransition)
  }
  handleSetGridMenu = () => {
    config.set('poi.tabarea.grid', !this.props.useGridMenu)
  }
  handleSetVibrancy = e => {
    config.set('poi.vibrant', parseInt(e.target.value))
  }
  handleMouseEnter = () => {
    this.setState({
      show: true,
    })
  }
  handleMouseLeave = () => {
    this.setState({
      show: false,
    })
  }
  render() {
    return (
      <Grid>
        <Col xs={6}>
          <FormControl componentClass="select" value={this.props.theme} onChange={this.handleSetTheme}>
            {
              this.props.themes.map((theme, index) =>
                <option key={index} value={theme}>
                  {(theme === '__default__') ? 'Default' : (theme[0].toUpperCase() + theme.slice(1))}
                </option>
              )
            }
          </FormControl>
        </Col>
        <Col xs={6}>
          <FormControl componentClass="select" value={this.props.vibrant} onChange={this.handleSetVibrancy}>
            <option key={0} value={0}>{__('Default')}</option>
            { ['darwin', 'win32'].includes(process.platform) && <option key={1} value={1}>{__("Vibrance")}</option> }
            <option key={2} value={2}>{__("Custom background")}</option>
          </FormControl>
        </Col>
        <Col xs={6} style={{ marginTop: '1ex' }}>
          <Button bsStyle='primary' onClick={this.handleOpenCustomCss} block>{__('Edit custom CSS')}</Button>
        </Col>
        <Col xs={6} style={{ marginTop: '1ex' }}>

          <Overlay
            show={this.props.background && this.state.show }
            placement="bottom"
            target={this.fileSelect}
          >
            <Tooltip id='background-preview'>
              <div>
                <img src={encodeURI(fileUrl(this.props.background))} alt="" style={{ maxHeight: '100%', maxWidth: '100%'}}/>
              </div>
            </Tooltip>
          </Overlay>
          <div
            ref={(ref) => this.fileSelect = ref}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
          >
            {
              this.props.vibrant === 2 &&
              <FolderPicker
                label={__('Custom background')}
                configName="poi.background"
                defaultVal={''}
                isFolder={false}
                placeholder={__('No background image selected')}
              />
            }
          </div>
        </Col>
        <Col xs={12}>
          <Checkbox checked={this.props.enableSVGIcon} onChange={this.handleSetSVGIcon}>
            {__('Use SVG Icon')}
          </Checkbox>
        </Col>
        <Col xs={12}>
          <Checkbox checked={this.props.enableTransition} onChange={this.handleSetTransition}>
            {__('Enable Smooth Transition')}
          </Checkbox>
        </Col>
        <Col xs={12}>
          <Checkbox checked={this.props.useGridMenu} onChange={this.handleSetGridMenu}>
            {__('Use Gridded Plugin Menu')}
          </Checkbox>
        </Col>
      </Grid>
    )
  }
})

export default ThemeConfig
