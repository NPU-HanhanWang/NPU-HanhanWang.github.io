# Chapter 1: Neural Network Basics

## 1.1 Perceptron

The perceptron is the simplest artificial neural network, proposed by Frank Rosenblatt in 1957.

- **Input**: Feature vector $\mathbf{x} = [x_1, x_2, ..., x_n]$
- **Weights**: $\mathbf{w} = [w_1, w_2, ..., w_n]$
- **Output**: $y = \sigma(\mathbf{w} \cdot \mathbf{x} + b)$

## 1.2 Activation Functions

Activation functions introduce non-linearity, enabling the network to learn complex patterns.

| Function | Formula | Characteristics |
|----------|---------|-----------------|
| Sigmoid | $\sigma(x) = \frac{1}{1+e^{-x}}$ | Output (0,1), prone to saturation |
| Tanh | $\tanh(x)$ | Output (-1,1), zero-centered |
| ReLU | $\max(0, x)$ | Computationally simple, avoids saturation |
| GELU | $x \cdot \Phi(x)$ | Common in Transformers |

## 1.3 Backpropagation

Backpropagation is the core algorithm for training neural networks.

## Summary

This chapter covered basic neural network concepts including the perceptron model, common activation functions, backpropagation, and gradient descent optimization.
