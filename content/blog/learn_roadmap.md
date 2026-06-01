AI Infra 领域的技术更新迭代极快，很多精髓甚至不在书本里，而在开源项目的 **源码**、**设计文档（RFC）** 和 **技术博客** 中。

针对你的背景（统计学偏工程、关注 Spark/Ray 以及强化学习与大模型底层），我为你筛选了一份“高含金量、少而精”的资料清单，分为视频课程、经典书籍、顶会论文与工业界硬核博客四类：

---

## 📺 推荐视频课程（系统性输入）

### 1. 分布式系统与大模型 Infra 专精（核心推荐）

* **《Distributed Systems (MIT 6.824)》**
* **搞 Infra 的必修圣经。** 别被“分布式”吓到，AI Infra 本质上就是分布式系统在 AI 场景的特化。通过这门课，你能彻底搞懂 RPC、Raft 一致性协议、分布式容错。
* *建议：* 至少把 Lecture 看一遍，有精力的话尝试做一下它的 Lab 1 (MapReduce)，这会极大加深你对 Spark 底层原理的理解。


* **《Machine Learning Systems (CMU 10-414 / 714)》**
* 由陈天奇（TVM 作者、XGBoost 作者）主讲。
* **核心收获：** 这门课会带你“从零手写一个类似 PyTorch 的深度学习框架”（NEED 框架）。你会亲自实现自动求导（Autograd）、计算图优化以及 GPU 算子加速。这对理解 PyTorch 底层机制是降维打击。



### 2. 计算机系统底座

* **《Introduction to Computer Systems (CMU 15-213)》**
* 大名鼎鼎的 CSAPP 配套课程。
* **核心收获：** 重点看内存层次结构（Memory Hierarchy）**和**虚拟内存（Virtual Memory）这两章。vLLM 的 PagedAttention 论文第一句就写着它的灵感来源于操作系统的虚拟内存分页机制。



---

## 📘 推荐书籍（构建知识骨架）

既然你偏向工程化，传统的算法书（如《统计学习方法》）可以先放一放，重点看以下三本“硬核”工程书：

| 书名                              | 适合阶段         | 为什么推荐？核心看什么？                                                                                                                                        |
| --------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **《深入理解计算机系统》(CSAPP)** | 第一阶段（筑基） | 读透它的 **第 6 章（存储器层次结构）** 和 **第 9 章（虚拟内存）**。搞 AI 推理加速，大半时间都在和这两章的底层原理打交道（优化显存 bandwidth 和 Cache 命中率）。 |
| **《Learning Ray》** (O'Reilly)   | 第二阶段（进阶） | **必读。** 专门讲 Ray 框架的架构设计和分布式应用。重点看它如何处理分布式状态、Actor 模型以及与 RL（强化学习）生态（如 Ray Train / RLLib）的结合。               |
| **《设计数据密集型应用》(DDIA)**  | 第二阶段（进阶） | 分布式领域的“神书”。AI 的数据工程（Spark 洗牌、大规模特征存储）说白了就是大规模数据的流转。读完它，你会对分布式系统的分区、复制、乱序有极深的理解。             |

---

## 📄 必读经典论文（AI Infra 工程师的通用语言）

去面试 AI Infra 岗位，面试官最喜欢聊的就是这几篇论文的设计思想。建议打印出来，精读、反复读：

### 分布式计算框架类

* **Ray 论文：** *《Ray: A Distributed Framework for Emerging AI Applications》*
* **重点关注：** 为什么在有了 Spark 之后，业界还要开发 Ray？（因为 Spark 擅长微批处理/数据流，而 Ray 擅长动态任务图和状态管理，这天然契合迭代式的机器学习和强化学习）。



### 大模型分布式训练类

* **DeepSpeed ZeRO 论文：** *《ZeRO: Memory Optimizations Toward Training Trillion Parameter Models》*
* **重点关注：** 理解 ZeRO-1, ZeRO-2, ZeRO-3 是如何把优化器状态、梯度和模型参数像切蛋糕一样分片到不同 GPU 上的。


* **Megatron-LM 论文：** *《Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism》*
* **重点关注：** 什么是张量并行（Tensor Parallelism），Transformer 的 MLP 层和 Self-Attention 层是怎么在多张卡之间做矩阵乘法拆分的。



### 大模型推理加速类

* **vLLM 论文：** *《Efficient Memory Management for Large Language Model Serving with PagedAttention》*
* **重点关注：** 它是怎么把操作系统的“分页机制”搬到 GPU 上来解决 KV Cache 显存碎片的。



---

## 🌐 工业界硬核博客与开源项目（紧跟 2026 最新前沿）

AI 基础设施的发展太快了，书本和课程往往有滞后性。业界最顶尖的优化方案往往直接发在公司的技术博客里。

* **Anyscale Tech Blog (Anyscale 官方博客):** Ray 背后的公司。他们经常发如何用 Ray 支撑成千上万卡做大模型强化学习（RLHF / PPO）的超大规模工程实践。
* **PyTorch 官方博客:** 经常会发一些最新的编译优化技术（如 PyTorch 2.x 的 TorchInductor 编译优化、FSDP2 的设计思路）。
* **NVIDIA Technical Blog (英伟达技术博客):** 了解最新 GPU 架构（如 Blackwell / Rubin 系列）和 Transformer Engine 加速原理的第一手资料。

---

## 🛠️ 怎么学效率最高？（过来人建议）

1. **Top-Down（自上而下）学源码：**
不要盲目去抠 CUDA 算子。你可以克隆 **vLLM** 或者 **OpenRLHF**（一个基于 Ray 的大模型强化学习对齐框架）的 GitHub 仓库。尝试去 trace 一次前向传播或者一次分布式任务调度的代码逻辑。
2. **用好 AI 导师（比如我）：**
在读论文或者看源码卡壳时，把那段晦涩的代码或者论文段落直接贴给我。比如你可以问：*“这段 PyTorch 源码里的 NCCL AllReduce 是怎么和硬件通信的？”* 我来帮你做 inline 的拆解和白话翻译。

你可以先从 **CMU 10-714 (ML Systems)** 的公开主页或者 **《Learning Ray》** 这本书开始入手。你打算这周先从哪一个切入点开始突破？