/* global API_WS */

let socket;
export let emit; // eslint-disable-line one-var
// the types of payloads we can expect from the server
export const actions = [
  'RUSTLERS_SET',
  'STREAM_SET',
  'STREAMS_SET',
].reduce((acc, curr) => {
  acc[curr] = Symbol(curr);
  return acc;
}, {});

// thunks for these payloads
const thunks = {
  RUSTLERS_SET: payload => (dispatch, getState) => {
    const state = getState();
    const [ id ] = payload;
    if (!state.streams[id]) {
      emit('getStream', id);
    }
    else {
      dispatch({
        type: actions.RUSTLERS_SET,
        payload,
      });
    }
  },
};

export const init = store => {
  socket = new WebSocket(API_WS || `ws://${location.host}`);
  const messageQueue = [];
  emit = (...args) => {
    if (socket.readyState !== 1) {
      messageQueue.push(args);
    }
    else {
      socket.send(JSON.stringify(args));
    }
  };

  socket.onopen = function onopen(event) {
    console.log('socket opened', event);
    messageQueue.forEach(args => emit(...args));
  };


  socket.onmessage = function onmessage(event) {
    console.log('socket message', event);
    const { data } = event;
    try {
      const [ ws_action, ...args ] = JSON.parse(data);
      const action = actions[ws_action];
      // make sure we know what to do with this action
      if (!action) {
        throw new TypeError(`Invalid action "${ws_action}"`);
      }
      // call any 'hook' thunks if they exist
      if (thunks[ws_action]) {
        store.dispatch(thunks[ws_action](args));
      }
      // just dispatch the action if no hooks exist
      else {
        store.dispatch({
          type: action,
          payload: args,
        });
      }
    }
    catch (err) {
      console.error(`Failed to handle incoming websocket action\n${data}\n`, err);
    }
  };

  socket.onerror = socket.onclose = function ondisconnect(event) {
    console.log('socket disconnect', event);
    setTimeout(() => init(store), 10000);
  };
};

// expose this for testing
window.__emit__ = emit;
