# 11-785 深度学习

## 课程简介

本课程系统学习深度学习的基础理论与主流框架，包括神经网络基础、CNN、RNN、Transformer、生成模型等内容。课程笔记整理自 [CMU 11-785 Introduction to Deep Learning Spring 2026](https://deeplearning.cs.cmu.edu/S26/index.html)。

## 学习目标

- 理解神经网络的基本原理与反向传播算法
- 掌握 CNN、RNN、Transformer 等主流架构
- 熟练使用 PyTorch 框架
- 能够独立设计和训练深度学习模型

## 参考书目

1. *Deep Learning* — Ian Goodfellow, Yoshua Bengio, Aaron Courville
2. *动手学深度学习* — 李沐等

## 环境配置

```bash
conda create -n dl python=3.10
conda activate dl
pip install torch torchvision torchaudio numpy matplotlib jupyter
```

## 课程笔记

| 课时          | 内容                                 |
| :------------ | :----------------------------------- |
| Lecture 1–2   | [深度网络的理论基础](lec01-02)       |
| Lecture 3–8   | [训练理论与优化算法](lec03-08)       |
| Lecture 9–12  | [卷积神经网络](lec09-12)             |
| Lecture 13–16 | [序列模型与 RNN](lec13-16)           |
| Lecture 17–20 | [Transformer 与注意力机制](lec17-20) |
| Lecture 21–24 | [深度生成模型](lec21-24)             |
| Lecture 25    | [图神经网络](lec25)                  |
| Lecture 26    | [深度强化学习](lec26)                |
| Lecture 27–28 | [前沿专题与总结](lec27-28)           |
