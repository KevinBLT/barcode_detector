import { BarcodeDecodeResult } from '../barcode_decode_result.js';
import { ZXing }               from './zxing_reader.js';

export class BarcodeDetector {
  static zxing;

  #decoder;

  constructor() {
    this.#decoder = BarcodeDetector.zxing;
  }

  async detect(imageData) {

    return new Promise((resolve) => {
      let buffer = imageData.data,
          memory = this.#decoder._malloc(buffer.byteLength);

      this.#decoder.HEAPU8.set(buffer, memory);

      var decodeResult = this.#decoder.readBarcodeFromPixmap(
        memory, imageData.width, imageData.height, true, ''
      );

      this.#decoder._free(memory);

      if (decodeResult.text && !decodeResult.error) {
        decodeResult = BarcodeDecodeResult.fromZXingReadResult(decodeResult);

        decodeResult.update();

        return resolve([decodeResult]);
      }

      return resolve([]);
    });

  }
  
  static async initilize() {
    BarcodeDetector.zxing = await ZXing();
  }

  static async getSupportedFormats() {
    return [
      'aztec',       'code_128', 'code_39', 'code_93', 'pdf417', 
      'data_matrix', 'ean_13',   'ean_8',    'itf',    'qr_code', 'upc_e'
    ];
  }

}
