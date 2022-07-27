class _BarcodeDetector {
  static worker;
  static pending = new Map();
  static libPath = document.querySelector('[src$="barcode_detector.js"]').src.replace('barcode_detector.js','');
  static ready;

  constructor() {
    _BarcodeDetector.initilize();
  }

  static async initilize() {
    if (_BarcodeDetector.ready) return _BarcodeDetector.ready;

    _BarcodeDetector.worker = new Worker(_BarcodeDetector.libPath + 'src/barcode_detector.worker.js');
    _BarcodeDetector.ready  = new Promise(
      (resolve) => _BarcodeDetector.worker.addEventListener('message', resolve, {once: true})
    );

    await _BarcodeDetector.ready;

    _BarcodeDetector.worker.addEventListener('message', (messageEvent) => {
      let id     = messageEvent.data.id,
          time   = new Date(),
          data   = messageEvent.data,
          result = data.result;
  
      if (_BarcodeDetector.pending.has(id)) {
        result._decodeDuration = time - data.time;
        result._decoder        = data.decoder;
  
        _BarcodeDetector.pending.get(id).resolve(result);
  
        _BarcodeDetector.pending.delete(id);
      }
    });

    return _BarcodeDetector.ready;
  }

  async detectFromCamera(video, scansPerSecondLimit = 0) {
    await _BarcodeDetector.initilize();

    let stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: "environment" } 
    }), 
    streamRunning = true, 
    self          = this, 
    minMs         = 1000 / (scansPerSecondLimit || 1000);

    video.srcObject = stream;
    video.setAttribute('playsinline', true);
    video.play();
  
    await new Promise(
      (resolve) => video.addEventListener('play', resolve, {once: true})
    );
    
    return new ReadableStream({
      async start(controller) {
        while (streamRunning) {    
          let scanResult   = await self.detect(video),
              scanDuration = scanResult._decodeDuration;
              
          controller.enqueue(scanResult);

          if (minMs > scanDuration) {
            await new Promise(
              (r) => setTimeout(r, minMs - scanDuration)
            );
          }

        }
      },
      cancel() {
        streamRunning = false;

        controller.close();
      }
    }).getReader();
  }

  async detect(image) {
    await _BarcodeDetector.initilize();

    let id = _BarcodeDetector._id, time = _BarcodeDetector._time;
    
    return new Promise((resolve, reject) => {
      let canvas = document.createElement('canvas'),
          ctx    = canvas.getContext('2d'),
          width  = image.videoWidth  || image.naturalWidth  || image.width  || 0,
          height = image.videoHeight || image.naturalHeight || image.height || 0,
          buffer = new ArrayBuffer(64);

      if (width > 0 && height > 0) {
        canvas.width  = width;
        canvas.height = height;

        ctx.drawImage(image, 0, 0, width, height);

        buffer = ctx.getImageData(0, 0, width, height).data.buffer;
      }

      _BarcodeDetector.pending.set(id, { resolve, reject });

      _BarcodeDetector.worker.postMessage({ buffer, id, time, width, height, method: 'detect' }, buffer);
    });

  }

  static get _id()   { return Math.round(Math.random() * 10000000); }
  static get _time() { return (new Date()).valueOf(); }
  
  static async getSupportedFormats() {
    let id = _BarcodeDetector._id, time = _BarcodeDetector._time;

    await _BarcodeDetector.initilize();

    return new Promise((resolve, reject) => {
      _BarcodeDetector.pending.set(id, { resolve, reject });

      _BarcodeDetector.worker.postMessage({ id, time, method: 'getSupportedFormats' });
    });
  }

}

BarcodeDetector = _BarcodeDetector;