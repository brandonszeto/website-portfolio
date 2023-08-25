---
author : "Brandon Szeto"
title : "Marching Cubes"
date : "2023-08-11"
description : "Visualizing the marching cubes algorithm in Unity 3D (and
optimizing it on the GPU)."
tags : [
    "unity",
    "c#",
]
categories : [
    "gpu",
]
image : ""
math: true
toc: true
draft: true
---

## Introduction
The Marching Cubes algorithm is a fundamental technique for extracting
and rendering surfaces given volumetric data. It was first introduced in 1987 by
Lorenson and Cline as part of their 
[research at General Electric](https://people.eecs.berkeley.edu/~jrs/meshpapers/LorensenCline.pdf),
where the main purpose of the algorithm was to render 3D medical data (CT, MRI,
SPECT) to aid physicians in better understanding the anatomy of the human body.
Today, it is a widely used technique in computer graphics.

## How does it work?
The core idea behind Marching Cubes is quite elegant. Here is a simplified
explanation:

1. **Divide and Conquer**: First, the 3D space we want to render is divided into
   many small cubes.
2. **Evaluate the Vertices**: For each cube, the value of each corner vertex is
   checked against some threshold (a scalar like tissue density, pressure,
   temperature)
3. **Find the Edges**: If the value is above the threshold, the vertex is considered
   "inside" the surface, otherwise it is considered "outside." The surface must
   pass through edges between inside and outside corners.
4. **Create Triangles**: Afer knowing which edges are intersected, triangles can be
   formed to approximate the surface within the cube.
5. **March**: Now we must repeat the process for every cube/voxel in our 3D space,
   resulting in a continuous surface.

## Rendering
To help us visualize how the algorithm works under the hood, let's take a look
at the algorithm in action over a single voxel. A voxel is a volumetric pixel,
with exta data (like a pixel in three-dimensional space). By convention, let's
label the vertices and edges of the voxel as follows:



## Conclusion:
### Resources
- https://people.eecs.berkeley.edu/~jrs/meshpapers/LorensenCline.pdf
- http://paulbourke.net/geometry/polygonise/
- https://en.wikipedia.org/wiki/Marching_cubes
