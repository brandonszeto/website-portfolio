export function drawPoint(ctx, x, y, color = 'black', radius = 5) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  // Fill with translucent color
  ctx.fillStyle = getTranslucentColor(color, 0.3); // 0.3 is the alpha value for translucency
  ctx.fill();

  // Draw solid perimeter
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// Helper to convert a color to rgba with alpha
function getTranslucentColor(color, alpha) {
  // Basic support for named colors and hex
  const temp = document.createElement("div");
  temp.style.color = color;
  document.body.appendChild(temp);

  const computed = getComputedStyle(temp).color;
  document.body.removeChild(temp);

  // Extract rgb from computed color
  const rgbMatch = computed.match(/\d+/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    const [r, g, b] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Fallback
  return color;
}
