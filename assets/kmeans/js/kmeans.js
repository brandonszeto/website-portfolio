import { euclideanDistance } from "./utils.js";
import {
  drawVoronoi,
  drawPoint,
  drawCentroid,
  getCentroidColor,
} from "./draw.js";

export function runKMeans(canvas, ctx, centroids, points) {
  if (centroids.length === 0) {
    alert("Please add at least one centroid.");
    return;
  }

  let clusters = new Array(centroids.length).fill(null).map(() => []);
  for (let i = 0; i < points.length; i++) {
    let minDist = Infinity;
    let closestCentroid = -1;
    for (let j = 0; j < centroids.length; j++) {
      let dist = euclideanDistance(
        points[i].x,
        points[i].y,
        centroids[j].x,
        centroids[j].y,
      );
      if (dist < minDist) {
        minDist = dist;
        closestCentroid = j;
      }
    }
    clusters[closestCentroid].push(points[i]);
  }

  for (let i = 0; i < centroids.length; i++) {
    if (clusters[i].length > 0) {
      let sumX = 0;
      let sumY = 0;
      for (let j = 0; j < clusters[i].length; j++) {
        sumX += clusters[i][j].x;
        sumY += clusters[i][j].y;
      }
      centroids[i].x = sumX / clusters[i].length;
      centroids[i].y = sumY / clusters[i].length;
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawVoronoi(canvas, ctx, centroids, 1);

  points.forEach((point) => drawPoint(ctx, point.x, point.y));
  centroids.forEach((centroid, index) =>
    drawCentroid(ctx, centroid.x, centroid.y, getCentroidColor(index)),
  );

  console.log("K-means iteration completed.");
}
