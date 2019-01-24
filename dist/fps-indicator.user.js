// ==UserScript==
// @name        FPS Indicator
// @author      LaySent
// @version     0.1.0
// @description Add a label on top left corner that lets you know current fps status
// @homepage    https://github.com/laysent/fps-detector
// @exclude     *
// @downloadURL https://github.com/laysent/fps-detector/dist/index.user.js
// @updateURL   https://raw.githubusercontent.com/laysent/fps-detector/master/dist/index.user.js
// @supportURL  https://github.com/laysent/fps-detector/issues
// @run-at      document-end
// @license     MIT License
// ==/UserScript==
(function () {
  'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  /* eslint no-restricted-globals: 2 */
  function webWorker() {
    var oneSecond = 1000;
    var startTime;
    var fallbackTimer = null;
    var listOfTicks = [];
    var started = false;

    function fallback() {
      self.postMessage(0);
      fallbackTimer = setTimeout(fallback, oneSecond);
    }

    function tick(now) {
      if (!started) return;
      listOfTicks = listOfTicks.filter(function (timestamp) {
        return now - timestamp < oneSecond;
      }).concat(now);
      var fps = listOfTicks.length;

      if (now - startTime > oneSecond) {
        self.postMessage(fps);
      }

      fallbackTimer = setTimeout(fallback, oneSecond);
    }

    function start(timestamp) {
      startTime = timestamp;
      started = true;
      fallbackTimer = setTimeout(fallback, oneSecond);
    }

    function stop() {
      started = false;
      if (fallbackTimer !== null) clearTimeout(fallbackTimer);
      fallbackTimer = null;
      listOfTicks = [];
    }

    self.addEventListener('message', function (event) {
      var timestamp = event.data.timestamp;

      switch (event.data.type) {
        case 'start':
          start(timestamp);
          break;

        case 'stop':
          stop(timestamp);
          break;

        case 'tick':
          tick(timestamp);
          break;

        case 'pause':
          if (started) {
            stop(timestamp);
            started = true;
          }

          break;

        case 'resume':
          if (started) start(timestamp);
          break;

        default:
          break;
      }
    });
  }

  function createWorker(f) {
    var script = f.toString().match(/^function[^{]+{([\s\S]+)}$/)[1];
    var blob = new Blob([script], {
      type: 'application/javascript'
    });
    var url = URL.createObjectURL(blob);
    return new Worker(url);
  }

  var Detector =
  /*#__PURE__*/
  function () {
    function Detector() {
      _classCallCheck(this, Detector);

      this.id = null;
      this.callback = this.callback.bind(this);
      this.receiver = this.receiver.bind(this);
      this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
      this.subscriptions = [];
    }

    _createClass(Detector, [{
      key: "callback",
      value: function callback(timestamp) {
        this.worker.postMessage({
          type: 'tick',
          timestamp: timestamp
        });
        this.id = window.requestAnimationFrame(this.callback);
      }
    }, {
      key: "receiver",
      value: function receiver(event) {
        var fps = +event.data;
        this.subscriptions.forEach(function (config) {
          if (fps >= config.start && fps <= config.end) {
            config.subscriber(fps);
          }
        });
      }
    }, {
      key: "handleVisibilityChange",
      value: function handleVisibilityChange() {
        if (document.hidden) {
          this.worker.postMessage({
            type: 'pause',
            timestamp: performance.now()
          });
        } else {
          this.worker.postMessage({
            type: 'resume',
            timestamp: performance.now()
          });
        }
      }
    }, {
      key: "start",
      value: function start() {
        if (!this.worker) {
          this.worker = createWorker(webWorker);
        }

        document.addEventListener('visibilitychange', this.handleVisibilityChange, false);
        this.worker.postMessage({
          type: 'start',
          timestamp: performance.now()
        });
        this.worker.addEventListener('message', this.receiver);
        this.callback();
      }
    }, {
      key: "stop",
      value: function stop() {
        if (this.id !== null) {
          window.cancelAnimationFrame(this.id);
          this.id = null;
        }

        if (this.worker) this.worker.postMessage({
          type: 'stop',
          timestamp: performance.now()
        });
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      }
    }, {
      key: "on",
      value: function on(start, end, subscriber) {
        var _this = this;

        this.subscriptions.push({
          subscriber: subscriber,
          start: start,
          end: end
        });
        var registered = true;
        return function () {
          if (!registered) return;
          _this.subscriptions = _this.subscriptions.filter(function (config) {
            return config.start !== start || config.end !== end || config.subscriber !== subscriber;
          });
          registered = false;
        };
      }
    }]);

    return Detector;
  }();

  // ==UserScript==

  window.$$indicator_cancel = function () {
    function setStyle(element, style) {
      Object.keys(style).forEach(function (key) {
        element.style[key] = style[key]; // eslint-disable-line
      });
    }

    function getIndicator(id) {
      var element = document.getElementById(id);

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
          padding: '10px'
        });
        document.body.appendChild(element);
      }

      return element;
    }

    var indicator = getIndicator('fps-indicator');
    var detector = new Detector();
    var unsubscribe = detector.on(0, Infinity, function (fps) {
      indicator.textContent = "".concat(fps, " fps");
      var color = 'red';
      if (fps >= 24) color = 'green';else if (fps >= 10) color = 'orange';
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
  }();

}());
