import * as _ from 'lodash'
import * as moment from 'moment'

import { Action, State } from 'src/singletons/interfaces'
import { getNow, getSuns, getHours } from 'src/singletons/times'

export default (state: State, action: Action): State => {
  switch (action.type) {
    case '@@redux/INIT': {
      return state
    }
    case 'space': {
      // only update if location has changed
      if (_.isEqual(state.space, action.space)) return state
      // location has changed, update both space and time
      const newState = { ...state, space: action.space }
      return updateTimes(newState)
    }
    case 'time': {
      const newState = { ...state, ms: action.ms }
      // only do work if we have location
      if (!state.space) return newState
      // prepare to compare times
      const currMoment = moment(action.ms)
      const prevMoment = moment(state.ms)
      // don't update if minute is the same
      if (currMoment.isSame(prevMoment, 'minute')) return newState
      if (currMoment.isSame(prevMoment, 'day') && state.suns) {
        // only minute has changed, just update now
        const newNow = getNow(action.ms, state.suns.solarNoon)
        return { ...newState, now: newNow }
      }
      // day has changed, update all the times
      return updateTimes(newState)
    }
    default: {
      console.warn('Unhandled action:', action)
      return state
    }
  }
}

const updateTimes = (state: State): State => {
  if (!state.space) return state // XXX: ts bug, unreachable condition
  const newSuns = getSuns(state.ms, state.space)
  const newNow = getNow(state.ms, newSuns.solarNoon)
  const newHours = getHours(state.ms, newSuns.solarNoon)
  return { ...state, suns: newSuns, now: newNow, hours: newHours }
}