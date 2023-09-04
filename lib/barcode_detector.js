class BarcodeDetector {
  static libPath;
  
  static #pending = new Map();
  static #worker;
  static #ready;

  minSize  = 512;
  maxSize  = 2048;
  
  #cancel  = false;

  constructor(options) {
    Object.assign(this, options);
    
    BarcodeDetector.initilize();
  }

  static async initilize() {
    
    if (BarcodeDetector.#ready) {
      return BarcodeDetector.#ready;
    }
    
    if (import.meta) {
      BarcodeDetector.#worker = new Worker(new URL('./src/barcode_detector.worker.js', import.meta.url), { type: 'module' });
    } else {
      throw 'Please import/include \'BarcodeDetector\' as a module, importing from another module or add \'type="module"\' to the script tag.';
    }

    BarcodeDetector.#ready = new Promise(
      (resolve) => BarcodeDetector.#worker.addEventListener('message', resolve, {once: true})
    );

    await BarcodeDetector.#ready;

    BarcodeDetector.#worker.addEventListener('message', (messageEvent) => {
      let id     = messageEvent.data.id,
          time   = new Date(),
          data   = messageEvent.data,
          result = data.result;
  
      if (BarcodeDetector.#pending.has(id)) {
        result._decodeDuration = time - data.time;
        result._decoder        = data.decoder;
  
        BarcodeDetector.#pending.get(id).resolve(result);
  
        BarcodeDetector.#pending.delete(id);
      }
    });

    return BarcodeDetector.#ready;
  }

  async * detectFromCamera(video, scansPerSecondLimit = 0) {
    await BarcodeDetector.initilize();

    this.#cancel = false;

    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }), 
          self   = this, 
          minMs  = 1000 / (scansPerSecondLimit || 1000);

    video.srcObject = stream;
    video.setAttribute('playsinline', true);
    video.play();
  
    await new Promise((resolve) => video.addEventListener('play', resolve, { once: true }));
    
    while (true) {    
      const scanResult   = await self.detect(video),
            scanDuration = scanResult._decodeDuration;

      if (this.#cancel) {
        this.#cancel = true;

        break;
      }
          
      yield scanResult;

      if (minMs > scanDuration) {
        await new Promise(
          (r) => setTimeout(r, minMs - scanDuration)
        );
      }
    }

    video.pause();

    const tracks = stream.getTracks();
    
    for (const track of tracks) {
      stream.removeTrack(track);
    }

  }

  cancel() {
    this.#cancel = true;
  }

  async detect(image) {
    await BarcodeDetector.initilize();

    const id   = BarcodeDetector.#id, 
          time = BarcodeDetector.#time;
    
    return new Promise((resolve, reject) => {
      let canvas = document.createElement('canvas'),
          ctx    = canvas.getContext('2d'),
          size   = this._imageSize(image),
          width  = size.width,
          height = size.height,
          buffer = new ArrayBuffer(64);

      if (image instanceof ImageData) {
        buffer = image.data.buffer;
        size   = {width: image.width, height: image.height, scaleX: 1, scaleY: 1};
      } else if (width > 0 && height > 0) {
        canvas.width  = width;
        canvas.height = height;

        ctx.drawImage(image, 0, 0, width, height);

        buffer = ctx.getImageData(0, 0, width, height).data.buffer;
      }

      BarcodeDetector.#pending.set(id, { resolve, reject });

      BarcodeDetector.#worker.postMessage({ buffer, id, time, size, method: 'detect' }, [ buffer ]);
    });

  }

  static get #id()   { return Math.round(Math.random() * 10000000); }
  static get #time() { return (new Date()).valueOf(); }

  _imageSize(img) {
    let w   = img.videoWidth  || img.naturalWidth  || img.width  || 0,
        h   = img.videoHeight || img.naturalHeight || img.height || 0,
        nw  = w, 
        nh  = h;

    if (h > 0 && w > 0) {
      if (w > h) {
        nw = Math.max(this.minSize, Math.min(this.maxSize, w));
        nh = Math.max(this.minSize, Math.min(this.maxSize, nw * (h / w)));
      } else {
        nh = Math.max(this.minSize, Math.min(this.maxSize, h));
        nw = Math.max(this.minSize, Math.min(this.maxSize, nh * (w / h)));
      } 
    }

    return { 
      width: Math.ceil(nw), height: Math.ceil(nh), 
      scaleX: nw / w,       scaleY: nh / h 
    };
     
  }
  
  static async getSupportedFormats() {
    const id   = BarcodeDetector.#id, 
          time = BarcodeDetector.#time;

    await BarcodeDetector.initilize();

    return new Promise((resolve, reject) => {
      BarcodeDetector.#pending.set(id, { resolve, reject });

      BarcodeDetector.#worker.postMessage({ id, time, method: 'getSupportedFormats' });
    });
  }

}

window.BarcodeDetector     = BarcodeDetector;
globalThis.BarcodeDetector = BarcodeDetector;
self.BarcodeDetector       = BarcodeDetector;