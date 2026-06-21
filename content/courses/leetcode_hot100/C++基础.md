好的！我来给你系统地讲解 **C++ 容器**，从零开始，用人话 + 类比 + 代码示例，让你彻底掌握！

---

## 📚 目录
1. [容器是什么？](#1-容器是什么)
2. [容器分类（三大类）](#2-容器分类三大类)
3. [序列容器详解](#3-序列容器详解)
4. [关联容器详解](#4-关联容器详解)
5. [无序容器详解](#5-无序容器详解)
6. [容器适配器](#6-容器适配器)
7. [通用操作总结](#7-通用操作总结)
8. [实战选择指南](#8-实战选择指南)

---

## 1. 容器是什么？

### 🎯 人话解释
**容器** = 装东西的"盒子"，专门用来**存储和管理数据**。

类比生活：
- **数组** = 一排有编号的柜子（大小固定）
- **vector** = 会自动变大的衣柜（动态数组）
- **set** = 书包（自动去重，自动排序）
- **map** = 通讯录（名字→电话号码）

### 📦 C++ 容器家族
```cpp
容器
├── 序列容器（Sequence Containers）
│   ├── vector     // 动态数组
│   ├── list       // 双向链表
│   ├── deque      // 双端队列
│   ├── array      // 固定数组（C++11）
│   └── forward_list // 单向链表（C++11）
│
├── 关联容器（Associative Containers）
│   ├── set        // 集合（自动排序，去重）
│   ├── multiset   // 多重集合（允许重复）
│   ├── map        // 字典（key→value，自动排序）
│   └── multimap   // 多重字典（允许重复key）
│
├── 无序容器（Unordered Containers，C++11）
│   ├── unordered_set     // 哈希集合
│   ├── unordered_multiset // 哈希多重集合
│   ├── unordered_map     // 哈希字典
│   └── unordered_multimap // 哈希多重字典
│
└── 容器适配器（Container Adapters）
    ├── stack      // 栈（LIFO）
    ├── queue      // 队列（FIFO）
    └── priority_queue // 优先队列
```

---

## 2. 容器分类（三大类）

### 🔵 序列容器（Sequence Containers）
**特点**：元素按**插入顺序**存储，有位置概念

| 容器           | 特点               | 访问速度          | 插入/删除                | 适用场景         |
| -------------- | ------------------ | ----------------- | ------------------------ | ---------------- |
| `vector`       | 动态数组，连续内存 | 随机访问 O(1)     | 尾部快 O(1)，中间慢 O(n) | 需要频繁随机访问 |
| `list`         | 双向链表           | 只能顺序访问 O(n) | 任意位置快 O(1)          | 频繁插入/删除    |
| `deque`        | 双端队列           | 随机访问 O(1)     | 两端快 O(1)，中间慢      | 需要在两端操作   |
| `array`        | 固定大小数组       | 随机访问 O(1)     | 不支持插入/删除          | 大小固定         |
| `forward_list` | 单向链表           | 只能顺序访问      | 任意位置快               | 省内存           |

### 🟢 关联容器（Associative Containers）
**特点**：元素**自动排序**（红黑树实现），查找快 O(log n)

| 容器       | key是否唯一 | 存储内容     | 适用场景              |
| ---------- | ----------- | ------------ | --------------------- |
| `set`      | 唯一        | 只有 key     | 需要去重 + 排序       |
| `multiset` | 允许重复    | 只有 key     | 允许重复 + 排序       |
| `map`      | 唯一        | key-value 对 | 字典（自动按key排序） |
| `multimap` | 允许重复    | key-value 对 | 一对多映射            |

### 🟡 无序容器（Unordered Containers）
**特点**：**哈希表**实现，查找 O(1)，**不排序**

| 容器                 | key是否唯一 | 存储内容     | 适用场景             |
| -------------------- | ----------- | ------------ | -------------------- |
| `unordered_set`      | 唯一        | 只有 key     | 快速查找，不关心顺序 |
| `unordered_multiset` | 允许重复    | 只有 key     | 快速查找，允许重复   |
| `unordered_map`      | 唯一        | key-value 对 | 快速字典，不排序     |
| `unordered_multimap` | 允许重复    | key-value 对 | 一对多，快速查找     |

---

## 3. 序列容器详解

### 📌 vector（动态数组）⭐ 最常用

```cpp
#include <vector>
using namespace std;

// ===== 1. 创建 =====
vector<int> v1;                    // 空 vector
vector<int> v2(5);                 // 5个元素，默认0
vector<int> v3(5, 10);             // 5个元素，都是10
vector<int> v4 = {1, 2, 3, 4, 5};  // 初始化列表
vector<int> v5(v4);                // 拷贝构造
vector<int> v6(v4.begin(), v4.end()); // 迭代器构造

// ===== 2. 添加元素 =====
v1.push_back(10);    // 尾部添加 → {10}
v1.push_back(20);    // → {10, 20}
v1.insert(v1.begin(), 5); // 在开头插入 5 → {5, 10, 20}
v1.insert(v1.begin() + 1, 3, 99); // 在位置1插入3个99

// ===== 3. 删除元素 =====
v1.pop_back();       // 删除最后一个
v1.erase(v1.begin()); // 删除第一个元素
v1.erase(v1.begin(), v1.begin() + 2); // 删除前2个
v1.clear();          // 清空所有

// ===== 4. 访问元素 =====
int a = v4[0];       // 下标访问（不检查越界）
int b = v4.at(1);    // at() 访问（检查越界，抛异常）
int first = v4.front(); // 第一个元素
int last = v4.back();   // 最后一个元素

// ===== 5. 容量相关 =====
int size = v4.size();        // 元素个数 → 5
int cap = v4.capacity();     // 当前容量（可能大于size）
bool empty = v4.empty();     // 是否为空
v4.reserve(100);             // 预留100个空间（不改变size）
v4.resize(10);               // 调整大小为10（多出来的默认0）
v4.shrink_to_fit();          // 释放多余容量

// ===== 6. 遍历 =====
// 方法1：下标
for (int i = 0; i < v4.size(); i++) {
    cout << v4[i] << " ";
}

// 方法2：迭代器
for (auto it = v4.begin(); it != v4.end(); it++) {
    cout << *it << " ";
}

// 方法3：范围for（C++11）
for (int x : v4) {
    cout << x << " ";
}

// 方法4：C++17 结构化绑定
for (auto& x : v4) {
    x *= 2; // 修改元素
}
```

**💡 使用场景**：90% 的情况都用 `vector`，因为它最灵活高效！

---

### 📌 list（双向链表）

```cpp
#include <list>

list<int> l1 = {1, 2, 3, 4, 5};
list<int> l2;

// ===== 添加 =====
l2.push_back(10);     // 尾部添加 → {10}
l2.push_front(5);     // 头部添加 → {5, 10}
l2.insert(l2.begin(), 99); // 在开头插入99

// ===== 删除 =====
l2.pop_back();        // 删除尾部
l2.pop_front();       // 删除头部
l2.remove(10);        // 删除所有值为10的元素
l2.erase(l2.begin()); // 删除第一个

// ===== 特殊操作 =====
l1.merge(l2);         // 合并两个有序list（l2被清空）
l1.sort();            // 排序
l1.reverse();         // 反转
l1.unique();          // 去重（相邻重复元素去重）
l1.splice(l1.begin(), l2); // 把l2全部移到l1开头

// ===== 遍历（只能用迭代器，不支持下标） =====
for (auto it = l1.begin(); it != l1.end(); it++) {
    cout << *it << " ";
}
```

**💡 使用场景**：频繁在中间插入/删除，不关心随机访问。

---

### 📌 deque（双端队列）

```cpp
#include <deque>

deque<int> d = {1, 2, 3};

// 两端都可以操作
d.push_back(4);   // → {1, 2, 3, 4}
d.push_front(0);  // → {0, 1, 2, 3, 4}
d.pop_back();     // → {0, 1, 2, 3}
d.pop_front();    // → {1, 2, 3}

// 支持随机访问（但比vector慢一点）
int x = d[1];     // → 2
int y = d.at(2);  // → 3
```

**💡 使用场景**：需要在两端频繁插入/删除，比如滑动窗口。

---

### 📌 array（固定数组，C++11）

```cpp
#include <array>

array<int, 5> arr = {1, 2, 3, 4, 5}; // 大小固定为5

arr[0] = 10;          // 修改
int size = arr.size(); // → 5（编译期确定）
int* ptr = arr.data(); // 获取底层数组指针

// 遍历（和vector一样）
for (int x : arr) {
    cout << x << " ";
}
```

**💡 使用场景**：大小编译期已知，比原始数组更安全。

---

## 4. 关联容器详解

### 📌 set（集合）⭐ 自动去重 + 排序

```cpp
#include <set>

set<int> s;

// ===== 插入 =====
s.insert(5);        // → {5}
s.insert(3);        // → {3, 5}（自动排序）
s.insert(5);        // → {3, 5}（5已存在，不插入）
s.insert({1, 4, 2}); // → {1, 2, 3, 4, 5}

// ===== 删除 =====
s.erase(3);         // 删除值为3的元素
s.erase(s.begin()); // 删除第一个元素
s.clear();          // 清空

// ===== 查找 =====
if (s.find(5) != s.end()) {
    cout << "找到了！" << endl;
}

if (s.count(5) > 0) {  // count只返回0或1
    cout << "5存在！" << endl;
}

// C++20 新特性
if (s.contains(5)) {
    cout << "5存在！" << endl;
}

// ===== 遍历（自动升序） =====
for (int x : s) {
    cout << x << " ";  // → 1 2 3 4 5
}
```

**💡 使用场景**：需要去重 + 自动排序 + 快速查找（O(log n)）。

---

### 📌 map（字典）⭐ key-value 映射

```cpp
#include <map>

map<string, int> m;

// ===== 插入 =====
m["apple"] = 5;          // 直接赋值
m.insert({"banana", 3}); // 用 pair 插入
m.insert(make_pair("orange", 7));
m.insert(pair<string, int>("grape", 2));

// ===== 访问 =====
int apple_count = m["apple"];      // → 5
int banana_count = m.at("banana"); // → 3（会检查越界）
// 注意：m["unknown"] 会创建一个默认值0！慎用

// ===== 查找 =====
if (m.find("apple") != m.end()) {
    cout << "找到了！" << m["apple"] << endl;
}

// ===== 删除 =====
m.erase("apple");
m.erase(m.begin());

// ===== 遍历（自动按key排序） =====
for (auto& p : m) {
    cout << p.first << " → " << p.second << endl;
}

// C++17 结构化绑定
for (auto& [key, value] : m) {
    cout << key << " → " << value << endl;
}
```

**💡 使用场景**：需要建立映射关系，且要按key排序。

---

### 📌 multiset / multimap（允许重复）

```cpp
multiset<int> ms = {1, 2, 2, 3, 3, 3};

ms.count(3);  // → 3（3出现了3次）
ms.erase(2);  // → 删除所有2

// 查找某个值
auto range = ms.equal_range(3); // 返回一对迭代器 [first, second)
for (auto it = range.first; it != range.second; it++) {
    cout << *it << " ";
}
```

---

## 5. 无序容器详解（哈希表）

### 📌 unordered_set（哈希集合）⭐ 最快查找

```cpp
#include <unordered_set>

unordered_set<int> us;

// ===== 操作和set几乎一样 =====
us.insert(5);
us.insert(3);
us.insert(5);  // 不插入（已存在）

// ===== 查找 O(1) =====
if (us.find(5) != us.end()) {
    cout << "找到了！" << endl;
}

if (us.count(5) > 0) {
    cout << "5存在！" << endl;
}

// ===== 性能差异 =====
// set: 查找 O(log n)，自动排序
// unordered_set: 查找 O(1)，不排序
```

**💡 使用场景**：只需要快速查找，不关心顺序（本题就用这个！）

---

### 📌 unordered_map（哈希字典）⭐ 最快映射

```cpp
#include <unordered_map>

unordered_map<string, int> um;

um["apple"] = 5;
um["banana"] = 3;
um.insert({"orange", 7});

// 查找 O(1)
if (um.find("apple") != um.end()) {
    cout << um["apple"] << endl;
}

// 遍历（无序）
for (auto& [key, value] : um) {
    cout << key << " → " << value << endl;
}
```

**💡 使用场景**：需要映射，不关心顺序，追求速度。

---

## 6. 容器适配器

### 📌 stack（栈）LIFO

```cpp
#include <stack>

stack<int> stk;
stk.push(1);
stk.push(2);
stk.push(3);

int top = stk.top();  // → 3
stk.pop();            // 删除3
bool empty = stk.empty();
int size = stk.size();
```

### 📌 queue（队列）FIFO

```cpp
#include <queue>

queue<int> q;
q.push(1);
q.push(2);
q.push(3);

int front = q.front(); // → 1
int back = q.back();   // → 3
q.pop();               // 删除1
```

### 📌 priority_queue（优先队列）最大堆

```cpp
#include <queue> // priority_queue 也在 queue 头文件

priority_queue<int> pq; // 默认大顶堆
pq.push(3);
pq.push(1);
pq.push(5);

int top = pq.top(); // → 5（最大值）
pq.pop();           // 删除5

// 小顶堆
priority_queue<int, vector<int>, greater<int>> min_heap;
min_heap.push(3);
min_heap.push(1);
min_heap.push(5);
int top2 = min_heap.top(); // → 1（最小值）
```

---

## 7. 通用操作总结

### 🔥 所有容器都支持的

```cpp
// 1. 大小
size_t size = c.size();
bool empty = c.empty();

// 2. 清空
c.clear();

// 3. 交换
c1.swap(c2);
swap(c1, c2);

// 4. 比较（顺序容器）
if (v1 == v2) { /* 元素相同 */ }
if (v1 < v2) { /* 字典序比较 */ }

// 5. 迭代器
auto it = c.begin();   // 指向第一个
auto end = c.end();    // 指向最后一个后面
auto rit = c.rbegin(); // 反向迭代器
```

### 📝 迭代器分类

| 迭代器类型     | 支持操作       | 容器                      |
| -------------- | -------------- | ------------------------- |
| 输入迭代器     | 只读，单次遍历 | 所有                      |
| 输出迭代器     | 只写，单次遍历 | 所有                      |
| 前向迭代器     | 读写，多次遍历 | forward_list, unordered_* |
| 双向迭代器     | 前向 + 后向    | list, set, map            |
| 随机访问迭代器 | 双向 + 下标    | vector, deque, array      |

---

## 8. 实战选择指南

### 🎯 怎么选？

```
需要存储多个元素？
├─ 需要随机访问（下标）？
│  ├─ 大小固定 → array
│  └─ 大小动态 → vector（首选！）或 deque（两端操作）
├─ 不需要随机访问？
│  ├─ 频繁在中间插入/删除 → list
│  ├─ 只需要一端操作（LIFO）→ stack
│  ├─ 只需要两端操作（FIFO）→ queue
│  └─ 需要按优先级取 → priority_queue
├─ 需要快速查找？
│  ├─ 需要按key排序 → set / map
│  └─ 不需要排序，速度优先 → unordered_set / unordered_map
└─ 需要去重？
   ├─ 需要排序 → set
   └─ 不需要排序 → unordered_set
```

### 📊 性能对比表

| 操作         | vector | list | set      | unordered_set |
| ------------ | ------ | ---- | -------- | ------------- |
| 随机访问     | O(1)   | O(n) | -        | -             |
| 插入（末尾） | O(1)   | O(1) | -        | -             |
| 插入（中间） | O(n)   | O(1) | O(log n) | O(1)          |
| 查找         | O(n)   | O(n) | O(log n) | O(1)          |
| 删除         | O(n)   | O(1) | O(log n) | O(1)          |
| 排序         | 自动   | 自动 | 自动     | 不排序        |
| 内存         | 连续   | 分散 | 树结构   | 哈希表        |

---

## 9. 常见坑和技巧

### ⚠️ 常见坑

```cpp
// 坑1：vector 的 size 和 capacity
vector<int> v;
v.reserve(100);  // 只分配内存，size = 0
v[0] = 1;        // ❌ 越界！size 还是 0

// 坑2：map 的 operator[] 会插入
map<string, int> m;
if (m["unknown"] == 0) {  // 会插入 "unknown":0
    // ...
}
// 应该用 find() 或 at()

// 坑3：erase 后迭代器失效
vector<int> v = {1, 2, 3, 4, 5};
for (auto it = v.begin(); it != v.end(); it++) {
    if (*it == 3) {
        v.erase(it);  // ❌ it 失效了！
    }
}
// 正确写法：
for (auto it = v.begin(); it != v.end(); ) {
    if (*it == 3) {
        it = v.erase(it);  // ✅ erase 返回下一个迭代器
    } else {
        it++;
    }
}

// 坑4：unordered_set 的迭代器顺序不确定
unordered_set<int> s = {1, 2, 3, 4, 5};
for (int x : s) {
    cout << x << " ";  // 每次运行顺序可能不同！
}
```

---

## 10. 实战练习（从简单到复杂）

### 🥉 初级：遍历打印
```cpp
vector<int> v = {1, 2, 3};
for (int x : v) cout << x << " ";
```

### 🥈 中级：去重
```cpp
vector<int> v = {1, 2, 2, 3, 3, 3};
unordered_set<int> s(v.begin(), v.end());
// s = {1, 2, 3}
```

### 🥇 高级：单词计数
```cpp
vector<string> words = {"apple", "banana", "apple", "orange", "banana", "apple"};
unordered_map<string, int> count;

for (const string& w : words) {
    count[w]++;  // 统计每个单词出现次数
}

for (auto& [word, cnt] : count) {
    cout << word << ": " << cnt << endl;
}
```

---

## 🎯 总结一句话

> **vector 是万金油（90%用这个），unordered_set/map 是查找神器（O(1)），set/map 是排序利器（自动排序），list 是插入删除专家（中间操作快），记住这4个就够了！**

---

## 📝 速查表

```cpp
// 包含头文件
#include <vector>
#include <list>
#include <deque>
#include <array>
#include <set>
#include <map>
#include <unordered_set>
#include <unordered_map>
#include <queue>      // queue, priority_queue
#include <stack>

// 常用 typedef
using vi = vector<int>;
using vvi = vector<vector<int>>;
using si = unordered_set<int>;
using mii = unordered_map<int, int>;

// 一行构造
vector<int> v = {1, 2, 3};
unordered_set<int> s(v.begin(), v.end());
map<char, int> m = {{'a', 1}, {'b', 2}};

// 查看类型
cout << typeid(v).name() << endl; // 编译器相关
```

