class _BarcodeDetector {
  static zxing;

  _decoder;

  constructor() {
    this._decoder = _BarcodeDetector.zxing;
  }

  async detect(imageData) {

    return new Promise((resolve, reject) => {
      let buffer = imageData.data,
          memory = this._decoder._malloc(buffer.byteLength);

      this._decoder.HEAPU8.set(buffer, memory);

      var decodeResult = this._decoder.readBarcodeFromPixmap(
        memory, imageData.width, imageData.height, true, ''
      );

      this._decoder._free(memory);

      if (decodeResult.text && !decodeResult.error) {
        decodeResult = BarcodeDecodeResult.fromZXingReadResult(decodeResult);

        decodeResult.update();

        return resolve([decodeResult]);
      }

      return resolve([]);
    });

  }
  
  static async initilize() {
    importScripts('zxing/zxing_reader.js');

    _BarcodeDetector.zxing = await ZXing();
  }

  static async getSupportedFormats() {
    return [
      'aztec',       'code_128', 'code_39', 'code_93', 'pdf417', 
      'data_matrix', 'ean_13',   'ean_8',    'itf',    'qr_code', 'upc_e'
    ];
  }

}
