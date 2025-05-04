---
author : "Brandon Szeto"
title : "kalman filter"
date : "2025-03-21"
description : "An interactive demonstration of the Kalman Filter in action. Tweak sample rates, noise parameters, and other settings to see how sensor data is processed over time — watch the filter refine its estimates and respond to changing conditions in real time."
math: true
toc: false
readingtime: false
---


## Kalman Filter

The Kalman filter is a powerful algorithm used to estimate the state of a dynamic system by combining a model of the system’s behavior with noisy measurements. Rather than relying solely on imprecise sensor readings, the filter leverages predictions based on prior states and then refines those predictions when new data arrives. This results in a more accurate and stable estimate over time.

Imagine tracking a moving object with a sensor that produces noisy readings. Instead of taking each noisy measurement at face value, the Kalman filter first predicts where the object should be based on its previous state and a mathematical model. Then, when a new measurement comes in, it adjusts the prediction by balancing between the model’s forecast and the measurement. The outcome is a smoother, more reliable estimate of the object’s true position and velocity.

## Interactive Demo

{{< kalman >}}

## How the Kalman Filter Works

The filter operates in two key steps: **Prediction** and **Update**.

### Prediction Step

In this step, the filter estimates the current state based on the previous state and the system’s dynamics. The equations below describe the prediction process:

$$
\begin{aligned}
\hat{x}\_{k|k-1} &= A \hat{x}\_{k-1|k-1} + B u\_k \\\
P\_{k|k-1} &= A P\_{k-1|k-1} A^T + Q \\\
\end{aligned}
$$

where:
- $\hat{x}\_{k|k-1}$ is the predicted state estimate at time $k$ given the previous estimate,
- $P\_{k|k-1}$ is the predicted error covariance (a measure of uncertainty),
- $A$ is the state transition model,
- $B$ relates the control input $u\_k$ to the state,
- $Q$ represents the process noise, accounting for uncertainty in the model.

### Update Step

Once a new measurement, $z\_k$, is received, the filter updates its prediction to produce a refined estimate. The update equations are:

$$
\begin{aligned}
K\_k &= P\_{k|k-1} H^T \left(H P\_{k|k-1} H^T + R\right)^{-1} \\\
\hat{x}\_{k|k} &= \hat{x}\_{k|k-1} + K\_k \left(z\_k - H \hat{x}\_{k|k-1}\right) \\\
P\_{k|k} &= \left(I - K\_k H\right) P\_{k|k-1} \\\
\end{aligned}
$$

where:
- $K\_k$ is the Kalman gain, determining the weight given to the new measurement,
- $z\_k$ is the new measurement at time $k$,
- $H$ is the observation model, linking the state to the measurement,
- $R$ is the measurement noise covariance, representing the uncertainty in the measurements,
- $I$ is the identity matrix.

## Application in This Context

In our demonstration, the Kalman filter is used to track the 2D movement of a mouse on a canvas. The filter assumes a simple constant velocity model for the system dynamics. This means that between successive time steps, the object's position is updated based on its current velocity, while the velocity remains constant.

### System Dynamics and State Representation

The state vector is defined as:

$$
\hat{x}\_{k} = \begin{bmatrix} x\_{k} \\\ y\_{k} \\\ v\_{x,k} \\\ v\_{y,k} \end{bmatrix}
$$

where:
- $x\_{k}$ and $y\_{k}$ represent the position of the mouse at time $k$.
- $v\_{x,k}$ and $v\_{y,k}$ represent the velocity components in the x and y directions, respectively.

The dynamics of the system (i.e., how the state evolves over time) are given by the following equations:

$$
\begin{aligned}
x\_{k+1} &= x\_{k} + v\_{x,k} \cdot dt \\\
y\_{k+1} &= y\_{k} + v\_{y,k} \cdot dt \\\
v\_{x,k+1} &= v\_{x,k} \\\
v\_{y,k+1} &= v\_{y,k}
\end{aligned}
$$

Here, $dt$ is the elapsed time between the current state at time $k$ and the next state at time $k+1$. In other words, the equations

$$
x = x + v\_{x} \cdot dt \quad \text{and} \quad y = y + v\_{y} \cdot dt
$$

describe the update of the position based on the current velocity, while the velocities remain unchanged.

## How the Kalman Filter Uses This Model

1. **Prediction Step:**
   The Kalman filter uses the system dynamics to predict the next state. Based on the current state, the predicted state is computed as:

   $$
   \hat{x}\_{k|k-1} = \begin{bmatrix}
   x\_{k} + v\_{x,k} \cdot dt \\\
   y\_{k} + v\_{y,k} \cdot dt \\\
   v\_{x,k} \\\
   v\_{y,k}
   \end{bmatrix}
   $$

   This predicted state ($\hat{x}\_{k|k-1}$) represents our best estimate of the position and velocity at the next time step before incorporating the new measurement.

2. **Update Step:**
   When a new, noisy measurement ($z\_{k}$) is received, the Kalman filter updates its prediction. The measurement provides information about the mouse’s current position. The filter computes the Kalman gain, which determines the weighting between the prediction and the measurement, and then corrects the predicted state to produce the filtered state ($\hat{x}\_{k|k}$).

## Visual Representation

- **Blue (True Mouse Path):** Represents the actual movement of the mouse.
- **Red (Noisy Measurements):** Simulates sensor readings that include noise.
- **Green (Filtered Estimates):** Shows the output of the Kalman filter, providing a smoother and more accurate path by filtering out the noise.

By continuously repeating the prediction and update steps, the filter effectively tracks the mouse movement in real time, refining its estimates based on both the assumed constant velocity model and the observed noisy data.
