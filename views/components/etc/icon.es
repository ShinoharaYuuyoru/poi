import fs from 'fs-extra'
import classnames from 'classnames'
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

const getClassName = (props, isSVG) => {
  const type = isSVG ? 'svg' : 'png'
  return classnames(type, props)
}

const {ROOT, config} = window

const svgAvailableList = {}
const pngAvailableList = {}

class iconConf {
  constructor() {
    this.callbacks = new Map()
  }
  setConf = (val) => {
    this.callbacks.forEach((f) => f(val))
  }
  reg = (key, func) => {
    this.callbacks.set(key, func)
  }
  unreg = (key) => {
    this.callbacks.delete(key)
  }
}

const iconConfSetter = new iconConf()

const setIcon = (path, val) => {
  if (path === 'poi.useSVGIcon') {
    iconConfSetter.setConf(val)
  }
}

config.addListener('config.set', setIcon)

window.addEventListener('unload', (e) => {
  config.removeListener('config.set', setIcon)
})

export class SlotitemIcon extends PureComponent {
  static propTypes = {
    slotitemId: PropTypes.number,
    className: PropTypes.string,
    alt: PropTypes.string,
  }
  state = {
    useSVGIcon: config.get('poi.useSVGIcon', false),
  }
  name = 'SlotitemIcon'
  svgPath = () =>
    `${ROOT}/assets/svg/slotitem/${this.props.slotitemId}.svg`
  pngPath = () =>
    `${ROOT}/assets/img/slotitem/${this.props.slotitemId + 100}.png`
  getAvailable = () => {
    try {
      fs.statSync(this.state.useSVGIcon ? this.svgPath() : this.pngPath())
      return true
    } catch (e) {
      return false
    }
  }
  setUseSvg = (val) => {
    this.setState({
      useSVGIcon: val,
    })
  }
  componentDidMount = () => {
    this.key = `${process.hrtime()[0]}${process.hrtime()[1]}`
    iconConfSetter.reg(this.key, this.setUseSvg)
  }
  componentWillUnmount = () => {
    iconConfSetter.unreg(this.key)
  }
  render() {
    const { alt, slotitemId, className } = this.props
    if (this.state.useSVGIcon) {
      if (typeof svgAvailableList[slotitemId] === 'undefined') {
        svgAvailableList[slotitemId] = this.getAvailable()
      }
    } else {
      if (typeof pngAvailableList[slotitemId] === 'undefined') {
        pngAvailableList[slotitemId] = this.getAvailable()
      }
    }
    if (this.state.useSVGIcon) {
      return svgAvailableList[slotitemId]
        ? <img alt={alt} src={`file://${this.svgPath()}`} className={getClassName(className, true)} />
        : <img alt={alt} src={`file://${ROOT}/assets/svg/slotitem/-1.svg`} className={getClassName(className, true)} />
    } else if (pngAvailableList[slotitemId]) {
      return <img alt={alt} src={`file://${this.pngPath()}`} className={getClassName(className, false)} />
    } else {
      return <img alt={alt} src={`file://${ROOT}/assets/img/slotitem/-1.png`} className={getClassName(className, false)} />
    }
  }
}

export class MaterialIcon extends PureComponent {
  static propTypes = {
    materialId: PropTypes.number,
    className: PropTypes.string,
    alt: PropTypes.string,
  }
  state = {
    useSVGIcon: config.get('poi.useSVGIcon', false),
  }
  name = 'MaterialIcon'
  setUseSvg = (val) => {
    this.setState({
      useSVGIcon: val,
    })
  }
  componentDidMount = () => {
    this.key = `${process.hrtime()[0]}${process.hrtime()[1]}`
    iconConfSetter.reg(this.key, this.setUseSvg)
  }
  componentWillUnmount = () => {
    iconConfSetter.unreg(this.key)
  }
  render() {
    let src = null
    if (this.state.useSVGIcon) {
      src = `file://${ROOT}/assets/svg/material/${this.props.materialId}.svg`
    } else {
      src = `file://${ROOT}/assets/img/material/0${this.props.materialId}.png`
    }
    return <img alt={this.props.alt} src={src} className={getClassName(this.props.className, this.state.useSVGIcon)} />
  }
}
