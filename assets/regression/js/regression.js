export function runRegression(canvas, ctx, points) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (points.length < 2) {
    console.error("Not enough points to run regression for red points.");
    return;
  }
  
  // Example: Calculate regression line (redPoints)
  const { slope, intercept } = calculateLinearRegression(points);

  // Draw regression line
  const startX = 0;
  const startY = slope * startX + intercept;
  const endX = canvas.width / 2; // Adjust for scaling
  const endY = slope * endX + intercept;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Helper function to calculate linear regression
function calculateLinearRegression(points) {
  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}
