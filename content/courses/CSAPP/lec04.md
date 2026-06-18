# x86-64 机器级编程教程

## 前置知识

本教程假设你已掌握：
- C语言基础（变量、函数、控制流）
- 基本的二进制和十六进制表示
- 对计算机内存和寄存器的初步理解

## 目录
1. [x86-64 架构概览](#1-x86-64-架构概览)
2. [寄存器与数据格式](#2-寄存器与数据格式)
3. [寻址模式](#3-寻址模式)
4. [常用指令](#4-常用指令)
5. [条件码（Condition Codes）](#5-条件码condition-codes)
6. [条件分支（Conditional Branches）](#6-条件分支conditional-branches)
7. [条件传送（Conditional Moves）](#7-条件传送conditional-moves)
8. [循环（Loops）](#8-循环loops)
9. [switch 语句与跳转表](#9-switch-语句与跳转表)
10. [速查卡片](#10-速查卡片)

---

## 1. x86-64 架构概览

### 1.1 从 C 到可执行程序

```mermaid
graph LR
    C[C源代码.c] -->|gcc -S| ASM[汇编代码.s]
    ASM -->|gcc -c| OBJ[目标代码.o]
    OBJ -->|链接| EXE[可执行文件]
    EXE -->|objdump -d| DISASM[反汇编代码]
```

**关键命令：**
```bash
# 生成汇编代码（.s文件）
gcc -Og -S sum.c

# 查看反汇编
objdump -d sum

# 在gdb中反汇编
gdb sum
(gdb) disas sumstore
```

### 1.2 x86-64 程序视图

```
┌─────────────────────────────────────┐
│           CPU (中央处理器)           │
│  ┌─────────────────────────────┐    │
│  │ 程序计数器 (PC/%rip)         │    │ ← 指向下一条要执行的指令
│  ├─────────────────────────────┤    │
│  │ 条件码 (EFLAGS)              │    │ ← ZF, SF, OF, CF
│  │  ZF SF OF CF                │    │
│  ├─────────────────────────────┤    │
│  │ 通用寄存器 (16个)            │    │
│  │  %rax, %rbx, %rcx, ...      │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
         ↑              ↑
    ┌────┴────┐   ┌────┴────┐
    │ 内存    │   │  I/O    │
    └─────────┘   └─────────┘
```

---

## 2. 寄存器与数据格式

### 2.1 整数寄存器

x86-64 有 **16 个通用寄存器**，每个 64 位（8 字节）：

| 64位 (quad)  | 32位 (double)  | 16位 (word)    | 8位 (byte)     | 用途         |
| ------------ | -------------- | -------------- | -------------- | ------------ |
| `%rax`       | `%eax`         | `%ax`          | `%al`          | 返回值       |
| `%rbx`       | `%ebx`         | `%bx`          | `%bl`          | 被调用者保存 |
| `%rcx`       | `%ecx`         | `%cx`          | `%cl`          | 第4个参数    |
| `%rdx`       | `%edx`         | `%dx`          | `%dl`          | 第3个参数    |
| `%rsi`       | `%esi`         | `%si`          | `%sil`         | 第2个参数    |
| `%rdi`       | `%edi`         | `%di`          | `%dil`         | 第1个参数    |
| `%rbp`       | `%ebp`         | `%bp`          | `%bpl`         | 帧指针       |
| `%rsp`       | `%esp`         | `%sp`          | `%spl`         | 栈指针       |
| `%r8`-`%r15` | `%r8d`-`%r15d` | `%r8w`-`%r15w` | `%r8b`-`%r15b` | 额外寄存器   |

💡 **注意：** 对于 `%r8`-`%r15`，访问低8位是 `%r8b`（不像 `%rax` 有 `%al`）。

### 2.2 数据格式后缀

| 后缀 | 大小  | C类型         |
| ---- | ----- | ------------- |
| `b`  | 1字节 | `char`        |
| `w`  | 2字节 | `short`       |
| `l`  | 4字节 | `int`         |
| `q`  | 8字节 | `long` / 指针 |

```assembly
movl $10, %eax    # 4字节操作
movq $10, %rax    # 8字节操作
movb $10, %al     # 1字节操作
```

### 2.3 写低32位会清零高32位

⚠️ **重要规则：** 任何生成32位值的指令会自动将高32位清零。

```assembly
movabsq $0x0011223344556677, %rax   # %rax = 0011223344556677
movl    $-1, %eax                   # %rax = 00000000FFFFFFFF
# 而不是 00112233FFFFFFFF！
```

✅ **正确理解：**
```assembly
movabsq $0x0011223344556677, %rax
movl $-1, %eax        # %rax = 0x00000000FFFFFFFF (高位清零)
movq $-1, %rax        # %rax = 0xFFFFFFFFFFFFFFFF (全部置1)
```

❌ **常见错误：** 认为 `movl` 只改变低32位。

---

## 3. 寻址模式

### 3.1 通用形式

```
D(%base, %index, S) = Memory[%base + %index * S + D]
```

| 组件     | 说明         | 限制               |
| -------- | ------------ | ------------------ |
| `D`      | 位移（常量） | 1、2或4字节        |
| `%base`  | 基址寄存器   | 任意16个之一       |
| `%index` | 索引寄存器   | 除 `%rsp` 外的任意 |
| `S`      | 比例因子     | 1, 2, 4, 或 8      |

### 3.2 特殊形式

| 语法              | 等价C表达式        |
| ----------------- | ------------------ |
| `(%rsi)`          | `*rsi`             |
| `(%rsi, %rdi)`    | `*(rsi + rdi)`     |
| `D(%rsi, %rdi)`   | `*(rsi + rdi + D)` |
| `(%rsi, %rdi, S)` | `*(rsi + rdi * S)` |
| `D(, %rdi, S)`    | `*(rdi * S + D)`   |

### 3.3 计算示例

假设 `%rdx = 0xF000`, `%rcx = 0x0100`

| 表达式            | 地址计算         | 结果    |
| ----------------- | ---------------- | ------- |
| `0x8(%rdx)`       | 0xF000 + 0x8     | 0xF008  |
| `(%rdx, %rcx)`    | 0xF000 + 0x100   | 0xF100  |
| `(%rdx, %rcx, 4)` | 0xF000 + 4×0x100 | 0xF400  |
| `0x80(, %rdx, 2)` | 2×0xF000 + 0x80  | 0x1E080 |

---

## 4. 常用指令

### 4.1 数据传送指令

| 指令           | 作用           | 示例                                |
| -------------- | -------------- | ----------------------------------- |
| `movq S, D`    | 传送8字节      | `movq %rax, (%rsi)`                 |
| `movl S, D`    | 传送4字节      | `movl $10, %eax`                    |
| `movw S, D`    | 传送2字节      | `movw %ax, (%rdi)`                  |
| `movb S, D`    | 传送1字节      | `movb %al, (%rdi)`                  |
| `movabsq S, D` | 传送64位立即数 | `movabsq $0x1122334455667788, %rax` |
| `movzbl S, D`  | 零扩展传送     | `movzbl %al, %eax`                  |

### 4.2 算术与逻辑指令

| 指令         | 作用               | 示例               |
| ------------ | ------------------ | ------------------ |
| `addq S, D`  | D += S             | `addq %rax, %rbx`  |
| `subq S, D`  | D -= S             | `subq %rax, %rbx`  |
| `imulq S, D` | D *= S             | `imulq %rax, %rbx` |
| `xorq S, D`  | D ^= S             | `xorq %rax, %rax`  |
| `shrq S, D`  | D >>= S (逻辑右移) | `shrq $1, %rdi`    |
| `sarq S, D`  | D >>= S (算术右移) | `sarq $1, %rdi`    |

💡 **清零惯用法：** `xorq %rax, %rax` 比 `movq $0, %rax` 更高效。

### 4.3 加载有效地址 (lea)

`lea` 是唯一**不访问内存**的"寻址"指令——它只做地址计算。

```assembly
# 以下两者效果不同：
movq 6(%rbx, %rdi, 8), %rax   # 从内存加载值
leaq 6(%rbx, %rdi, 8), %rax   # 只计算地址，不访问内存
```

**为什么用 lea？**
- ✅ 一条指令完成复杂算术
- ✅ 不修改条件码
- ✅ 是三操作数指令（x86中很少）

```c
// C代码
long m12(long x) {
    return x * 12;
}
```

```assembly
# 编译器生成：
	leaq	(%rdi,%rdi,2), %rax
	salq	$2, %rax
```

---

## 5. 条件码（Condition Codes）

### 5.1 四个标志位

| 标志   | 全称          | 含义               |
| ------ | ------------- | ------------------ |
| **ZF** | Zero Flag     | 结果为 0           |
| **SF** | Sign Flag     | 结果为负（有符号） |
| **OF** | Overflow Flag | 有符号溢出         |
| **CF** | Carry Flag    | 无符号溢出（进位） |

在 GDB 中查看：
```gdb
(gdb) info registers eflags
eflags 0x246 [PF ZF IF]    # ZF 被设置
```

### 5.2 条件码如何更新

**几乎所有算术/逻辑指令**（除了 `lea`）都会更新条件码：

```assembly
addq %rsi, %rax    # t = a + b
# ZF = (t == 0)
# SF = (t < 0)  (有符号)
# OF = (a<0 == b<0) && (t<0 != a<0)  有符号溢出
# CF = t < (unsigned)a  无符号溢出
```

### 5.3 cmp 和 test 指令

| 指令           | 计算      | 特点                      |
| -------------- | --------- | ------------------------- |
| `cmpq S2, S1`  | `S1 - S2` | 不存结果，只更新条件码    |
| `testq S2, S1` | `S1 & S2` | 不存结果，只更新 ZF 和 SF |

```assembly
cmpq %rsi, %rax    # 计算 %rax - %rsi，不存储
# 用于比较 %rax 和 %rsi

testq %rdi, %rdi   # 计算 %rdi & %rdi
# 用于检查 %rdi 是否为 0
```

❌ **常见错误：** 混淆 `cmp` 的操作数顺序。

```assembly
# 比较 a 和 b
cmpq %rbx, %rax    # 计算 %rax - %rbx
# 如果 a == b，则 ZF = 1
```

---

## 6. 条件分支（Conditional Branches）

### 6.1 跳转指令

| 指令          | 条件            | 含义               |
| ------------- | --------------- | ------------------ |
| `jmp`         | 无条件          | 总是跳转           |
| `je` / `jz`   | ZF=1            | 相等 / 为零        |
| `jne` / `jnz` | ZF=0            | 不相等 / 非零      |
| `js`          | SF=1            | 负数               |
| `jns`         | SF=0            | 非负数             |
| `jg`          | `~(SF^OF)&~ZF`  | 大于（有符号）     |
| `jge`         | `~(SF^OF)`      | 大于等于（有符号） |
| `jl`          | `SF^OF`         | 小于（有符号）     |
| `jle`         | `(SF^OF) \| ZF` | 小于等于（有符号） |
| `ja`          | `~CF&~ZF`       | 大于（无符号）     |
| `jb`          | `CF`            | 小于（无符号）     |

### 6.2 从 C 到汇编

```c
// C代码
void decision(int x) {
    if (x) {
        op1();
    } else {
        op2();
    }
}
```

```assembly
decision:
    testl %edi, %edi    # 检查 x == 0
    je .L2              # 如果 x == 0，跳转到 else
    call op1            # if 分支
    jmp .L1             # 跳过 else
.L2:
    call op2            # else 分支
.L1:
    ret
```

### 6.3 通用条件表达式翻译

```c
// C条件表达式
val = Test ? Then_Expr : Else_Expr;
```

```c
// goto版本
long val;
if (!Test) goto Else;
val = Then_Expr;
goto Done;
Else:
val = Else_Expr;
Done:
return val;
```

### 6.4 完整示例：absdiff

```c
// C代码
long absdiff(long x, long y) {
    long result;
    if (x > y)
        result = x - y;
    else
        result = y - x;
    return result;
}
```

```c
// goto版本
long absdiff_goto(long x, long y) {
    long result;
    if (x <= y) goto Else;
    result = x - y;
    goto Done;
Else:
    result = y - x;
Done:
    return result;
}
```

```assembly
# 汇编（AT&T语法）
absdiff:
    cmpq %rsi, %rdi    # 比较 x:y (计算 x-y)
    jle .L2            # if x <= y goto Else
    movq %rdi, %rax
    subq %rsi, %rax    # result = x - y
    ret
.L2:
    movq %rsi, %rax
    subq %rdi, %rax    # result = y - x
    ret
```

---

## 7. 条件传送（Conditional Moves）

### 7.1 原理

条件传送是现代 CPU 的一个特性，可以**避免分支**带来的性能损失。

```c
// C代码
val = Test ? Then_Expr : Else_Expr;
```

```c
// 使用条件传送的goto版本
result = Then_Expr;
eval = Else_Expr;
if (!Test) result = eval;
return result;
```

### 7.2 示例

```assembly
# absdiff 使用条件传送
absdiff_cmov:
    movq %rdi, %rax        # result = x
    subq %rsi, %rax        # result = x - y
    movq %rsi, %rdx
    subq %rdi, %rdx        # eval = y - x
    cmpq %rsi, %rdi        # 比较 x:y
    cmovle %rdx, %rax      # if x <= y, result = eval
    ret
```

### 7.3 ⚠️ 条件传送的危险场景

❌ **不要用于：**

1. **昂贵计算** - 两个表达式都会执行
```c
// 不好：Hard1 和 Hard2 都会被计算
val = Test ? Hard1(x) : Hard2(x);
```

2. **不安全操作** - 可能解引用空指针
```c
// 危险：即使 p == NULL，*p 也会被计算
val = p ? *p : 0;
```

3. **有副作用** - 修改状态
```c
// 非法：两个分支都会执行
val = x > 0 ? x *= 7 : x += 3;
```

---

## 8. 循环（Loops）

### 8.1 do-while 循环

```c
// C代码
do {
    Body
} while (Test);
```

```c
// goto版本
loop:
    Body
    if (Test) goto loop;
```

### 8.2 while 循环 - 两种实现

#### 方法1：跳转到中间（`-Og` 默认）

```c
// C代码
while (Test) {
    Body
}
```

```c
// goto版本
    goto test;
loop:
    Body
test:
    if (Test) goto loop;
```

#### 方法2：守卫-do-while

```c
// goto版本
if (!Test) goto done;
loop:
    Body
    if (Test) goto loop;
done:
```

### 8.3 完整示例：位计数

```c
// C代码：统计1的个数
long pcount_while(unsigned long x) {
    long result = 0;
    while (x) {
        result += x & 0x1;
        x >>= 1;
    }
    return result;
}
```

**编译后的汇编（跳转到中间）：**
```assembly
pcount_while:
    movl $0, %eax        # result = 0
    jmp .L2              # 跳转到test
.L3:
    movq %rdi, %rdx
    andl $1, %edx        # t = x & 0x1
    addq %rdx, %rax      # result += t
    shrq %rdi            # x >>= 1
.L2:
    testq %rdi, %rdi     # Test: x != 0?
    jne .L3              # if true, goto loop
    rep; ret
```

**守卫-do-while版本：**
```assembly
pcount_while_guard:
    movl $0, %eax        # result = 0
    testq %rdi, %rdi
    je .L1               # if x == 0, goto done
.L2:
    movq %rdi, %rdx
    andl $1, %edx
    addq %rdx, %rax
    shrq %rdi
    jne .L2              # if x != 0, goto loop
.L1:
    ret
```

### 8.4 for 循环

```c
// for循环
for (Init; Test; Update) {
    Body
}
```

```c
// 转换为do-while
Init;
if (!Test) goto done;
loop:
    Body
    Update;
    if (Test) goto loop;
done:
```

💡 **提示：** 初始测试 `if (!Test)` 在很多情况下可以被优化掉。

---

## 9. switch 语句与跳转表

### 9.1 跳转表结构

Switch 语句使用**跳转表**实现 O(1) 的分支：

```
跳转表（内存中）:
┌──────────┐
│ .L8      │  ← case 0
├──────────┤
│ .L3      │  ← case 1
├──────────┤
│ .L5      │  ← case 2
├──────────┤
│ .L9      │  ← case 3
├──────────┤
│ .L8      │  ← case 4
├──────────┤
│ .L7      │  ← case 5
├──────────┤
│ .L7      │  ← case 6
└──────────┘
```

### 9.2 完整示例

```c
long switch_eg(long x, long y, long z) {
    long w = 1;
    switch(x) {
        case 1:
            w = y * z;
            break;
        case 2:
            w = y / z;
            // fall through
        case 3:
            w += z;
            break;
        case 5:
        case 6:
            w -= z;
            break;
        default:
            w = 2;
    }
    return w;
}
```

**跳转表（.rodata段）：**
```assembly
.section .rodata
.align 8
.L4:
    .quad .L8    # x = 0
    .quad .L3    # x = 1
    .quad .L5    # x = 2
    .quad .L9    # x = 3
    .quad .L8    # x = 4
    .quad .L7    # x = 5
    .quad .L7    # x = 6
```

**核心跳转指令：**
```assembly
switch_eg:
    cmpq $6, %rdi        # 比较 x:6
    ja .L8               # if x > 6, 跳转到default
    jmp *.L4(,%rdi,8)    # 间接跳转: 跳转表[x * 8]
```

### 9.3 各case实现

```assembly
.L3:    # case 1
    movq %rsi, %rax
    imulq %rdx, %rax     # w = y * z
    ret

.L5:    # case 2
    movq %rsi, %rax
    cqto
    idivq %rcx           # w = y / z
    jmp .L6              # fall through 到 case 3

.L9:    # case 3
    movl $1, %eax        # w = 1
.L6:    # merge
    addq %rcx, %rax      # w += z
    ret

.L7:    # case 5,6
    movl $1, %eax        # w = 1
    subq %rdx, %rax      # w -= z
    ret

.L8:    # default
    movl $2, %eax        # w = 2
    ret
```

---

## 10. 速查卡片

### 📋 条件码速查

| 码  | 设置条件           |
| --- | ------------------ |
| ZF  | 结果 == 0          |
| SF  | 结果 < 0（有符号） |
| OF  | 有符号溢出         |
| CF  | 无符号溢出         |

### 📋 条件跳转速查

| 有符号 | 无符号 | 条件     |
| ------ | ------ | -------- |
| `je`   | `je`   | 相等     |
| `jne`  | `jne`  | 不等     |
| `jg`   | `ja`   | 大于     |
| `jge`  | `jae`  | 大于等于 |
| `jl`   | `jb`   | 小于     |
| `jle`  | `jbe`  | 小于等于 |

### 📋 常用指令速查

| 指令    | 作用     | 影响条件码？ |
| ------- | -------- | ------------ |
| `movq`  | 传送     | ❌            |
| `leaq`  | 加载地址 | ❌            |
| `addq`  | 加法     | ✅            |
| `subq`  | 减法     | ✅            |
| `imulq` | 乘法     | ✅            |
| `xorq`  | 异或     | ✅            |
| `cmpq`  | 比较     | ✅（不存储）  |
| `testq` | 测试     | ✅（不存储）  |

### 📋 GDB 调试技巧

```gdb
# 查看寄存器
(gdb) info registers

# 查看特定寄存器
(gdb) print $rax
(gdb) print /x $rax    # 十六进制

# 内存查看
(gdb) x /8xg 0x4007f0  # 显示8个8字节值（十六进制）

# 反汇编
(gdb) disas function_name

# 断点
(gdb) break *0x40057d  # 在地址处断点
(gdb) break switch_eg  # 在函数入口断点
```

### 📋 指针识别技巧

在 GDB 中判断一个值是否为指针：
1. **`%rsp` 和 `%rip` 总是指针**
2. **值接近 `%rsp` 或 `%rip` 的值可能是指针**
3. **用于 `mov (%reg), ...` 的寄存器是指针**
4. **复杂寻址中，基址寄存器通常是指针，索引不是**

---

## 核心要点总结

- [ ] x86-64 使用 **AT&T 语法**（源操作数在左，目标在右）
- [ ] 寄存器名加 `%` 前缀，立即数加 `$` 前缀
- [ ] 指令后缀 `b/w/l/q` 指示操作数大小
- [ ] **写 32 位寄存器会自动清零高 32 位**
- [ ] `lea` 是唯一不访问内存的地址计算指令
- [ ] **算术指令更新条件码**，`cmp`/`test` 只更新条件码不存储
- [ ] 条件跳转使用 `jXX`，条件码名和跳转名对应
- [ ] **条件传送** (`cmov`) 避免分支，但有限制
- [ ] 循环有三种实现：do-while、跳转到中间、守卫-do-while
- [ ] `switch` 使用**跳转表**实现 O(1) 分支
- [ ] GDB 是调试机器码的利器

---

## 练习题

### 练习1：分析以下代码

```assembly
movq %rdi, %rax
subq %rsi, %rax
movq %rsi, %rdx
subq %rdi, %rdx
cmpq %rsi, %rdi
cmovle %rdx, %rax
ret
```

**问题：** 这段代码对应什么 C 函数？

<details>
<summary>点击查看答案</summary>

这是 `absdiff(long x, long y)` 使用条件传送的实现。

```c
long absdiff(long x, long y) {
    long result = x - y;
    long eval = y - x;
    if (x <= y) result = eval;
    return result;
}
```

</details>

### 练习2：将以下 C 代码转为 goto 风格

```c
long sum_to(long n) {
    long result = 0;
    for (long i = 1; i <= n; i++) {
        result += i;
    }
    return result;
}
```

<details>
<summary>点击查看答案</summary>

```c
long sum_to_goto(long n) {
    long result = 0;
    long i = 1;
    if (i > n) goto done;
loop:
    result += i;
    i++;
    if (i <= n) goto loop;
done:
    return result;
}
```

</details>

---

> 📝 **注：** 本教程基于 CMU 15-213 课程资料整理，面向 x86-64 架构和 AT&T 汇编语法。