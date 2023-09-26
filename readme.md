## Description

This library adds an abstraction above the original [`BarcodeDetector`](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API) object that will call it via a web worker internally. If the `BarcodeDetector` is not available in the browser or the platform, a version of [ZXingCPP WASM](https://github.com/nu-book/zxing-cpp) is used.

## Example

Demo: https://kevinblt.github.io/barcode_detector/test/

Include the library `lib/barcode_detector.js` as a script, so
that it runs before any code using `BarcodeDetector`.
Please import it as a module are use `<script type="module">`.

The original BarcodeDetector class will be overriden and a worker will
be used in the background. The worker itself will use the original API
or use ZXING with wasm. Either will run in the worker and free the main thread.

```javascript
const barcodeDetector = new BarcodeDetector();
const detectedTexts   = await barcodeDetector.detect(document.querySelector('img'));

for (let e of detectedTexts) {
  console.log(e.rawValue);
}
```

There are some additions to the original API, like the following:

```javascript
const barcodeDetector = new BarcodeDetector();

// Get an async iterator detecting from camera stream (this is not included in the official version)
for await (const e of barcodeDetector.detectFromCamera(document.querySelector('video'))) {

  // The following properties art only in this version and contain additional information
  console.log(e._decodeDuration);  // The duration of the decoding in ms
  console.log(e._decoder);         // 'native' | 'zxing'

  for (const d of e.detectedTexts) {
    console.log(e.rawValue);
  }

}
```


## Credits

- ZXING: https://github.com/nu-book/zxing-cpp (wasm version)
