/**
 * Created by Dimitri Aguera on 02/10/2017.
 */
import { post } from 'core/client/services/core.api.services'

export const oPLAY_TRACK = 'oPLAY_ITEM';
export const oPLAY_STATE = 'oPLAY_STATE';
export const oPAUSE_STATE = 'oPAUSE_STATE';

export const oADD_PO_TO_QUEUE = 'ADD_PO_TO_QUEUE';
export const oUPDATE_PO_IN_QUEUE = 'UPDATE_PO_IN_QUEUE';

export const playTrack = (item) => {
  return {
    type: oPLAY_TRACK,
    po: item.po,
    model: item.model,
  }
};


export const addPoToQueue = (item) => {
  return {
    type: oADD_PO_TO_QUEUE,
    po: item.po
  }
};




