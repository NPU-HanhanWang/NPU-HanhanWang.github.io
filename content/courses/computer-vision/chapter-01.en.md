# Chapter 1: Image Processing Fundamentals

## 1.1 Mathematical Representation of Images

A digital image can be represented as a 2D matrix $f(x, y)$, where each element represents the pixel value at that position.

- **Grayscale image**: Single channel, value range 0-255
- **Color image**: Three channels (RGB), each representing red, green, and blue components

## 1.2 Basic Image Operations

### Reading and Displaying

```python
import cv2
import matplotlib.pyplot as plt

# Read image
img = cv2.imread('image.jpg')
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

# Display image
plt.imshow(img_rgb)
plt.axis('off')
plt.show()
```

### Image Resizing

```python
# Scale by ratio
resized = cv2.resize(img, None, fx=0.5, fy=0.5)

# Resize to specific dimensions
resized = cv2.resize(img, (256, 256))
```

## 1.3 Color Space Conversion

Common color spaces include:

| Color Space | Description | Common Use |
|------------|-------------|------------|
| RGB | Red-Green-Blue | Display, storage |
| HSV | Hue-Saturation-Value | Color detection & segmentation |
| LAB | Lightness-A-B | Color difference measurement |
| Grayscale | Single channel | Feature extraction preprocessing |

## 1.4 Image Filtering

### Gaussian Blur

Used for image smoothing and denoising:

```python
blurred = cv2.GaussianBlur(img, (5, 5), 0)
```

### Median Filtering

Particularly effective against salt-and-pepper noise:

```python
median = cv2.medianBlur(img, 5)
```

## 1.5 Edge Detection

Canny edge detection is one of the most commonly used edge detection algorithms.

## Summary

This chapter introduced fundamental concepts of image processing, including mathematical representation, basic operations, color space conversion, image filtering, and edge detection. These serve as building blocks for more advanced computer vision algorithms.
