export class BarcodeDecodeResult {

  constructor(value = '', format ='') {
    this.rawValue = value;
    this.format   = format;
  }

  update() {
    let p  = this.cornerPoints,
        wx = p[1].x - p[0].x,
        wy = p[1].y - p[0].y,
        hx = p[3].x - p[0].x,
        hy = p[3].y - p[0].y;

    this.angle  = Math.atan2(wy, wx);
    this.width  = Math.max(Math.sqrt(wx * wx + wy * wy) || this.boundingBox.width);
    this.height = Math.max(Math.sqrt(hx * hx + hy * hy) || this.boundingBox.height);
    this.x      = this.cornerPoints[0].x;
    this.y      = this.cornerPoints[0].y;
  }

  boundingBox = {
    x      : 0, y      : 0,
    width  : 0, height : 0,
    top    : 0, right  : 0,
    bottom : 0, left   : 0
  };

  cornerPoints = [
    {x: 0, y: 0}, 
    {x: 0, y: 0}, 
    {x: 0, y: 0}, 
    {x: 0, y: 0}
  ];

  format   = '';
  rawValue = '';
  x        = 0;
  y        = 0;
  angle    = 0;
  width    = 0;
  height   = 0;

  static fromZXingReadResult(zxingReadResult) {

    let decodeResult = new BarcodeDecodeResult(
      zxingReadResult.text, 
      zxingReadResult.format
    ),

    p    = zxingReadResult.position,
    minX = Math.min(p.topLeft.x, p.topRight.x, p.bottomRight.x, p.bottomLeft.x),
    maxX = Math.max(p.topLeft.x, p.topRight.x, p.bottomRight.x, p.bottomLeft.x),
    minY = Math.min(p.topLeft.y, p.topRight.y, p.bottomRight.y, p.bottomLeft.y),
    maxY = Math.max(p.topLeft.y, p.topRight.y, p.bottomRight.y, p.bottomLeft.y);

    decodeResult.cornerPoints[0] = p.topLeft;
    decodeResult.cornerPoints[1] = p.topRight;
    decodeResult.cornerPoints[2] = p.bottomRight;
    decodeResult.cornerPoints[3] = p.bottomLeft;

    decodeResult.boundingBox.x       = minX;
    decodeResult.boundingBox.y       = minY;
    decodeResult.boundingBox.left    = minX;
    decodeResult.boundingBox.top     = minY;
    decodeResult.boundingBox.right   = maxX;
    decodeResult.boundingBox.bottom  = maxY;
    decodeResult.boundingBox.width   = maxX - minX;
    decodeResult.boundingBox.height  = maxY - minY;

    return decodeResult;
  }

  setCornerPoints(cornerPoints) {
    let cps  = cornerPoints,
        minX = Math.min(cps[0].x, cps[1].x, cps[2].x, cps[3].x),
        minY = Math.min(cps[0].y, cps[1].y, cps[2].y, cps[3].y),
        maxX = Math.max(cps[0].x, cps[1].x, cps[2].x, cps[3].x),
        maxY = Math.max(cps[0].y, cps[1].y, cps[2].y, cps[3].y);

    this.cornerPoints = cornerPoints;
    this.boundingBox  = DOMRectReadOnly.fromRect({
      x      : minX,
      y      : minY,
      width  : maxX - minX,
      height : maxY - minY
    });
  }

}