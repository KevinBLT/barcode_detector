## Description

This library adds an abstraction above the original [`BarcodeDetector`](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API) object that will call it via a web worker internally. If the `BarcodeDetector` is not available in the browser or the platform, a version of [ZXingCPP WASM](https://github.com/nu-book/zxing-cpp) is used.

## Example

Demo: https://kevinblt.github.io/barcode_detector/test/

Include the library `lib/barcode_detector.js` as a script, so
that it runs before any code using `BarcodeDetector`.

```javascript
let barcodeDetector  = new BarcodeDetector();
let detectedTexts    = await barcodeDetector.detect(document.querySelector('img'));

for (let e of detectedTexts) {
  console.log(e.rawValue);
}
```

There are some additions to the original API.

See the following:

```javascript

// Get an async iterator detecting from camera stream
barcodeDetector.detectFromCamera(videoElement, scansPerSecondLimit = 0); 

barcodeDetector.minSize; // The min size used for images, scaled up   if needed
barcodeDetector.maxSize; // The min size used for images, scaled down if exceeded

console.log(e._decodeDuration);  // The duration of the decoding in ms
console.log(e._decoder);         // 'native' | 'zxing'

for (let e of detectedTexts) {
  console.log(e.angle); // The angle of the rect
}

```


## Credits

- ZXING: https://github.com/nu-book/zxing-cpp (wasm version)
