// This statement is replaced by `babel-preset-env` with imports of the minimal
// polyfills necessary for the last two browser versions.
import 'babel-polyfill';

import React from 'react';
import { render } from 'react-dom';

import App from './components/App';
import store from './store';


const mountPoint = document.getElementById('main');
render(
  <App store={store} />,
  mountPoint,
  () => mountPoint.className = mountPoint.className.replace('jiggle-background', '')
);
