# Chapter 2: Feature Extraction & Matching

## 2.1 Overview of Feature Extraction

Feature extraction is one of the core tasks in computer vision. Good features should have the following properties:

- **Repeatability**: Can be repeatedly detected across different images of the same scene
- **Distinctiveness**: Different features can be distinguished from each other
- **Locality**: Features occupy a small portion of the image
- **Efficiency**: Can be computed quickly

## 2.2 Harris Corner Detection

Harris corner detection is based on the gradient distribution of an image, analyzing grayscale changes when a local window moves in different directions.

## 2.3 SIFT Features

Scale-Invariant Feature Transform (SIFT) is one of the most classic feature descriptors. It is invariant to scale, rotation, and partially invariant to illumination changes.

## 2.4 Feature Matching

Brute-force matching and FLANN-based matching are common approaches for finding correspondences between feature sets.

## Summary

This chapter covered feature extraction and matching techniques in computer vision. These are fundamental building blocks for higher-level applications such as image stitching, 3D reconstruction, and object tracking.
