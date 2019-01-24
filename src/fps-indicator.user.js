// ==UserScript==
// @name        FPS Indicator
// @author      LaySent
// @version     1.0.0
// @description Add a label on top left corner that lets you know current fps status
// @homepage    https://github.com/laysent/fps-detector
// @exclude     *
// @downloadURL https://github.com/laysent/fps-detector/dist/index.user.js
// @updateURL   https://raw.githubusercontent.com/laysent/fps-detector/master/dist/index.user.js
// @supportURL  https://github.com/laysent/fps-detector/issues
// @run-at      document-end
// @license     MIT License
// ==/UserScript==

import Detector from './index';

window.$$indicator_cancel = (() => {
  function setStyle(element, style) {
    Object.keys(style).forEach((key) => {
      element.style[key] = style[key]; // eslint-disable-line
    });
  }
  function getIndicator(id) {
    let element = document.getElementById(id);
    if (!element) {
      element = document.createElement('div');
      element.id = id;
      element.textContent = ' - fps';
      setStyle(element, {
        position: 'fixed',
        top: '5px',
        left: '5px',
        zIndex: '100000',
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: '5px',
        padding: '10px',
      });
      document.body.appendChild(element);
    }
    return element;
  }
  const indicator = getIndicator('fps-indicator');
  const detector = new Detector();
  const unsubscribe = detector.on(0, Infinity, (fps) => {
    indicator.textContent = `${fps} fps`;
    let color = 'red';
    if (fps >= 24) color = 'green';
    else if (fps >= 10) color = 'orange';
    indicator.style.color = color;
  });
  detector.start();
  function cancel() {
    document.body.removeChild(indicator);
    detector.stop();
    unsubscribe();
  }
  indicator.addEventListener('click', cancel);
  return cancel;
})();
