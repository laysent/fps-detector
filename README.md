# FPS Detector

Provides utility to detect FPS on current page, and gets notified when fps meets defined range.

# Example

```javascript
import Detector from 'fps-detector';

const detector = new Detector();
detector.on('0-10', () => console.log('callback here'));
detector.start();
detector.end();
```