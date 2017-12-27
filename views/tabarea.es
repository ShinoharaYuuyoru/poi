import classNames from 'classnames'
import { connect } from 'react-redux'
import React, { Component, Children, PureComponent } from 'react'
import PropTypes from 'prop-types'
import FontAwesome from 'react-fontawesome'
import { Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap'
import { isEqual, omit, get } from 'lodash'
import shallowEqual from 'fbjs/lib/shallowEqual'

//import PluginManager from './services/plugin-manager'
import settings from './components/settings'
import mainview from './components/main'
import shipview from './components/ship'
import PluginWrap from './plugin-wrapper'

import { isInGame } from 'views/utils/game-utils'

const {i18n, dispatch, config} = window
const __ = i18n.others.__.bind(i18n.others)




const TabContentsUnion = connect(
  (state) => ({
    enableTransition: get(state.config, 'poi.transition.enable', true),
  }),
  undefined,
  undefined,
  {pure: true, withRef: true}
)(class tabContentsUnion extends Component {
  static propTypes = {
    enableTransition: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
    activeTab: PropTypes.string.isRequired,
  }
  shouldComponentUpdate(nextProps, nextState) {
    return !shallowEqual(omit(this.props, ['children']), omit(nextProps, ['children']))
      || !shallowEqual(this.state, nextState)
      || !isEqual(this.childrenKey(this.props.children), this.childrenKey(nextProps.children))
  }
  componentWillUpdate(nextProps, nextState) {
    if (nextProps.activeTab != this.props.activeTab) {
      this.prevTab = this.props.activeTab
    }
  }
  childrenKey = (children) => {
    return Children.map(children, (child) => child.key).filter(Boolean)
  }
  findChildByKey = (children, key) => {
    return Children.map(children,
      (child) => child.key === key ? child : null).filter(Boolean)[0]
  }
  activeKey = () => {
    return this.props.activeTab || (this.props.children[0] || {}).key
  }
  prevKey = () => {
    return this.prevTab || (this.props.children[0] || {}).key
  }
  render() {
    let onTheLeft = true
    const activeKey = this.activeKey()
    const prevKey = this.prevKey()
    return (
      <div className='poi-tab-contents'>
        {
          Children.map(this.props.children, (child, index) => {
            if (child.key === activeKey)
              onTheLeft = false
            const positionLeft = child.key === activeKey ?  '0%'
              : onTheLeft ? '-100%' : '100%'
            const tabClassName = classNames("poi-tab-child-positioner", {
              'poi-tab-child-positioner-transition': (child.key === activeKey || child.key === prevKey) && this.props.enableTransition,
              'transparent': child.key !== activeKey,
            })
            return (
              <div className='poi-tab-child-sizer'>
                <div className={tabClassName}
                  style={{transform: `translateX(${positionLeft})`}}>
                  {child}
                </div>
              </div>
            )
          })
        }
      </div>
    )
  }
})

let lockedTab = false

export default connect(
  (state) => ({
    plugins: state.plugins,
    doubleTabbed: get(state.config, 'poi.tabarea.double', false),
    useGridMenu: get(state.config, 'poi.tabarea.grid', navigator.maxTouchPoints !== 0),
    activeMainTab: get(state.ui, 'activeMainTab', 'mainView'),
    activePluginName: get(state.ui, 'activePluginName', ''),
  })
)(class ControlledTabArea extends PureComponent {
  static propTypes = {
    plugins: PropTypes.array.isRequired,
    doubleTabbed: PropTypes.bool.isRequired,
    useGridMenu: PropTypes.bool.isRequired,
    activeMainTab: PropTypes.string.isRequired,
    activePluginName: PropTypes.string.isRequired,
  }
  dispatchTabChangeEvent = (tabInfo, autoSwitch=false) =>
    dispatch({
      type: '@@TabSwitch',
      tabInfo,
      autoSwitch,
    })
  selectTab = (key, autoSwitch=false) => {
    if (key == null)
      return
    let tabInfo = {}
    const mainTabKeyUnion = this.props.doubleTabbed ? this.mainTabKeyUnion : this.tabKeyUnion
    const mainTabInstance = mainTabKeyUnion.getWrappedInstance()
    if (mainTabInstance.findChildByKey(mainTabInstance.props.children, key)) {
      tabInfo = {
        ...tabInfo,
        activeMainTab: key,
      }
    }
    const tabKeyUnionInstance = this.tabKeyUnion.getWrappedInstance()
    if ((!['mainView', 'shipView', 'settings'].includes(key)) &&
      tabKeyUnionInstance.findChildByKey(tabKeyUnionInstance.props.children, key)) {
      tabInfo = {
        ...tabInfo,
        activePluginName: key,
      }
    }
    this.dispatchTabChangeEvent(tabInfo, autoSwitch)
  }
  handleSelectTab = (key) => {
    this.selectTab(key)
  }
  handleSelectDropdown = (e, key) => {
    this.selectTab(key)
  }
  handleCtrlOrCmdTabKeyDown = () => {
    this.selectTab('mainView')
  }
  handleCmdCommaKeyDown = () => {
    this.selectTab('settings')
  }
  handleCtrlOrCmdNumberKeyDown = (num) => {
    let key
    switch (num) {
    case 1:
      key = 'mainView'
      break
    case 2:
      key = 'shipView'
      break
    default:
      key = (this.props.plugins[num-3] || {}).packageName
      break
    }
    this.selectTab(key)
  }
  handleShiftTabKeyDown = () => {
    this.handleSetTabOffset(-1)
  }
  handleTabKeyDown = () => {
    this.handleSetTabOffset(1)
  }
  handleSetTabOffset = (offset) => {
    const tabKeyUnionInstance = this.tabKeyUnion.getWrappedInstance()
    const childrenKey = tabKeyUnionInstance.childrenKey(tabKeyUnionInstance.props.children)
    const nowIndex = childrenKey.indexOf(this.props.doubleTabbed ? this.props.activePluginName : this.props.activeMainTab)
    this.selectTab(childrenKey[(nowIndex + childrenKey.length + offset) % childrenKey.length])
  }
  handleKeyDown = () => {
    if (this.listener != null)
      return
    this.listener = true
    window.addEventListener('keydown', async (e) => {
      const isingame = await isInGame()
      if ((document.activeElement.tagName === 'WEBVIEW' && !isingame) || document.activeElement.tagName === 'INPUT') {
        return
      }
      if (e.keyCode == 9) {
        e.preventDefault()
        if (lockedTab && e.repeat)
          return
        lockedTab = true
        setTimeout(() => {lockedTab = false} , 200)
        if (e.ctrlKey || e.metaKey) {
          this.handleCtrlOrCmdTabKeyDown()
        } else if (e.shiftKey) {
          this.handleShiftTabKeyDown()
        } else {
          this.handleTabKeyDown()
        }
      } else if (e.ctrlKey || e.metaKey) {
        if (e.keyCode >= '1'.charCodeAt() && e.keyCode <= '9'.charCodeAt()) {
          this.handleCtrlOrCmdNumberKeyDown(e.keyCode - 48)
        } else if (e.keyCode == '0'.charCodeAt()) {
          this.handleCtrlOrCmdNumberKeyDown(10)
        }
      }
    })
  }
  handleResponse = (e) => {
    if (config.get('poi.autoswitch.enabled', true)) {
      let toSwitch
      if (config.get('poi.autoswitch.main', true)) {
        if (['/kcsapi/api_port/port',
          '/kcsapi/api_get_member/ndock',
          '/kcsapi/api_get_member/kdock',
          '/kcsapi/api_get_member/questlist',
        ].includes(e.detail.path)) {
          toSwitch = 'mainView'
        }
        if (['/kcsapi/api_get_member/preset_deck'].includes(e.detail.path)) {
          toSwitch = 'shipView'
        }
      }
      for (const [id, enabled, switchPluginPath] of this.props.plugins.map(plugin => [plugin.id, plugin.enabled, plugin.switchPluginPath || []])) {
        for (const switchPath of switchPluginPath) {
          if ((config.get(`poi.autoswitch.${id}`, true) && enabled) && (switchPath === e.detail.path || (switchPath.path === e.detail.path && switchPath.valid && switchPath.valid()))) {
            toSwitch = id
          }
        }
      }
      this.selectTab(toSwitch, true)
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.doubleTabbed != this.props.doubleTabbed)
      this.dispatchTabChangeEvent({
        activeMainTab: 'mainView',
      })
  }
  componentDidMount() {
    this.handleKeyDown()
    window.addEventListener('game.start', this.handleKeyDown)
    window.addEventListener('game.response', this.handleResponse)
    window.openSettings = this.handleCmdCommaKeyDown
  }
  componentWillUnmount() {
    window.removeEventListener('game.start', this.handleKeyDown)
    window.removeEventListener('game.response', this.handleResponse)
  }
  // All displaying plugins
  listedPlugins = () => {
    return this.props.plugins.filter((plugin) =>
      plugin.enabled &&
      (plugin.handleClick || plugin.windowURL || plugin.reactClass)
    )
  }
  // All non-new-window displaying plugins
  tabbedPlugins = () => {
    return this.props.plugins.filter((plugin) =>
      plugin.enabled &&
      !plugin.handleClick &&
      !plugin.windowURL &&
      plugin.reactClass
    )
  }
  render() {
    const navClass = classNames('top-nav', {
      'grid-menu': this.props.useGridMenu,
    })
    const tabbedPlugins = this.tabbedPlugins()
    const activePlugin = tabbedPlugins.length == 0 ? {} :
      tabbedPlugins.find((p) => p.packageName === this.props.activePluginName) || tabbedPlugins[0]
    const activePluginName = activePlugin.packageName
    const defaultPluginTitle = <span><FontAwesome name='sitemap' />{__(' Plugins')}</span>
    const pluginDropdownContents = this.props.plugins.length == 0 ? (
      <MenuItem key={1002} disabled>
        {window.i18n.setting.__("Install plugins in settings")}
      </MenuItem>
    ) : (
      this.listedPlugins().map((plugin, index) =>
        <MenuItem key={plugin.id} eventKey={this.props.activeMainTab === plugin.id ? '' : plugin.id} onSelect={plugin.handleClick}>
          {plugin.displayName}
        </MenuItem>
      )
    )
    const pluginContents = this.tabbedPlugins().map((plugin) =>
      <PluginWrap
        key={plugin.id}
        plugin={plugin}
      />
    )

    return !this.props.doubleTabbed ? (
      <div>
        <Nav bsStyle="tabs" activeKey={this.props.activeMainTab} id="top-nav" className={navClass}
          onSelect={this.handleSelectTab}>
          <NavItem key='mainView' eventKey='mainView'>
            {mainview.displayName}
          </NavItem>
          <NavItem key='shipView' eventKey='shipView'>
            {shipview.displayName}
          </NavItem>
          <NavItem key='plugin' eventKey={activePluginName} onSelect={this.handleSelect}>
            {(activePlugin || {}).displayName || defaultPluginTitle}
          </NavItem>
          <NavDropdown id='plugin-dropdown' pullRight title=' '
            onSelect={this.handleSelectDropdown}>
            {pluginDropdownContents}
          </NavDropdown>
          <NavItem key='settings' eventKey='settings' className="tab-narrow">
            <FontAwesome key={0} name='cog' />
          </NavItem>
        </Nav>
        <TabContentsUnion ref={(ref) => { this.tabKeyUnion = ref }} activeTab={this.props.activeMainTab}>
          <div id={mainview.name} className={classNames(mainview.name, "poi-app-tabpane")} key='mainView'>
            <mainview.reactClass />
          </div>
          <div id={shipview.name} className={classNames(shipview.name, "poi-app-tabpane")} key='shipView'>
            <shipview.reactClass />
          </div>
          {pluginContents}
          <div id={settings.name} className={classNames(settings.name, "poi-app-tabpane")} key='settings'>
            <settings.reactClass />
          </div>
        </TabContentsUnion>
      </div>
    ) : (
      <div className='poi-tabs-container'>
        <div className="no-scroll">
          <Nav bsStyle="tabs" activeKey={this.props.activeMainTab} onSelect={this.handleSelectTab} id='split-main-nav'>
            <NavItem key='mainView' eventKey='mainView'>
              {mainview.displayName}
            </NavItem>
            <NavItem key='shipView' eventKey='shipView'>
              {shipview.displayName}
            </NavItem>
            <NavItem key='settings' eventKey='settings'>
              {settings.displayName}
            </NavItem>
          </Nav>
          <TabContentsUnion
            ref={(ref) => {this.mainTabKeyUnion = ref }}
            activeTab={this.props.activeMainTab}>
            <div id={mainview.name} className={classNames(mainview.name, "poi-app-tabpane")} key='mainView'>
              <mainview.reactClass activeMainTab={this.props.activeMainTab} />
            </div>
            <div id={shipview.name} className={classNames(shipview.name, "poi-app-tabpane")} key='shipView'>
              <shipview.reactClass activeMainTab={this.props.activeMainTab} />
            </div>
            <div id={settings.name} className={classNames(settings.name, "poi-app-tabpane")} key='settings'>
              <settings.reactClass activeMainTab={this.props.activeMainTab}/>
            </div>
          </TabContentsUnion>
        </div>
        <div className="no-scroll">
          <Nav bsStyle="tabs" onSelect={this.handleSelectTab} id='split-plugin-nav' className={navClass}>
            <NavDropdown id='plugin-dropdown' pullRight onSelect={this.handleSelectDropdown}
              title={(activePlugin || {}).displayName || defaultPluginTitle}>
              {pluginDropdownContents}
            </NavDropdown>
          </Nav>
          <TabContentsUnion ref={(ref) => { this.tabKeyUnion = ref }}
            activeTab={this.props.activePluginName}>
            {pluginContents}
          </TabContentsUnion>
        </div>
      </div>
    )
  }
})
