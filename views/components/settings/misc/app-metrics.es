import React, { PureComponent } from 'react'
import { remote } from 'electron'
import { Button } from 'react-bootstrap'
import { sortBy, round, sumBy } from 'lodash'

const { i18n } = window
const __ = i18n.setting.__.bind(i18n.setting)

class AppMetrics extends PureComponent {
  constructor(props) {
    super(props)

    this.getAppMetrics = remote.require('electron').app.getAppMetrics

    this.getAllWindows = remote.require('electron').BrowserWindow.getAllWindows

    this.state = {
      metrics: [],
      total: {},
      pidmap: {},
      active: false,
    }
  }

  collect = () => {
    const metrics = this.getAppMetrics()

    const total = {}

    const pidmap = {}
    ;['workingSetSize', 'peakWorkingSetSize'].map(prop =>
      total[prop] = round(sumBy(metrics, metric => metric.memory[prop]) / 1000, 2)
    )

    total.percentCPUUsage = round(sumBy(metrics, metric => metric.cpu.percentCPUUsage), 2)

    this.getAllWindows().map(win => {
      const pid = win.webContents.getOSProcessId()
      const title = win.getTitle()
      pidmap[pid] = title
    })
    this.setState({
      metrics: sortBy(JSON.parse(JSON.stringify(metrics)), 'pid'),
      total,
      pidmap,
    })
  }

  componentWillUnmount() {
    if (this.cycle) {
      clearInterval(this.cycle)
    }
  }

  handleClick = () => {
    const { active } = this.state
    if (active) {
      clearInterval(this.cycle)
    } else {
      this.collect()
      this.cycle = setInterval(this.collect.bind(this), 5 * 1000)
    }

    this.setState({
      active: !active,
    })
  }

  render() {
    const { metrics, active, total, pidmap } = this.state
    return (
      <div>
        <div>
          <Button onClick={this.handleClick} bsStyle={active ? 'success' : 'default'}>
            {
              active
                ? <span>{__('Monitor on')}</span>
                : <span>{__('Monitor off')}</span>
            }
          </Button>
        </div>
        {
          active &&
          <div className="metric-table">
            <div className="metric-row metric-haeder">
              <span>PID</span>
              {
                ['type', 'working/MB', 'peak/MB', 'private/MB', 'shared/MB', 'CPU/%', 'wakeup'].map(str =>
                  <span key={str} title={str}>{str}</span>
                )
              }
            </div>
            {
              metrics.map(metric => (
                <div className='metric-row' key={metric.pid}>
                  <span>{metric.pid}</span>
                  <span title={pidmap[metric.pid] || metric.type}>
                    {pidmap[metric.pid] || metric.type}
                  </span>
                  {
                    ['workingSetSize', 'peakWorkingSetSize', 'privateBytes', 'sharedBytes'].map(prop =>
                      <span key={prop}>{round((metric.memory || [])[prop] / 1000, 2)}</span>
                    )
                  }
                  {
                    ['percentCPUUsage', 'idleWakeupsPerSecond'].map(prop =>
                      <span key={prop}>{round((metric.cpu || [])[prop], 1)}</span>
                    )
                  }
                </div>
              ))
            }
            <div className='metric-row metric-total'>
              <span>
                {__('TOTAL')}
              </span>
              <span />
              <span>
                {total.workingSetSize}
              </span>
              <span>
                {total.peakWorkingSetSize}
              </span>
              <span />
              <span />
              <span>
                {total.percentCPUUsage}
              </span>
              <span />
            </div>
          </div>
        }
      </div>
    )
  }
}

export default AppMetrics
