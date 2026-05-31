# Chapter 2: Convolutional Neural Networks

## 2.1 Convolutional Layer

The convolutional layer is the core component of CNNs. It extracts local features by sliding convolution kernels over input feature maps.

### Key Parameters

- **Kernel Size**: Typically 3×3 or 5×5
- **Stride**: Controls output feature map resolution
- **Padding**: Controls boundary handling

## 2.2 Pooling Layer

Pooling layers reduce the spatial dimensions of feature maps through downsampling:

- **Max Pooling**: Takes the maximum value in each local region
- **Average Pooling**: Takes the average value in each local region

## 2.3 Classic CNN Architectures

### ResNet

ResNet introduces skip connections (residual connections) to solve the degradation problem in deep networks.

## Summary

This chapter covered the core components of CNNs: convolutional layers, pooling layers, batch normalization, and the classic ResNet architecture.
