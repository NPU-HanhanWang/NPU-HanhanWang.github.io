# 第一章：神经网络基础

## 1.1 感知机

感知机是最简单的人工神经网络，由 Frank Rosenblatt 于 1957 年提出。

- **输入**：特征向量 $\mathbf{x} = [x_1, x_2, ..., x_n]$
- **权重**：$\mathbf{w} = [w_1, w_2, ..., w_n]$
- **输出**：$y = \sigma(\mathbf{w} \cdot \mathbf{x} + b)$

## 1.2 激活函数

激活函数引入非线性，使网络能够学习复杂模式。

| 函数 | 公式 | 特点 |
|------|------|------|
| Sigmoid | $\sigma(x) = \frac{1}{1+e^{-x}}$ | 输出(0,1)，易饱和 |
| Tanh | $\tanh(x)$ | 输出(-1,1)，零中心 |
| ReLU | $\max(0, x)$ | 计算简单，避免饱和 |
| GELU | $x \cdot \Phi(x)$ | Transformer常用 |

## 1.3 反向传播

反向传播（Backpropagation）是训练神经网络的核心算法。

### 计算步骤

1. **前向传播**：计算每层的输出和损失
2. **反向传播**：从输出层到输入层逐层计算梯度
3. **参数更新**：使用梯度下降更新权重

```python
import torch
import torch.nn as nn

# 简单的前馈网络
model = nn.Sequential(
    nn.Linear(784, 256),
    nn.ReLU(),
    nn.Linear(256, 128),
    nn.ReLU(),
    nn.Linear(128, 10)
)
```

## 总结

本章介绍了神经网络的基础概念，包括感知机模型、常用激活函数、反向传播算法和梯度下降优化。
