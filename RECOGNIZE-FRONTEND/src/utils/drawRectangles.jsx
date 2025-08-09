export function drawRectangles(ctx, coordinates, scaleX, scaleY, opacity) {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return;
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  for (const rect of coordinates) {
    const { upper_left, lower_right } = rect;
    const x  = upper_left.x * scaleX;
    const y  = upper_left.y * scaleY;
    const w  = (lower_right.x - upper_left.x) * scaleX;
    const h  = (lower_right.y - upper_left.y) * scaleY;
    ctx.fillRect(x, y, w, h);
  }
}
