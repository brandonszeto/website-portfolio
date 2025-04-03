export function addPoint(event, ctx, points) {
  let x = event.offsetX;
  let y = event.offsetY;
  points.push({ x, y });
  drawPoint(ctx, x, y);
}

export function drawPoint(ctx, x, y) {
  // Drawing black outline
  ctx.fillStyle = "rgb(66, 66, 66)";
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.closePath();
}

export function reset(canvas, ctx, points) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  points.length = 0;
}
