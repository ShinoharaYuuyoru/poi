import { join } from 'path-extra'
import classNames from 'classnames'
import { connect } from 'react-redux'
import React from 'react'
import { createSelector } from 'reselect'
import { OverlayTrigger, Tooltip, Label } from 'react-bootstrap'
import { memoize } from 'lodash'
import FontAwesome from 'react-fontawesome'

import { SlotitemIcon } from 'views/components/etc/icon'
import { getItemData } from './slotitems-data'
import { equipIsAircraft } from 'views/utils/game-utils'
import {
  shipDataSelectorFactory,
  shipEquipDataSelectorFactory,
  landbaseSelectorFactory,
  landbaseEquipDataSelectorFactory,
} from 'views/utils/selectors'

import './assets/slotitems.css'

const { i18n } = window

function getBackgroundStyle() {
  return window.isDarkTheme ?
    {backgroundColor: 'rgba(33, 33, 33, 0.7)'}
    :
    {backgroundColor: 'rgba(255, 255, 255, 0.7)'}
}

const slotitemsDataSelectorFactory = memoize((shipId) =>
  createSelector([
    shipDataSelectorFactory(shipId),
    shipEquipDataSelectorFactory(shipId),
  ], ([ship, $ship]=[{}, {}], equipsData) => ({
    api_maxeq: $ship.api_maxeq,
    equipsData,
    exslotUnlocked: ship.api_slot_ex != 0,
  }))
)

const landbaseSlotitemsDataSelectorFactory = memoize(landbaseId =>
  createSelector([
    landbaseSelectorFactory(landbaseId),
    landbaseEquipDataSelectorFactory(landbaseId),
  ], (landbase={}, equipsData) => ({
    api_maxeq: (landbase.api_plane_info || []).map(l => l.api_max_count),
    api_cond: (landbase.api_plane_info || []).map(l => l.api_cond),
    api_state: (landbase.api_plane_info || []).map(l => l.api_state),
    equipsData,
  }))
)

export const Slotitems = connect(
  (state, { shipId }) =>
    slotitemsDataSelectorFactory(shipId)(state)
)(function ({api_maxeq, equipsData, exslotUnlocked}) {
  return (
    <div className="slotitems">
      {equipsData &&
      equipsData.map((equipData, equipIdx) => {
        const isExslot = equipIdx == (equipsData.length-1)
        if (isExslot && !equipData && !exslotUnlocked) {
          return <div key={equipIdx}></div>
        }
        const [equip, $equip, onslot] = equipData || []
        const itemOverlay = equipData &&
          <Tooltip id={`equip-${equip.api_id}`}>
            <div>
              <div>
                {i18n.resources.__(($equip || {api_name: '??'}).api_name)}
                {(equip.api_level == null || equip.api_level == 0) ? undefined :
                  <strong style={{color: '#45A9A5'}}> <FontAwesome name='star' />{equip.api_level}</strong>
                }
                {(equip.api_alv && equip.api_alv >= 1 && equip.api_alv <= 7) &&
                  <img className='alv-img' src={join('assets', 'img', 'airplane', `alv${equip.api_alv}.png`)} />
                }
              </div>
              {$equip &&
                getItemData($equip).map((data, propId) =>
                  <div key={propId}>{data}</div>
                )
              }
            </div>
          </Tooltip>

        const equipIconId = equipData ? $equip.api_type[3] : 0
        const showOnslot = !equipData || isExslot || equipIsAircraft($equip)
        const maxOnslot = isExslot ? 0 : api_maxeq[equipIdx]
        const onslotText = isExslot ? "+" : equipData ? onslot : maxOnslot
        const onslotWarning = equipData && onslot < maxOnslot
        const onslotClassName = classNames("slotitem-onslot", {
          'show': showOnslot,
          'hide': !showOnslot,
          'text-warning': onslotWarning,
        })
        const itemSpan =
          <span>
            <SlotitemIcon className='slotitem-img' slotitemId={equipIconId} />
            <span className={onslotClassName} style={getBackgroundStyle()} >
              {onslotText}
            </span>
          </span>

        return (
          <div key={equipIdx} className="slotitem-container">
            {
              itemOverlay ?
                <OverlayTrigger placement='left' overlay={itemOverlay}>
                  {itemSpan}
                </OverlayTrigger>
                :
                itemSpan
            }
          </div>
        )
      })
      }
    </div>
  )
})

export const LandbaseSlotitems = connect(
  (state, { landbaseId }) =>
    landbaseSlotitemsDataSelectorFactory(landbaseId)(state)
)(function ({api_maxeq, api_cond, api_state, equipsData, isMini}) {
  return (
    <div className="slotitems">
      {equipsData &&
      equipsData.map((equipData, equipIdx) => {
        const [equip, $equip, onslot] = equipData || []
        const equipIconId = equipData ? $equip.api_type[3] : 0
        const showOnslot = !equipData || equipIsAircraft($equip)
        const maxOnslot = api_maxeq[equipIdx]
        const onslotWarning = equipData && onslot < maxOnslot
        const onslotText = equipData ? onslot : maxOnslot
        const onslotClassName = classNames("slotitem-onslot", {
          'show': showOnslot && api_state[equipIdx] === 1,
          'hide': !showOnslot || api_state[equipIdx] !== 1,
          'text-warning': onslotWarning,
        })
        const iconStyle = {
          opacity: api_state[equipIdx] === 2 ? 0.5 : null,
          filter: api_cond[equipIdx] > 1 ? `drop-shadow(0px 0px 4px ${api_cond[equipIdx] === 2 ? '#FB8C00' : '#E53935' })` : null,
        }
        const itemOverlay = equipData &&
          <Tooltip id={`equip-${equip.api_id}`}>
            <div>
              <div style={{display: 'flex'}}>
                {i18n.resources.__(($equip || {api_name: '??'}).api_name)}
                {(equip.api_level == null || equip.api_level == 0) ? undefined :
                  <strong style={{color: '#45A9A5'}}> <FontAwesome name='star' />{equip.api_level}</strong>
                }
                {(equip.api_alv && equip.api_alv >= 1 && equip.api_alv <= 7) &&
                  <img className='alv-img' src={join('assets', 'img', 'airplane', `alv${equip.api_alv}.png`)} />
                }
                {isMini && <Label className={onslotClassName} bsStyle={`${onslotWarning ? 'warning' : 'default'}`}>
                  {onslotText}
                </Label>}
              </div>
              {$equip &&
                getItemData($equip).map((data, propId) =>
                  <div key={propId}>{data}</div>
                )
              }
            </div>
          </Tooltip>
        const itemSpan =
          <span>
            <span style={iconStyle}>
              <SlotitemIcon className='slotitem-img' slotitemId={equipIconId} />
            </span>
            {!isMini && <span className={onslotClassName} style={getBackgroundStyle()}>
              {onslotText}
            </span>}
          </span>

        return (
          <div key={equipIdx} className="slotitem-container">
            {
              itemOverlay ?
                <OverlayTrigger placement='left' overlay={itemOverlay}>
                  {itemSpan}
                </OverlayTrigger>
                :
                itemSpan
            }
          </div>
        )
      })
      }
    </div>
  )
})
