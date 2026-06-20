# 链接（Linking）


# 1. 链接概述

## 1.1 什么是链接？

链接（Linking）是将多个目标文件（Object Files）和库文件组合成一个可执行文件的过程。它是编译过程的最后一步，也是程序从源代码到可执行文件的桥梁。

## 1.2 为什么需要链接器？

### 模块化（Modularity）

- 程序可以拆分成多个小的源文件，便于管理和维护
- 可以构建通用函数库（如数学库、标准C库）
- 头文件（.h）声明类型，库文件提供实现

### 效率（Efficiency）

**时间效率**：
- 分离编译（Separate Compilation）：修改一个源文件只需重新编译该文件，然后重新链接
- 可以并行编译多个源文件

**空间效率**：
- **静态链接**：可执行文件只包含实际使用的库代码
- **动态链接**：可执行文件不包含库代码，运行时共享库的单一副本可被多个进程共享

## 1.3 编译驱动过程

```
linux> gcc -Og -o prog main.c sum.c
linux> ./prog
```

编译器驱动程序（Compiler Driver）自动调用：
1. 预处理器（cpp）→ `.i` 文件
2. 编译器（cc1）→ `.s` 汇编文件
3. 汇编器（as）→ `.o` 目标文件
4. 链接器（ld）→ 可执行文件

---

# 2. 链接器做什么？

链接器执行两个主要步骤：

## 2.1 步骤一：符号解析（Symbol Resolution）

程序定义和引用符号（全局变量和函数）：
```c
void swap() {...}    // 定义符号 swap
swap();              // 引用符号 swap
int *xp = &x;        // 定义符号 xp，引用符号 x
```

符号定义存储在目标文件的符号表（Symbol Table）中，符号表是一个数组，每个条目包含：
- 名称（Name）
- 大小（Size）
- 位置（Location）

链接器将每个符号引用与**恰好一个**符号定义关联。

## 2.2 步骤二：重定位（Relocation）

1. 将独立的代码段和数据段合并成单一段
2. 将符号从 `.o` 文件中的相对位置重定位到可执行文件中的绝对内存位置
3. 更新所有对这些符号的引用以反映新位置

---

# 3. 目标文件（Object Files）

## 3.1 三种目标文件类型

| 类型             | 文件扩展名 | 描述                                                                                   |
| ---------------- | ---------- | -------------------------------------------------------------------------------------- |
| 可重定位目标文件 | `.o`       | 可与其他可重定位目标文件合并，形成可执行文件。每个 `.o` 文件由恰好一个 `.c` 源文件生成 |
| 可执行目标文件   | `a.out`    | 可直接复制到内存并执行                                                                 |
| 共享目标文件     | `.so`      | 可在加载时或运行时动态链接（Windows中称为DLL）                                         |

## 3.2 ELF（Executable and Linkable Format）

Linux/Unix的标准二进制格式，统一用于三种目标文件类型。

### ELF头部（ELF Header）
```
+------------------+
| ELF Header       |  ← 字长、字节序、文件类型、机器类型等
+------------------+
| Segment Header   |  ← 页大小、虚拟地址内存段、段大小（仅可执行文件）
+------------------+
| .text            |  ← 代码段
+------------------+
| .rodata          |  ← 只读数据（跳转表、字符串常量）
+------------------+
| .data            |  ← 已初始化全局变量
+------------------+
| .bss             |  ← 未初始化全局变量（有节头但不占空间）
+------------------+
| .symtab          |  ← 符号表
+------------------+
| .rel.text        |  ← .text段的重定位信息
+------------------+
| .rel.data        |  ← .data段的重定位信息
+------------------+
| .debug           |  ← 调试信息（gcc -g）
+------------------+
| Section Header   |  ← 各节的偏移和大小
+------------------+
```

### `.bss` 段说明
- 全称："Block Started by Symbol" 或 "Better Save Space"
- 有节头（Section Header）但**不占用磁盘空间**
- 存储未初始化的全局变量和静态变量
- 程序加载时被初始化为0

---

# 4. 链接器符号（Linker Symbols）

## 4.1 符号分类

| 符号类型                 | 描述                          | 示例                           |
| ------------------------ | ----------------------------- | ------------------------------ |
| **全局符号（Global）**   | 由模块m定义，可被其他模块引用 | 非静态C函数、非静态全局变量    |
| **外部符号（External）** | 被模块m引用，但由其他模块定义 | 在其他文件中定义的函数或变量   |
| **局部符号（Local）**    | 仅在模块m中定义和引用         | `static` 修饰的C函数和全局变量 |

> **注意**：局部链接符号 ≠ 局部程序变量（局部变量存在栈中）

## 4.2 符号识别示例

```c
// symbols.c
int incr = 1;
static int foo(int a) {
    int b = a + incr;
    return b;
}
int main(int argc, char* argv[]) {
    printf("%d\n", foo(5));
    return 0;
}
```

符号表中的名称：
- ✅ `incr` - 全局符号
- ✅ `foo` - 局部符号（static）
- ✅ `main` - 全局符号
- ✅ `printf` - 外部符号
- ❌ `a` - 局部变量（栈中）
- ❌ `argc` - 局部变量（栈中）
- ❌ `argv` - 局部变量（栈中）
- ❌ `b` - 局部变量（栈中）
- ❌ `"%d\n"` - 字符串常量（.rodata段）

使用 `readelf -s symbols.o` 可查看符号表。

## 4.3 静态局部变量

```c
static int x = 15;        // 全局静态变量，在 .data 中

int f() {
    static int x = 17;    // 局部静态变量，在 .data 中
    return x++;
}

int g() {
    static int x = 19;    // 局部静态变量，在 .data 中
    return x += 14;
}

int h() {
    return x += 27;       // 引用全局静态变量 x
}
```

编译器为每个 `x` 定义在 `.data` 中分配空间，并创建具有唯一名称的局部符号（如 `x`、`x.1721`、`x.1724`）。

---

# 5. 符号解析规则

## 5.1 强符号与弱符号

| 符号类型            | 强（Strong） | 弱（Weak） |
| ------------------- | ------------ | ---------- |
| 函数                | ✅            | ❌          |
| 已初始化的全局变量  | ✅            | ❌          |
| 未初始化的全局变量  | ❌            | ✅          |
| `extern` 声明的变量 | ❌            | ✅          |

## 5.2 链接器规则

**规则1：多个强符号不允许**
- 每个项目只能定义一次
- 违反会导致链接错误

**规则2：一个强符号 + 多个弱符号 → 选择强符号**
- 弱符号的引用解析到强符号

**规则3：多个弱符号 → 任意选择一个**
- 可使用 `gcc -fno-common` 覆盖此行为

## 5.3 链接器谜题分析

### 场景1：两个强符号
```
// p1.c              // p2.c
int x;               int x = 15213;  ← 强符号
                     int x = 15213;  ← 强符号（重复定义）
```
❌ **链接错误**：两个强符号 `x`

### 场景2：弱符号 + 强符号
```
// p1.c              // p2.c
int x;  ← 弱符号      int x = 15213;  ← 强符号
```
✅ 引用指向强符号（`x = 15213`）

### 场景3：类型不匹配
```
// p1.c              // p2.c
int x = 15213;       double x;
```
⚠️ 编译链接成功，但可能引发错误！链接器不进行类型检查。

### 场景4：危险覆盖
```
// p1.c              // p2.c
int x;               int y = 15213;
int y;               // 另一个弱符号
```
⚠️ 弱符号规则可能导致 `p2.c` 中对 `x` 的写入覆盖 `y` 的内存！

## 5.4 类型不匹配示例

```c
// p1.c
int x = 15213;

// p2.c
double x;

int main() {
    printf("%f\n", x);    // 可能打印 0.000000 或其他奇怪值
    return 0;
}
```
编译通过但输出不正确——链接器不进行类型检查！

---

# 6. 全局变量最佳实践

✅ **能不用就不用**
- 使用 `static`（如果可以）
- 定义全局变量时务必初始化
- 引用外部全局变量时使用 `extern`（作为弱符号）
- 使用 `extern` 也会导致链接错误（如果未在任何文件中定义）

## 6.1 使用 `extern` 的示例

**global.h**
```c
extern int g;
int f();
```

**c1.c**
```c
#include "global.h"
int f() { return g + 1; }
```

**c2.c**
```c
#include <stdio.h>
#include "global.h"

int g = 0;    // 定义强符号 g

int main(int argc, char* argv[]) {
    int t = f();
    printf("Calling f yields %d\n", t);
    return 0;
}
```

---

# 7. 重定位（Relocation）详解

## 7.1 重定位条目示例

`main.c`:
```c
int array[2] = {1, 2};

int main(int argc, char** argv) {
    int val = sum(array, 2);
    return val;
}
```

**可重定位目标文件的反汇编**：
```
0000000000000000 <main>:
   0: 48 83 ec 08       sub    $0x8,%rsp
   4: be 02 00 00 00    mov    $0x2,%esi
   9: bf 00 00 00 00    mov    $0x0,%edi
                        a: R_X86_64_32 array
   e: e8 00 00 00 00    callq  13 <main+0x13>  # sum()
                        f: R_X86_64_PC32 sum-0x4
  13: 48 83 c4 08       add    $0x8,%rsp
  17: c3                retq
```

**重定位条目类型**：
- `R_X86_64_32`：32位绝对地址重定位
- `R_X86_64_PC32`：PC相对地址重定位（32位偏移）

## 7.2 重定位后的可执行文件

```
00000000004004d0 <main>:
  4004d0: 48 83 ec 08       sub    $0x8,%rsp
  4004d4: be 02 00 00 00    mov    $0x2,%esi
  4004d9: bf 18 10 60 00    mov    $0x601018,%edi  # array地址
  4004de: e8 05 00 00 00    callq  4004e8 <sum>     # 调用sum()
  4004e3: 48 83 c4 08       add    $0x8,%rsp
  4004e7: c3                retq

00000000004004e8 <sum>:
  4004e8: b8 00 00 00 00    mov    $0x0,%eax
  4004ed: ba 00 00 00 00    mov    $0x0,%edx
  4004f2: eb 09             jmp    4004fd <sum+0x15>
  4004f4: 48 63 ca          movslq %edx,%rcx
  4004f7: 03 04 8f          add    (%rdi,%rcx,4),%eax
  4004fa: 83 c2 01          add    $0x1,%edx
  4004fd: 39 f2             cmp    %esi,%edx
  4004ff: 7c f3             jl     4004f4 <sum+0xc>
  400501: f3 c3             repz retq
```

`callq` 使用 **PC相对寻址**：`0x4004e8 = 0x4004e3 + 0x5`

## 7.3 可执行文件加载

加载器（Loader）将可执行文件复制到内存中执行：

```
+------------------+ 高地址
| 栈 (Stack)       |
| ↓                |
|                  |
| ↑                |
| 堆 (Heap)        |
| .bss             |  ← 未初始化数据
| .data            |  ← 已初始化数据
| .rodata          |  ← 只读数据
| .text            |  ← 代码
+------------------+ 低地址
```

---

# 8. 静态库（Static Libraries）

## 8.1 打包函数的传统方法

**问题**：如何打包常用函数（数学、I/O、内存管理、字符串操作）？

| 方案                   | 优点   | 缺点             |
| ---------------------- | ------ | ---------------- |
| 所有函数放在一个源文件 | 简单   | 空间和时间效率低 |
| 每个函数单独一个源文件 | 更高效 | 程序员负担重     |

## 8.2 静态库解决方案

**静态库（.a归档文件）**：
- 将相关可重定位目标文件连接成单个文件，带索引（归档）
- 链接器查找归档文件来解析未解析的外部引用
- 如果归档成员文件解析引用，则链接到可执行文件

**创建静态库**：
```
gcc -c addvec.c multvec.c
ar rcs libvector.a addvec.o multvec.o
```

**使用静态库**：
```
gcc -static -o prog main2.o -L. -lvector
```

## 8.3 标准库示例

- **libc.a**：4.6 MB，1496个目标文件（I/O、内存分配、信号处理、字符串、日期时间、随机数、整数数学）
- **libm.a**：2 MB，444个目标文件（浮点数学：sin、cos、tan、log、exp、sqrt等）

## 8.4 使用静态库示例

**main2.c**:
```c
#include <stdio.h>
#include "vector.h"

int x[2] = {1, 2};
int y[2] = {3, 4};
int z[2];

int main(int argc, char* argv[]) {
    addvec(x, y, z, 2);
    printf("z = [%d %d]\n", z[0], z[1]);
    return 0;
}
```

**libvector.a**包含：
```c
// addvec.c
void addvec(int *x, int *y, int *z, int n) {
    int i;
    for (i = 0; i < n; i++)
        z[i] = x[i] + y[i];
}

// multvec.c
void multvec(int *x, int *y, int *z, int n) {
    int i;
    for (i = 0; i < n; i++)
        z[i] = x[i] * y[i];
}
```

## 8.5 链接器的扫描算法

```
解析外部引用的算法：
1. 按命令行顺序扫描 .o 和 .a 文件
2. 维护当前未解析引用列表
3. 遇到每个 .o 或 .a 文件时，尝试解析列表中的引用
4. 扫描结束仍有未解析引用 → 报错
```

**⚠️ 命令行顺序很重要！**
```bash
# ❌ 错误：库在前
gcc -L. -lmine libtest.o
# libtest.o: 未定义引用 'libfun'

# ✅ 正确：库在后
gcc -L. libtest.o -lmine
```

**技巧**：将库放在命令行末尾。

---

# 9. 共享库（Shared Libraries）

## 9.1 静态库的缺点

1. **存储重复**：每个可执行文件都包含相同的库代码
2. **运行重复**：每个运行进程都有独立的库副本
3. **更新困难**：系统库的小错误修复需要所有应用重新链接
   - 例如：glibc CVE-2015-7547（getaddrinfo栈溢出漏洞）

## 9.2 共享库解决方案

**共享库**：可在加载时或运行时动态加载和链接的目标文件
- Windows中称为DLL（Dynamic Link Libraries）
- Linux中为 `.so` 文件（Shared Object）

**两大链接时机**：

### 加载时链接（Load-time Linking）
- 可执行文件首次加载时自动进行
- Linux中由动态链接器（`ld-linux.so`）处理
- 标准C库（`libc.so`）通常采用此方式

### 运行时链接（Run-time Linking）
- 程序启动后通过 `dlopen()` 接口进行
- 用于：软件分发、高性能Web服务器、运行时库插桩（Interpositioning）

## 9.3 共享库的共享特性

```
+------------------+
| 进程A的内存      |
| +--------------+ |
| | libc.so      | |  ← 物理内存中只有一份libc.so
| +--------------+ |
+------------------+
         ↓
+------------------+
| 进程B的内存      |
| +--------------+ |
| | libc.so      | |
| +--------------+ |
+------------------+
```

## 9.4 动态库信息

`.interp` 段：指定动态链接器（如 `ld-linux.so`）
`.dynamic` 段：指定需要的动态库名称

**查看依赖库**：
```bash
unix> ldd csim-ref
    linux-vdso.so.1 => (0x00007ffc195f5000)
    libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f345eda6000)
    /lib64/ld-linux-x86-64.so.2 (0x00007f345f181000)
```

## 9.5 创建共享库

```bash
gcc -shared -fPIC -o libvector.so addvec.c multvec.c
```

- `-fPIC`：位置无关代码（Position Independent Code）
- `-shared`：创建共享库

## 9.6 使用共享库

**加载时链接**：
```bash
gcc -o prog main2.o -L. -lvector
./prog
```

**运行时链接（使用dlopen）**：
```c
#include <stdio.h>
#include <stdlib.h>
#include <dlfcn.h>

int x[2] = {1, 2};
int y[2] = {3, 4};
int z[2];

int main(int argc, char* argv[]) {
    void *handle;
    void (*addvec)(int *, int *, int *, int);
    char *error;

    // 动态加载共享库
    handle = dlopen("./libvector.so", RTLD_LAZY);
    if (!handle) {
        fprintf(stderr, "%s\n", dlerror());
        exit(1);
    }

    // 获取函数指针
    addvec = dlsym(handle, "addvec");
    if ((error = dlerror()) != NULL) {
        fprintf(stderr, "%s\n", error);
        exit(1);
    }

    // 调用函数
    addvec(x, y, z, 2);
    printf("z = [%d %d]\n", z[0], z[1]);

    // 卸载库
    if (dlclose(handle) < 0) {
        fprintf(stderr, "%s\n", dlerror());
        exit(1);
    }
    return 0;
}
```

**编译运行时链接程序**：
```bash
gcc -o prog main.c -ldl
```

---

# 10. 总结与关键要点

## 10.1 链接器功能总结

```
        ┌─────────────────────────────────────┐
        │         链接器 (Linker)             │
        ├─────────────────────────────────────┤
        │ 1. 符号解析 (Symbol Resolution)     │
        │    - 收集所有符号定义               │
        │    - 解析所有符号引用               │
        │    - 强/弱符号规则                  │
        ├─────────────────────────────────────┤
        │ 2. 重定位 (Relocation)              │
        │    - 合并代码和数据段               │
        │    - 分配最终内存地址               │
        │    - 更新所有引用                   │
        └─────────────────────────────────────┘
```

## 10.2 关键概念对比

| 特性     | 静态链接           | 加载时动态链接   | 运行时动态链接     |
| -------- | ------------------ | ---------------- | ------------------ |
| 链接时机 | 编译时             | 程序加载时       | 程序运行时         |
| 文件类型 | `.a` 归档          | `.so` 共享库     | `.so` 共享库       |
| 内存占用 | 大（每个程序独立） | 小（共享）       | 小（共享）         |
| 更新库   | 需重新链接         | 替换库文件即可   | 替换库文件即可     |
| 启动速度 | 快                 | 略慢（需加载库） | 最慢（运行时加载） |

## 10.3 常见错误与调试

**常见链接错误**：
- 重复定义（Multiple strong symbols）
- 未定义引用（Undefined reference）
- 命令行顺序错误

**调试工具**：
- `readelf -s`：查看符号表
- `objdump -d`：反汇编目标文件
- `ldd`：查看动态库依赖
- `nm`：列出目标文件中的符号

<details>
<summary><b>💡 记忆口诀</b></summary>

> **强符号唯一定，强弱相遇强胜出，弱弱相遇随缘选，链接器不查类型。**

</details>