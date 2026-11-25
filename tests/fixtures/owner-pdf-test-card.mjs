// Test-only, programmatically generated checkerboard. No source image or human signature.
import { encode as encodePng } from "fast-png";
import jpeg from "jpeg-js";

export function testCard(format = "png") {
  const width = 104, height = 27;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data.set(((Math.floor(x / 8) + Math.floor(y / 8)) % 2)
        ? [45, 20, 130, 255] : [210, 200, 241, format === "png" ? 0 : 255], (y * width + x) * 4);
    }
  }
  return Buffer.from(format === "png" ? encodePng({width, height, data, channels: 4}) : jpeg.encode({width, height, data}, 82).data);
}
