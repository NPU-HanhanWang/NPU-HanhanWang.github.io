# 图像分类实验

## 项目简介

使用 PyTorch 实现多种图像分类模型，在标准数据集上进行训练和评估，对比不同模型架构的性能差异。

## 实验内容

1. **数据集**：CIFAR-100 和自定义数据集
2. **模型**：ResNet-18, ResNet-50, ViT-B/16
3. **训练策略**：数据增强、学习率调度、混合精度训练

## 主要结果

| 模型 | CIFAR-100 Top-1 | 参数量 |
|------|----------------|--------|
| ResNet-18 | 76.3% | 11.2M |
| ResNet-50 | 79.1% | 23.5M |
| ViT-B/16 | 82.4% | 86.4M |

## 使用方式

```bash
# 训练
python train.py --model resnet50 --dataset cifar100 --epochs 200

# 评估
python evaluate.py --model resnet50 --checkpoint best.pth
```
