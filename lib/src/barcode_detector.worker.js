import { BarcodeDecodeResult } from './barcode_decode_result.js';

class BarcodeDetectorWorker {
  
  static async start() {

    if (! ('BarcodeDetector' in self) || (await BarcodeDetector.getSupportedFormats()).length == 0) {
      BarcodeDetector = (await import('./zxing/zxing_barcode_detector.js')).BarcodeDetector;
      
      await BarcodeDetector.initilize();
      self.BarcodeDetector  = BarcodeDetector;
    }

    const formats         = await BarcodeDetector.getSupportedFormats(),
          barcodeDetector = new BarcodeDetector({formats: formats});
  
    self.addEventListener('message', async (messageEvent) => {
      let id      = messageEvent.data.id,
          time    = messageEvent.data.time,
          decoder = BarcodeDetector.zxing ? 'zxing' : 'native',
          result;

      if (messageEvent.data.method == 'detect') {

        let buffer  = new ImageData(
          new Uint8ClampedArray(messageEvent.data.buffer), 
          messageEvent.data.size.width  || Math.sqrt(messageEvent.data.buffer.byteLength) / 2,
          messageEvent.data.size.height || Math.sqrt(messageEvent.data.buffer.byteLength) / 2
        )
        
        result = await barcodeDetector.detect(buffer);

        for (let e of result) {
          let sx = 1 / messageEvent.data.size.scaleX, 
              sy = 1 / messageEvent.data.size.scaleY;
         
          for (let c of e.cornerPoints) {
            c.x *= sx;
            c.y *= sy;
          }

          BarcodeDecodeResult.prototype.update.call(e);
          BarcodeDecodeResult.prototype.setCornerPoints.call(e, e.cornerPoints);
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