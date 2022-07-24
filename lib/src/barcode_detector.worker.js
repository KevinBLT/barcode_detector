
class BarcodeDetectorWorker {
  
  static async start() {
    importScripts('barcode_decode_result.js');

    if (! ('BarcodeDetector' in self) || (await BarcodeDetector.getSupportedFormats()).length == 0) {
      importScripts('zxing/zxing_barcode_detector.js');
      
      await _BarcodeDetector.initilize();
      self.BarcodeDetector  = _BarcodeDetector;
      self._BarcodeDetector = true;
    }

    const formats         = await BarcodeDetector.getSupportedFormats(),
          barcodeDetector = new BarcodeDetector({formats: formats});
  
    self.addEventListener('message', async (messageEvent) => {
      let id      = messageEvent.data.id,
          time    = messageEvent.data.time,
          decoder = self._BarcodeDetector ? 'zxing' : 'native',
          result;

      if (messageEvent.data.method == 'detect') {

        let buffer  = new ImageData(
          new Uint8ClampedArray(messageEvent.data.buffer), 
          messageEvent.data.width  || Math.sqrt(messageEvent.data.buffer.byteLength) / 2,
          messageEvent.data.height || Math.sqrt(messageEvent.data.buffer.byteLength) / 2
        )
        
        result = await barcodeDetector.detect(buffer);

        for (let e of result) {
          BarcodeDecodeResult.prototype.update.call(e);
        }

      } else if (messageEvent.data.method == 'getSupportedFormats') {
        result = await BarcodeDetector.getSupportedFormats();
      }

      self.postMessage({ result, id, time, decoder });
    });
  
    self.postMessage({ id: 0, decodeResult: 'Ready' });
  }

}

BarcodeDetectorWorker.start();