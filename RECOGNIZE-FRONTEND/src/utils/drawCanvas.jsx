import { drawRectangles } from './drawRectangles';

export function drawCanvas(
  ctx,
  image,
  coordinates,
  scaleX,
  scaleY,
  width,
  height,
  opacity = 0.5,
  previewRect = null
) {
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  drawRectangles(ctx, coordinates, scaleX, scaleY, opacity);

  if (previewRect) {
    const { upper_left, lower_right } = previewRect;
    const x  = upper_left.x * scaleX;
    const y  = upper_left.y * scaleY;
    const w  = (lower_right.x - upper_left.x) * scaleX;
    const h  = (lower_right.y - upper_left.y) * scaleY;
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    ctx.fillRect(x, y, w, h);
  }
}
