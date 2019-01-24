/* eslint no-restricted-globals: 2 */
function webWorker() {
  const oneSecond = 1000;
  let startTime;
  let fallbackTimer = null;
  let listOfTicks = [];
  let started = false;
  function fallback() {
    self.postMessage(0);
    fallbackTimer = setTimeout(fallback, oneSecond);
  }
  function tick(now) {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    if (!started) return;
    listOfTicks = listOfTicks.filter(timestamp => now - timestamp < oneSecond).concat(now);
    const fps = listOfTicks.length;
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
  self.addEventListener('message', (event) => {
    const { data: { timestamp } } = event;
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
      case 'pause': if (started) { stop(timestamp); started = true; } break;
      case 'resume': if (started) start(timestamp); break;
      default: break;
    }
  });
}

function createWorker(f) {
  const script = f.toString().match(/^function[^{]+{([\s\S]+)}$/)[1];
  const blob = new Blob([script], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}

class Detector {
  constructor() {
    this.id = null;
    this.callback = this.callback.bind(this);
    this.receiver = this.receiver.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.subscriptions = [];
  }

  callback(timestamp) {
    this.worker.postMessage({ type: 'tick', timestamp });
    this.id = window.requestAnimationFrame(this.callback);
  }

  receiver(event) {
    const fps = +event.data;
    this.subscriptions.forEach((config) => {
      if (fps >= config.start && fps <= config.end) {
        config.subscriber(fps);
      }
    });
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.worker.postMessage({ type: 'pause', timestamp: performance.now() });
    } else {
      this.worker.postMessage({ type: 'resume', timestamp: performance.now() });
    }
  }

  start() {
    if (!this.worker) {
      this.worker = createWorker(webWorker);
    }
    document.addEventListener('visibilitychange', this.handleVisibilityChange, false);
    this.worker.postMessage({ type: 'start', timestamp: performance.now() });
    this.worker.addEventListener('message', this.receiver);
    this.callback();
  }

  stop() {
    if (this.id !== null) {
      window.cancelAnimationFrame(this.id);
      this.id = null;
    }
    if (this.worker) this.worker.postMessage({ type: 'stop', timestamp: performance.now() });
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  on(start, end, subscriber) {
    this.subscriptions.push({ subscriber, start, end });
    let registered = true;
    return () => {
      if (!registered) return;
      this.subscriptions = this.subscriptions.filter(
        config => config.start !== start || config.end !== end || config.subscriber !== subscriber,
      );
      registered = false;
    };
  }
}

export default Detector;
