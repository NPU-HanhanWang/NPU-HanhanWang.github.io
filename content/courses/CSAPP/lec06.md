# 内存布局、缓冲区溢出与联合体

## 适用对象
- 具备基础C语言编程能力
- 了解指针和数组基本概念
- 熟悉x86-64汇编基础

---

## 📚 第一讲：内存布局

### 1.1 x86-64 Linux 内存布局概述

```
地址空间 (2^47 = 128TB)
┌─────────────────────────────────────┐ 0x00007FFFFFFFFFFF
│           栈 (Stack)                │ ← 运行时栈 (8MB限制)
│          ↓ 向下增长                 │   局部变量
├─────────────────────────────────────┤
│                                     │
│           堆 (Heap)                 │ ← 动态分配
│          ↑ 向上增长                 │   malloc()/calloc()
├─────────────────────────────────────┤
│           数据段 (Data)             │ ← 全局变量、静态变量
│                                     │   字符串常量
├─────────────────────────────────────┤
│         代码段 (Text)               │ ← 可执行机器指令
│       / 共享库 (Shared Libs)       │   只读
└─────────────────────────────────────┘ 0x0000000000000000
```

### 1.2 内存分配示例

```c
#include <stdio.h>
#include <stdlib.h>

// 全局变量 - 存储在数据段
char big_array[1L << 24];   // 16 MB
char huge_array[1L << 31];  // 2 GB
int global = 0;             // 数据段

int main() {
    // 栈上的局部变量
    int local = 0;

    // 堆分配 - 在运行时动态分配
    void *phuge1 = malloc(1L << 28);   // 256 MB
    void *psmall1 = malloc(1L << 8);   // 256 B
    void *phuge2 = malloc(1L << 32);   // 4 GB (可能失败)
    void *psmall2 = malloc(1L << 8);   // 256 B

    printf("Stack (local):   %p\n", &local);
    printf("Heap (phuge1):   %p\n", phuge1);
    printf("Heap (psmall1):  %p\n", psmall1);
    printf("Global (big):    %p\n", big_array);
    printf("Global (huge):   %p\n", huge_array);
    printf("Code (main):     %p\n", main);

    // ❌ 不要忘记释放内存！
    free(phuge1);
    free(psmall1);
    free(phuge2);
    free(psmall2);
    return 0;
}
```

**典型输出（具体地址每次运行可能不同）：**
```
Stack (local):   0x7ffd1f4a8a3c
Heap (phuge1):   0x7f1234567890
Heap (psmall1):  0x7f1234abcdef
Global (big):    0x601060
Global (huge):   0x501060
Code (main):     0x4005d0
```

### 1.3 关键概念速查

| 存储区域   | 存储内容           | 生命周期               | 访问速度 |
| ---------- | ------------------ | ---------------------- | -------- |
| **栈**     | 局部变量、函数参数 | 函数调用期间           | 最快     |
| **堆**     | 动态分配的内存     | 手动控制 (malloc/free) | 较快     |
| **数据段** | 全局变量、静态变量 | 整个程序运行期         | 快       |
| **代码段** | 可执行代码         | 整个程序运行期         | 只读     |

### ⚠️ 常见陷阱
- **栈溢出**：递归过深或分配过大的局部数组
- **内存泄漏**：忘记调用 `free()`
- **悬挂指针**：释放后继续使用

---

## 📚 第二讲：结构体对齐与内存优化

### 2.1 结构体对齐规则

```c
#include <stdio.h>

// 每个结构体有自己的对齐要求 K
// K = 最大成员的对齐要求

// 示例1：对齐要求 K=8 (因为 double)
struct S1 {
    char c;      // 1字节，偏移0
    // 填充3字节
    int i;       // 4字节，偏移4
    double d;    // 8字节，偏移8
}; // 总大小 = 16字节 (8的倍数)

// 示例2：重排字段节省空间
struct S2 {
    double d;    // 8字节，偏移0
    int i;       // 4字节，偏移8
    char c;      // 1字节，偏移12
    // 填充3字节
}; // 总大小 = 16字节 (8的倍数)

// 示例3：优化排列
struct S3 {
    char c1;     // 1字节，偏移0
    char c2;     // 1字节，偏移1
    char c3;     // 1字节，偏移2
    int i;       // 4字节，偏移4
}; // 总大小 = 8字节 (4的倍数)

int main() {
    struct S1 s1;
    struct S2 s2;
    struct S3 s3;

    printf("sizeof(S1) = %zu\n", sizeof(s1)); // 16
    printf("sizeof(S2) = %zu\n", sizeof(s2)); // 16
    printf("sizeof(S3) = %zu\n", sizeof(s3)); // 8

    // ✅ 输出每个字段的偏移
    printf("S1: c@%zu, i@%zu, d@%zu\n",
           offsetof(struct S1, c),   // 0
           offsetof(struct S1, i),   // 4
           offsetof(struct S1, d));  // 8
    return 0;
}
```

### 2.2 结构体数组对齐

```c
// 结构体大小是 K 的倍数
// 起始地址是 K 的倍数
// 数组元素之间无填充

struct S3 {
    char c1;
    char c2;
    char c3;
    int i;
}; // K=4, size=8

int main() {
    struct S3 arr[3];  // 连续存储，无间隙

    for (int i = 0; i < 3; i++) {
        printf("arr[%d] @ %p (偏移 %td)\n",
               i, &arr[i],
               (char*)&arr[i] - (char*)arr);
    }
    // 输出：arr[0] @ 0x..., arr[1] @ 0x...+8, ...

    // 访问元素 j 在偏移 8*idx
    // 元素内部的字段 c1 在偏移 +0
    return 0;
}
```

### 💡 空间优化技巧

```c
// ❌ 不好的顺序（浪费空间）
struct BadOrder {
    char c;      // 1 + 3填充
    int i;       // 4
    char d;      // 1 + 3填充
    double f;    // 8
}; // 大小 = 20? 实际是 24 (对齐到8)

// ✅ 好的顺序（节省空间）
struct GoodOrder {
    double f;    // 8
    int i;       // 4
    char c;      // 1
    char d;      // 1 + 2填充
}; // 大小 = 16 (对齐到8)

// 原则：按数据类型大小从大到小排列
```

### 2.3 对齐规则总结

```c
// 快速参考卡片
/*
对齐规则：
1. 每个类型有自己的对齐要求
   - char: 1, short: 2, int: 4, long: 8, double: 8
   - 指针: 8 (x86-64)
   - 结构体: 最大成员的对齐值

2. 结构体内部：
   - 每个成员的偏移是它自己大小的倍数
   - 必要时添加填充字节

3. 结构体整体：
   - 大小是最大成员对齐值的倍数
   - 数组元素间无填充
*/
```

---

## 📚 第三讲：缓冲区溢出攻击

### 3.1 什么是缓冲区溢出

```c
#include <stdio.h>

// ❌ 危险函数示例
void dangerous_gets() {
    char buf[4];       // 只有4字节
    gets(buf);         // 无边界检查！
    printf("%s\n", buf);
}

// ✅ 安全版本
void safe_fgets() {
    char buf[4];
    fgets(buf, sizeof(buf), stdin);  // 限制输入长度
    printf("%s\n", buf);
}

int main() {
    // 输入 "Hello" 会导致溢出！
    // dangerous_gets();  // ❌ 可能崩溃或安全漏洞
    safe_fgets();        // ✅ 安全
    return 0;
}
```

### 3.2 栈溢出原理图示

```
正常栈布局 (调用echo前)
┌─────────────────┐ 高地址
│   返回地址       │ ← 被覆盖的目标
├─────────────────┤
│   保存的RBP      │
├─────────────────┤
│   buf[3]         │
│   buf[2]         │
│   buf[1]         │ ← 输入的字符串从这里开始
│   buf[0]         │ 低地址
└─────────────────┘

溢出后 (输入 "01234567890123456789")
┌─────────────────┐ 高地址
│   0x34333231     │ ← 返回地址被覆盖为 0x34333231
├─────────────────┤
│   0x38373635     │
├─────────────────┤
│   0x32313039     │ ← 继续填充
│   0x36353433     │
│   ...            │
└─────────────────┘
```

### 3.3 完整攻击示例

```c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

// 攻击者想要执行的代码
void smash() {
    printf("I've been smashed!\n");
    exit(0);
}

// ❌ 漏洞函数
void echo() {
    char buf[4];
    gets(buf);        // 危险！
    puts(buf);
}

int main() {
    printf("smash address: %p\n", smash);
    echo();
    return 0;
}

/*
攻击字符串构造 (假设smash地址 0x4006c8)：
[填充32字节] + [地址 0x4006c8] (小端序)
"01234567890123456789012345678901\xc8\x06\x40\x00\x00\x00\x00"

注意：需要知道准确地址，这就是为什么需要地址随机化防护
*/
```

### 3.4 危险函数列表

| ❌ 危险函数    | ✅ 安全替代                 |
| ------------- | -------------------------- |
| `gets()`      | `fgets(buf, size, stdin)`  |
| `strcpy()`    | `strncpy(dest, src, n)`    |
| `strcat()`    | `strncat(dest, src, n)`    |
| `scanf("%s")` | `fgets()` 或 `%ns` 格式    |
| `sprintf()`   | `snprintf(buf, size, ...)` |

---

## 📚 第四讲：防护机制

### 4.1 栈金丝雀 (Stack Canary)

```c
#include <stdio.h>

// 带有栈保护的函数
void protected_echo() {
    char buf[4];
    // 编译器自动插入：
    // canary = __stack_chk_guard  (在栈上)
    gets(buf);        // 仍然危险，但会被检测
    puts(buf);
    // 函数返回前检查 canary
    // if (canary != __stack_chk_guard) abort();
}

int main() {
    // 编译时使用 -fstack-protector
    protected_echo();
    return 0;
}
```

**编译选项：**
```bash
# 启用栈保护
gcc -fstack-protector -o prog prog.c

# 关闭栈保护（不推荐）
gcc -fno-stack-protector -o prog prog.c

# 查看保护效果
gcc -fstack-protector -S prog.c  # 生成汇编查看
```

### 4.2 地址空间布局随机化 (ASLR)

```bash
# 查看 ASLR 状态
cat /proc/sys/kernel/randomize_va_space
# 0=关闭, 1=部分, 2=完全随机化

# 临时关闭 (不推荐)
echo 0 > /proc/sys/kernel/randomize_va_space

# 永久配置
sudo sysctl -w kernel.randomize_va_space=2
```

### 4.3 不可执行栈

```bash
# 检查程序的内存保护
readelf -l prog | grep GNU_STACK

# 强制启用不可执行栈
gcc -z noexecstack -o prog prog.c

# 禁用 (非常危险)
gcc -z execstack -o prog prog.c
```

### 4.4 返回导向编程 (ROP) 原理

```c
// ROP 攻击利用现有代码片段（gadgets）
// 每个 gadget 以 ret 指令结尾

// 示例 gadget 1: 从函数尾部提取
long ab_plus_c(long a, long b, long c) {
    return a * b + c;
}
// 汇编可能包含: pop %rax; ret

// 示例 gadget 2: 从库函数中提取
// 攻击者串联多个 gadgets 完成攻击

// 防护：
// 1. 栈金丝雀可以检测篡改
// 2. 控制流完整性 (CFI)
// 3. 地址随机化使 gadgets 地址不可预测
```

### 4.5 多层防护对比

| 防护层       | 作用         | 绕过难度    |
| ------------ | ------------ | ----------- |
| **代码审查** | 避免漏洞     | N/A         |
| **栈金丝雀** | 检测栈破坏   | 中          |
| **ASLR**     | 隐藏地址     | 中-高       |
| **NX 位**    | 阻止执行栈   | 高（需ROP） |
| **CFI**      | 控制流完整性 | 很高        |

---

## 📚 第五讲：联合体 (Union)

### 5.1 联合体基础

```c
#include <stdio.h>
#include <string.h>

// 联合体：所有成员共享同一块内存
union Data {
    int i;          // 4字节
    float f;        // 4字节
    char str[20];   // 20字节
}; // 大小为 max(4,4,20) = 20

int main() {
    union Data data;

    // 一次只能使用一个成员
    data.i = 10;
    printf("data.i = %d\n", data.i);       // 10

    data.f = 3.14f;
    printf("data.f = %f\n", data.f);       // 3.14
    // ❌ data.i 现在无效（被覆盖）
    printf("data.i = %d (垃圾值)\n", data.i);

    // 存储字符串
    strcpy(data.str, "Hello");
    printf("data.str = %s\n", data.str);   // Hello
    // ❌ data.f 和 data.i 无效

    printf("sizeof(Data) = %zu\n", sizeof(union Data)); // 20
    return 0;
}
```

### 5.2 联合体 vs 结构体

| 特性     | 结构体 (struct)     | 联合体 (union)    |
| -------- | ------------------- | ----------------- |
| **内存** | 所有成员各自占用    | 所有成员共享内存  |
| **大小** | 各成员大小之和+填充 | 最大成员大小      |
| **使用** | 同时使用多个字段    | 一次只用一个字段  |
| **应用** | 记录多个相关值      | 节省内存/类型转换 |

```c
// 对比示例
struct MyStruct {
    int i;
    float f;
    char c;
}; // 大小 ≈ 12字节

union MyUnion {
    int i;
    float f;
    char c;
}; // 大小 = 4字节 (最大成员大小)

printf("struct: %zu\n", sizeof(struct MyStruct)); // 12
printf("union:  %zu\n", sizeof(union MyUnion));   // 4
```

### 5.3 联合体实践应用

#### 应用1：类型标签（Sum Type）

```c
#include <stdio.h>

// 带类型标签的联合体
enum Type { INT, FLOAT, STRING };

struct Value {
    enum Type type;
    union {
        int i;
        float f;
        char *s;
    } data;  // 匿名联合体（C11）
};

void print_value(struct Value v) {
    switch(v.type) {
        case INT:
            printf("整数: %d\n", v.data.i);
            break;
        case FLOAT:
            printf("浮点: %f\n", v.data.f);
            break;
        case STRING:
            printf("字符串: %s\n", v.data.s);
            break;
    }
}

int main() {
    struct Value v1 = {INT, .data.i = 42};
    struct Value v2 = {FLOAT, .data.f = 3.14f};
    struct Value v3 = {STRING, .data.s = "Hello"};

    print_value(v1);
    print_value(v2);
    print_value(v3);
    return 0;
}
```

#### 应用2：位模式访问（字节序检查）

```c
#include <stdio.h>

// 检查系统字节序
union EndianCheck {
    int i;
    unsigned char c[4];
};

void check_endian() {
    union EndianCheck check;
    check.i = 0x01234567;

    // 小端：低地址存储最低有效字节
    // 大端：低地址存储最高有效字节
    if (check.c[0] == 0x67) {
        printf("小端序 (Little Endian)\n");
    } else if (check.c[0] == 0x01) {
        printf("大端序 (Big Endian)\n");
    }
}

int main() {
    check_endian();
    return 0;
}
```

### 5.4 字节序与联合体

```c
#include <stdio.h>

union ByteOrder {
    unsigned long l;
    unsigned int i[2];
    unsigned short s[4];
    unsigned char c[8];
};

void print_bytes(union ByteOrder *u) {
    for(int i = 0; i < 8; i++) {
        printf("c[%d] = 0x%02x\n", i, u->c[i]);
    }
    printf("Long: 0x%016lx\n", u->l);
    printf("Ints: 0x%08x, 0x%08x\n", u->i[0], u->i[1]);
    printf("Shorts: 0x%04x, 0x%04x, 0x%04x, 0x%04x\n",
           u->s[0], u->s[1], u->s[2], u->s[3]);
}

int main() {
    union ByteOrder u;

    // 设置字节
    for(int i = 0; i < 8; i++) {
        u.c[i] = 0xf0 + i;  // 0xf0, 0xf1, 0xf2, ...
    }

    printf("=== x86-64 (小端) 输出 ===\n");
    print_bytes(&u);

    // 预期输出（小端）：
    // Long: 0xf7f6f5f4f3f2f1f0
    // Ints: 0xf3f2f1f0, 0xf7f6f5f4
    // Shorts: 0xf1f0, 0xf3f2, 0xf5f4, 0xf7f6

    return 0;
}
```

---

## 📚 第六讲：实际案例与教训

### 6.1 经典案例

#### 案例1：Morris 蠕虫 (1988)
```c
// finger 服务器的漏洞代码（简化）
void fingerd(char *username) {
    char buf[512];
    strcpy(buf, username);  // ❌ 无边界检查
    // ... 处理请求
}

// 攻击者发送超长用户名
// 覆盖返回地址执行恶意代码
// 感染了约10%的互联网计算机
```

#### 案例2：AOL IM 战争 (1999)
```c
// AOL 在自己的客户端中利用了缓冲区溢出
// 用于检测和阻止微软的 MSN Messenger
// 攻击代码返回特定签名给服务器
```

### 6.2 防御最佳实践

```c
// ✅ 安全编程检查清单

// 1. 使用安全的字符串函数
char buf[100];
fgets(buf, sizeof(buf), stdin);  // ✅ 限制长度
strncpy(dest, src, n);           // ✅ 指定最大复制长度
snprintf(buf, size, "%s", src);  // ✅ 安全格式化

// 2. 验证输入长度
int len = strlen(input);
if (len >= MAX_SIZE) {
    // 处理错误
    return -1;
}

// 3. 使用编译器保护
// gcc -fstack-protector -D_FORTIFY_SOURCE=2

// 4. 启用地址随机化
// sudo sysctl -w kernel.randomize_va_space=2

// 5. 避免危险函数
// ❌ gets(), strcpy(), sprintf(), scanf("%s")
```

### 6.3 核心要点总结

- [ ] **理解内存布局**：栈、堆、数据段、代码段的作用和特点
- [ ] **结构体对齐**：了解对齐规则，优化字段顺序节省空间
- [ ] **缓冲区溢出**：认识到危险函数的危害
- [ ] **栈保护机制**：理解金丝雀、ASLR、NX位的原理
- [ ] **安全编码**：使用安全函数替代危险函数
- [ ] **联合体应用**：掌握节省内存和类型转换的技巧
- [ ] **字节序**：理解大小端对数据表示的影响

---

## 📚 速查卡片

### 内存布局速查
```
高地址: 栈 (局部变量)
        ↓ 增长
        ︙
        ↑ 增长
        堆 (动态分配)
        数据段 (全局/静态)
低地址: 代码段 (只读)
```

### 安全函数对照表
| 危险函数       | 安全替代                   |
| -------------- | -------------------------- |
| `gets()`       | `fgets(buf, size, stdin)`  |
| `strcpy(a,b)`  | `strncpy(a,b,n)`           |
| `strcat(a,b)`  | `strncat(a,b,n)`           |
| `sprintf(...)` | `snprintf(buf, size, ...)` |
| `scanf("%s")`  | `fgets()` 或 `"%ns"`       |

### 对齐规则
- char: 1, short: 2, int: 4, long: 8, pointer: 8
- 结构体对齐 = 最大成员对齐
- 结构体大小 = 对齐值的倍数

### 联合体要点
- 所有成员共享内存
- 大小 = 最大成员大小
- 一次只使用一个成员
- 可用于字节序检测和类型转换