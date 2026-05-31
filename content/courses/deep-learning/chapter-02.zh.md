# 第二章：卷积神经网络

## 2.1 卷积层

卷积层是 CNN 的核心组件。通过卷积核在输入特征图上滑动，提取局部特征。

### 关键参数

- **卷积核大小（Kernel Size）**：通常为 3×3 或 5×5
- **步长（Stride）**：控制输出特征图的分辨率
- **填充（Padding）**：控制边界处理方式

## 2.2 池化层

池化层通过降采样减少特征图的空间尺寸：

- **最大池化（Max Pooling）**：取局部区域的最大值
- **平均池化（Avg Pooling）**：取局部区域的平均值

## 2.3 经典 CNN 架构

### ResNet

ResNet 引入残差连接（Skip Connection），解决了深层网络的退化问题：

```python
class ResidualBlock(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, padding=1)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, padding=1)
        self.bn2 = nn.BatchNorm2d(out_channels)
        self.shortcut = nn.Sequential()
        if in_channels != out_channels:
            self.shortcut = nn.Conv2d(in_channels, out_channels, 1)

    def forward(self, x):
        out = torch.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += self.shortcut(x)
        out = torch.relu(out)
        return out
```

## 总结

本章介绍了卷积神经网络的核心组件：卷积层、池化层、批归一化和经典架构 ResNet。
