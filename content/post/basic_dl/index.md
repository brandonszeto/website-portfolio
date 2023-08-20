---
author : "Brandon Szeto"
title : "My First Neural Net"
date : "2023-08-18"
description : "Understanding the PyTorch deep learning framework using the
CIFAR-10 dataset."
tags : [
    "python",
    "pytorch",
]
categories : [
    "misc",
    "ai",
]
image : ""
math: true
toc: true
draft: true
---

## Introduction

Recently, products like ChatGPT, Tesla's Autopilot, and Stable Diffusion, have
proven to the world the powerful applications of artificial intelligence and
deep learning. This reflects a paradigm shift in the way we approach problems, a
shift torwards what Andrej Karpathy describes as 
[Software 2.0](https://karpathy.medium.com/software-2-0-a64152b37c35). Part of
this process includes the emergence of deep learning frameworks like PyTorch
that provide the tools, libraries, and algorithms needed to design, train, and
deploy neural networks and various machine learning models. 

If you are anything
like me, you are eager to start building something with a tool as soon as
possible. But this is no easy task, as PyTorch abstracts many layers of
mathematical complexity from the user (which both simplifies its use but
decreases our understanding of what goes on under the hood). So in this blog,
I want to first build
something using PyTorch from a big-picture perspective before zooming into the
theory and functionality of each component. 

## Why PyTorch?
Of the existing deep learning frameworks, PyTorch and TensorFlow are usually
what comes to mind. However, the main advantage of PyTorch comes from its 
dynamic computation graph, which allows for more flexibility and intuition
(which is especially helpful in undersanding deep learning). This isn't to say
TensorFlow is objectively worse. Like the differences between an inteperated
language and a compiled language, TensorFlow's static computation graph lends
itself to make optimizations and increase performance due to pre-compilation.
This is especially helpful for large-scale deployments. But for now, we will
only focus on PyTorch as we learn.

## Getting Started
Like any other Python package, we can simply install PyTorch by running

```python
pip install torch torchvision
```

Alternatively, PyTorch can be downloaded from the
[official PyTorch website](https://pytorch.org/get-started/locally/) to choose a
specific installation.

`torch` is PyTorch itself and `torchvision` is a package created by the PyTorch project with
popular datasets, model architectures, and common image transformations for
computer vision. From torchvision, we will use the 
[CIFAR-10 dataset](https://en.wikipedia.org/wiki/CIFAR-10) to train a simple
image-recognition model.

In a new Python file, we can import the necessary packages:

```python
import matplotlib.pyplot as plt
import numpy as np

import torch
import torchvision

import torchvision.transforms as transforms

import torch.nn as nn
import torch.nn.functional as F

import torch.optim as optim
```

First, we import `matplotlib` and `numpy`, commonly-used libraries to aid us in
computing and visualizing data. Next, we import `torch` and `torchvision` which
correspond to PyTorch and the Torchvision libraries respectively. The remainder
of our imports are simply aliases for PyTorch sublibraries.

## Tensors
In mathematics, tensors are simply a matrix in three or more dimensions. PyTorch
simply extends the definition of a tensor as a Python object in the `torch.Tensor`
class. If you are familiar with NumPy, this can be thought of as an ndarray
(N-dimensional array) with additional helpful attributes and functionality. In
fact, NumPy ndarrays and PyTorch tensors are highly compatible.

### Attributes
Tensor attributes include their shape, datatype, and the device on which they
are stored.
- `tensor.shape` refers to the dimensionality of the tensor. For example, a
  tensor with `torch.Size([3,4])` would be a 3x4 matrix.
- `tensor.dtype` refers to the corresponding datatype (int, float32, etc.)
- `tensor.device` refers to which device (GPU, CPU) the tensor is stored on.
  This is important for data parallelism and as a result, faster compute.

### Operations
A comprehensive list of tensor operators (transposing, indexing, slicing, etc.)
can be found [here](https://pytorch.org/docs/stable/torch.html). PyTorch tensors
support typical matrix operations like addition and multiplication and different
ways to initialize them. As an example, some basic operations may look like:

```python
t = torch.ones(3) # Creates a 3x1 matrix of ones
new_t = t.add(5)  # Adds 5 to each number in the matrix
```

One feature to be aware of is the special in-place suffix `_`. Rather than
storing the result of the operation in a separate copy, the tensor is edited
in-place. For example:

```python
t = torch.ones(3) # Creates a 3x1 matrix of ones
new_t = t.add_(5) # Adds 5 to each number in the matrix
```
In this case, we have `t = new_t = tensor([6., 6., 6.,])` whereas previously, we
had `t = tensor([1., 1., 1.,])` and `new_t = tensor([6., 6., 6.,])`.

## Neural Networks
Now to the interesting part: actually building a neural network! Neural netowrks
can be constructed using the `torch.nn` package. Just a brief overview of 

## Backpropagation and Forward-propagation

## Bringing everything together

## Conclusion
