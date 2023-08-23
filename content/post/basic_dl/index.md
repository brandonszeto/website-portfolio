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
draft: false
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
from torch.utils.data import DataLoader

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
fact, NumPy ndarrays and PyTorch tensors are highly compatible. Since everything
in PyTorch relies on tensors, it is important to be familiar with them.

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
In this example, we have `t = new_t = tensor([6., 6., 6.,])` whereas previously, we
had `t = tensor([1., 1., 1.,])` and `new_t = tensor([6., 6., 6.,])`.

One of the most important PyTorch tensor operations is `requires_grad()`. This
tells PyTorch that a tensor requires a gradient, and thus PyTorch records all
operations done to the tensor so that it can calculate the gradient during
back-propagation *automatically*!

## Neural Networks
Now to the interesting part: actually building a neural network! Neural networks
can be constructed using the `torch.nn` package. Other modules and classes that
help with the creating and training of neural networks include `torch.optim`, 
`DataSet`, and `DataLoader`. But to understand what the `torch.nn` package is
actually doing, let's first built a neural net from scratch using nothing but 
PyTorch tensor operations.

### Step 1: Loading a dataset
Two of the most commonly used benchmark datasets in the field of machine
learning and computer vision are the *CIFAR-10* and *MNIST* datasets. CIFAR-10
is a dataset of 60,000 32x32 colored images. The dataset is widely used for
tasks like image classification and object recognition. MNIST is a collection 
of 70,000 grayscale images of handwritten images. It's a simple dataset first
used to demonstrate various image processing and machine learning techniques.

Conveniently, both datasets can be loaded from PyTorch's `torchvision` library.
The following is an example of how to load the CIFAR10 dataset. Just as a
reminder, we have made the following imports above:

```python
import torch
import torchvision
import torchvision.transforms as transforms
from torch.utils.data import DataLoader
```

Let's first understand the `torchvision.transforms` module. The `transforms`
module provides functions to apply various transformations to images, making
them suitable for training and testing machine learning models. 
```python
transfrom = transforms.Compose(
            [transforms.ToTensor(),
            transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))])
```
Here, we are using the `Compose()` function to chain together multiple
transformations into a single pipeline. `transforms.ToTensor()` converts the
image data to PyTorch tensors while normalizing the pixel values to the range
[0,1]. `transforms.Normalize()` normalizes the tensor values of
the dataset with mean `(0.5, 0.5, 0.5)` and standard deviation `(0.5, 0.5, 0.5)`.
Altogether, we first normalize the 8-bit color data of each channel from [0,255]
to [0,1]. We then subtract the mean (0.5) from each color channel to center the pixel
values around zero. Lastly, we divide the standard deviation (0.5) to make the
new range [-1, 1], rather than [-.5, .5]  ($\frac{x}{.5} = 2x$).

For example, the normalization of the MNIST dataset would look only a little
different. We have:
```python
transfrom = transforms.Compose(
            [transforms.ToTensor(),
            transforms.Normalize((0.5), (0.5))])
```
This is because the MNIST dataset is grayscale so normalization must only be
performed on one channel.

Now, we will use `DataSet` and `DataLoader` to load training and test data.
`DataSet` is an abstraction that represents a collection of data samples. It
provides an interface to access individual data samples and their labels and can
be used to create a custom dataset. `DataLoader` is a utility class in PyTorch 
that wraps a dataset and provides an iterable over batches of data. 

To get started, let's first declare the batch size for the training and testing
data loaders. This is the number of images or data samples that will be loaded
in each iteration during training.

```python
batch_size = 64
```

We can create a `DataSet` object for the CIFAR-10 training set with the
following:
```python
train_dataset = torchvision.datasets.CIFAR10(root='./data', train=True, transform=transform, download=True)
```
Here, `root` specifies the directory where the data will be downloaded and
stored. In this case, data will be stored in the `./data` directory. `train=True` indicates that this dataset is for training. `transform=transform` applies the transformations we defined earlier (converting to tensor and normalization) to the data.
```python
train_loader = DataLoader(dataset=train_dataset, batch_size=batch_size, shuffle=True)
```
Here, we create a `DataLoader` using our recently created `train_dataset`.
`batch_size=batch_size` specifies the number of samples in each batch.
`shuffle=True` means that the data will be shuffled before each epoch to improve
training. `num_workers=2` sets the number of worker threads to load data in
parallel, which can improve data loading speed.

We can perform the same operations to create another `DataLoader` object for the
test set.

```python
test_dataset = torchvision.datasets.CIFAR10(root='./data', train=False, transform=transform, download=True)
test_loader = DataLoader(dataset=test_dataset, batch_size=batch_size, shuffle=False)
```

Keep in mind, this is only one way to load data (specifically, we used the
`torchvision` library). There are many ways to load data, but in order to take
advantage of the `DataSet` and `DataLoader` libraries, we would need to ensure
our custom dataset adheres to the structure expected by PyTorch's data loading
utilities.

## Backpropagation and Forward-propagation

## Bringing everything together

## Conclusion
