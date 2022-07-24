This library adds an abstraction above the original [`BarcodeDetector`](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API) object
that will call it via a web worker internally. If the `BarcodeDetector` is not available
in the browser or the platform, a version of [ZXingCPP WASM](https://github.com/nu-book/zxing-cpp) is used.