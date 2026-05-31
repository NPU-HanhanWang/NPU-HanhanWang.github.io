# 第二章：特征提取与匹配

## 2.1 特征提取概述

特征提取是计算机视觉的核心任务之一。好的特征应具有以下特性：

- **可重复性**：同一场景不同图像中能被重复检测
- **独特性**：不同特征之间能相互区分
- **局部性**：特征占据图像的一小部分区域
- **高效性**：能够快速计算

## 2.2 Harris 角点检测

Harris 角点检测基于图像的梯度分布，通过分析局部窗口在不同方向移动时的灰度变化来检测角点。

核心思想：

> 如果窗口在任意方向移动都会引起较大的灰度变化，则该位置是一个角点。

```python
import cv2
import numpy as np

img = cv2.imread('image.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Harris 角点检测
gray = np.float32(gray)
dst = cv2.cornerHarris(gray, blockSize=2, ksize=3, k=0.04)

# 标记角点
img[dst > 0.01 * dst.max()] = [0, 0, 255]
```

## 2.3 SIFT 特征

尺度不变特征变换（Scale-Invariant Feature Transform, SIFT）是最经典的特征描述子之一。

SIFT 的主要步骤：
1. **尺度空间极值检测**：在不同尺度空间搜索稳定的关键点
2. **关键点定位**：精确确定关键点的位置和尺度
3. **方向分配**：为每个关键点分配方向
4. **关键点描述子**：基于局部梯度信息计算描述子

## 2.4 特征匹配

### 暴力匹配（Brute-Force）

```python
# 创建 SIFT 检测器
sift = cv2.SIFT_create()

# 检测并计算描述子
kp1, des1 = sift.detectAndCompute(img1, None)
kp2, des2 = sift.detectAndCompute(img2, None)

# 暴力匹配
bf = cv2.BFMatcher(cv2.NORM_L2, crossCheck=True)
matches = bf.match(des1, des2)

# 按距离排序
matches = sorted(matches, key=lambda x: x.distance)
```

## 总结

本章介绍了计算机视觉中的特征提取与匹配技术，从经典的 Harris 角点到 SIFT 特征描述了关键算法。特征提取与匹配是图像拼接、三维重建、目标跟踪等高层应用的基础。
