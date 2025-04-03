---
author : "Brandon Szeto"
title : "Linear Methods"
date : "2024-12-18"
description: "An interactive demo on linear regression and study based on chapters 3 and 4 of Elements of Statistical Learning and section 4.3 of Introduction to Linear Algebra."
math: true
toc: false
readingtime: false
draft: true
tags: ["ESL"]
---

Linear methods typically provide an adequate and interpretable description of how inputs relate to output. Understanding them is key to understanding fancier, nonlinear methods, where results are not as interpretable. As such, the goal of this article is to thoroughly explain the fundamentals of linear methods. 

### The problem
We are given a dataset consisting of 
- A set of input vectors $\bm{a_1}, \bm{a_2}, ..., \bm{a_m} \in \mathbb{R}^{n}$ organized in a matrix  of inputs $\bm{A} = \begin{bmatrix} \bm{a}_1 & \bm{a}_2 & \cdots & \bm{a}_m \end{bmatrix}^\top \in \mathbb{R}^{m \times n}$.
- A corresponding output vector $\bm{b} \in \mathbb{R}^{m}$, where the $m^{th}$ entry of $\bm{b}$ corresponds to the output associated with the $m^{th}$ input vector $\bm{a}_m$).

Our goal is to find a coefficient vector $\bm{x} \in \mathbb{R}^{n}$ such that
the linear relationship

$$
\begin{aligned}
\sum_{j = 1}^m \bm{a_j} x_j &= \bm{b} \\\
\bm{Ax} &= \bm{b}
\end{aligned}$$

is satisfied. But what is the significance of $\bm{x}$?

### Motivation

{{< collapsible title="Practical Motivation" >}}
{{< /collapsible >}}

{{< collapsible title="Theoretical Motivation" >}}
{{< /collapsible >}}


{{< collapsible title="Example 1" >}}

To illustrate the above, consider the following example. Given a dataset $D = \left\\{(1, 2), (2, 3), (3, 5)\right\\}$ of points on a 2D axis, let us compute the line of best fit of the dataset. From the above, we are solving for 

$$
\bm{b} = \bm{Ax}
$$

where

- $\bm{b}$ is the vector of output values ($y$-values arranged in a vector) 
- $\bm{A}$ is the **design matrix** ($x$-values and a column of ones
representing the intercept) 

$$ \bm{b} = \begin{bmatrix} 2 & 3 & 5 \end{bmatrix}^\top, \bm{A} = \begin{bmatrix} 1 & 1 \\\ 1 & 2 \\\ 1 & 3 \\\ \end{bmatrix} $$

The vector $\bm{x}$ is the parameter vector (not the $x$ values in the $x$-$y$.
pairs). Since we are finding the parameters for a line, we have 

$$\bm{x} = \begin{bmatrix} b & m \end{bmatrix}^\top$$

where $m$ and $b$ are the parameters of a line in the form $y = mx + b$. Solving
for the parameters $\bm{x}$, we have

$$ 
\begin{aligned}
    \bm{x} &= (A^\top A)^{-1}A^\top \bm{b} \\\
           &= \left(
              \begin{bmatrix} 1 & 1 & 1 \\\ 1 & 2 & 3 \\\  \end{bmatrix}
              \begin{bmatrix} 1 & 1 \\\ 1 & 2 \\\ 1 & 3 \\\ \end{bmatrix}
              \right)^{-1}
              \begin{bmatrix} 1 & 1 & 1 \\\ 1 & 2 & 3 \\\  \end{bmatrix}
              \begin{bmatrix} 2 \\\ 3 \\\ 5 \\\ \end{bmatrix} \\\
           &= \begin{bmatrix} 3 & 10 \\\ 6 & 14 \\\ \end{bmatrix}^{-1}
              \begin{bmatrix} 10 \\\ 23 \\\ \end{bmatrix} \\\
           &= 
\end{aligned}
$$
{{< /collapsible >}}

### Minimizing the error
#### By Geometry

#### By Algebra

#### By Calculus
$$ \text{RSS}(\beta) = (\mathbf{y} - \mathbf{X}\beta)^T(\mathbf{y} - \mathbf{X}\beta)$$

#### Interactive Demo

{{< regression >}}
