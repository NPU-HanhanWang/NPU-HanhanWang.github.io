# 第一章：图像处理基础

## 1.1 图像的数学表示

数字图像可以表示为一个二维矩阵 $f(x, y)$，其中每个元素代表该位置的像素值。

- **灰度图像**：单通道，取值范围 0-255
- **彩色图像**：三通道（RGB），每个通道代表红、绿、蓝分量

## 1.2 图像的基本操作

### 读取与显示

```python
import cv2
import matplotlib.pyplot as plt

# 读取图像
img = cv2.imread('image.jpg')
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

# 显示图像
plt.imshow(img_rgb)
plt.axis('off')
plt.show()
```

### 图像缩放

```python
# 按比例缩放
resized = cv2.resize(img, None, fx=0.5, fy=0.5)

# 缩放到指定尺寸
resized = cv2.resize(img, (256, 256))
```

## 1.3 颜色空间转换

常见的颜色空间包括：

| 颜色空间 | 说明 | 常用场景 |
|---------|------|---------|
| RGB | 红绿蓝 | 显示、存储 |
| HSV | 色调-饱和度-明度 | 颜色检测与分割 |
| LAB | 亮度-A通道-B通道 | 颜色差异度量 |
| Grayscale | 灰度 | 特征提取预处理 |

```python
# RGB 转 HSV
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

# RGB 转灰度
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
```

## 1.4 图像滤波

### 高斯滤波

用于图像平滑和去噪：

```python
blurred = cv2.GaussianBlur(img, (5, 5), 0)
```

### 中值滤波

对椒盐噪声特别有效：

```python
median = cv2.medianBlur(img, 5)
```

## 1.5 边缘检测

Canny 边缘检测是最常用的边缘检测算法之一：

```python
edges = cv2.Canny(gray, threshold1=100, threshold2=200)
```

其核心步骤包括：
1. 高斯滤波降噪
2. 计算梯度幅值和方向
3. 非极大值抑制（NMS）
4. 双阈值检测与边界跟踪

## 总结

本章介绍了图像处理的基础知识，包括图像的数学表示、基本操作、颜色空间转换、图像滤波和边缘检测。这些是后续学习更高级计算机视觉算法的基石。
