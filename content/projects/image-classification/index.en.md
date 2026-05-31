# Image Classification Lab

## Project Overview

Implementing various image classification models with PyTorch, training and evaluating on standard datasets to compare performance across different model architectures.

## Experiments

1. **Datasets**: CIFAR-100 and custom datasets
2. **Models**: ResNet-18, ResNet-50, ViT-B/16
3. **Training**: Data augmentation, learning rate scheduling, mixed precision training

## Key Results

| Model | CIFAR-100 Top-1 | Parameters |
|-------|----------------|------------|
| ResNet-18 | 76.3% | 11.2M |
| ResNet-50 | 79.1% | 23.5M |
| ViT-B/16 | 82.4% | 86.4M |

## Usage

```bash
# Training
python train.py --model resnet50 --dataset cifar100 --epochs 200

# Evaluation
python evaluate.py --model resnet50 --checkpoint best.pth
```
