# Data Lab

## 一、实验概述

这个实验要求用受限的C语言操作符实现各种位操作和浮点数操作，帮助理解计算机底层的数据表示和运算。

---

## 二、整数编码规则（核心约束）

### 允许的操作符
| 类型 | 操作符       |
| ---- | ------------ |
| 一元 | `!` `~`      |
| 二元 | `&` `^` `    | ` `+` `<<` `>>` |
| 常量 | 0-255 (0xFF) |

### 禁止的操作
- 控制流：`if`, `do`, `while`, `for`, `switch`
- 逻辑操作符：`&&`, `||`, `?:`
- 算术操作符：`-`, `*`, `/`, `%`
- 类型转换、数组、结构体、联合体
- 宏定义、函数调用

### 机器假设
- 32位补码表示
- 算术右移
- 移位量在0-31之间

---

## 三、各函数详解与改进

### 第一部分：基础位运算（Rating 1）

#### 1. `bitXor` - 用~和&实现异或

**原解法：**
```c
return ~(x & y) & ~(~x & ~y);
```

**原理分析：**
- 异或定义：`x ^ y = (~x & y) | (x & ~y)`
- 利用德摩根定律：`(a | b) = ~(~a & ~b)`
- 令 `a = ~x & y`, `b = x & ~y`
- 则 `~(a & b) = ~((~x & y) & (x & ~y))` 需要推导

**更清晰的解法：**
```c
return ~(~(x & ~y) & ~(~x & y));
```
或者用最简形式：
```c
return ~(x & y) & ~(~x & ~y);  // 原解正确
```

**验证：**
| x   | y   | x^y | 结果 |
| --- | --- | --- | ---- |
| 0   | 0   | 0   | 0    |
| 0   | 1   | 1   | 1    |
| 1   | 0   | 1   | 1    |
| 1   | 1   | 0   | 0    |

#### 2. `tmin` - 返回最小补码整数

```c
return 1 << 31;  // 0x80000000 = -2147483648
```

**注意：** 不能使用 `0x80000000` 常量（超出255限制）

---

### 第二部分：条件判断（Rating 1-2）

#### 3. `isTmax` - 判断是否为最大补码数（0x7FFFFFFF）

**原解法：**
```c
return !(~(x + 1) ^ x) & !!(x + 1);
```

**问题分析：**
- `x = 0x7FFFFFFF` 时，`x+1 = 0x80000000`
- `~(x+1) = 0x7FFFFFFF = x`，所以异或得0
- `!(0) = 1`
- 但 `x = 0xFFFFFFFF`（-1）时，`x+1 = 0`，`~(0) = 0xFFFFFFFF = x`，也满足
- 需排除 `x = -1` 的情况：`!!(x+1)` 要求 `x != -1`

**更清晰的解法：**
```c
int isTmax(int x) {
    int neg_one = ~0;           // 0xFFFFFFFF
    int is_neged = !!(x ^ neg_one);  // 排除 -1
    return !(~(x + 1) ^ x) & is_neged;
}
```

#### 4. `allOddBits` - 检查所有奇数位是否为1

**原解法：**
```c
int mask = 0xAA;
mask = mask | (mask << 8);      // 0xAAAA
mask = mask | (mask << 16);     // 0xAAAAAAAA
return !((x & mask) ^ mask);
```

**优化思路：**
```c
int allOddBits(int x) {
    int mask = 0xAA;
    mask = mask + (mask << 8) + (mask << 16) + (mask << 24);
    // 或者：mask = (0xAA << 24) | (0xAA << 16) | (0xAA << 8) | 0xAA;
    return !((x & mask) ^ mask);
}
```

#### 5. `negate` - 取相反数

```c
return ~x + 1;  // 补码取负
```

**原理：** `-x = ~x + 1`

---

### 第三部分：比较和选择（Rating 3）

#### 6. `isAsciiDigit` - 判断是否为ASCII数字'0'-'9'

**原解法：**
```c
return !((x + ~0x30 + 1) >> 31 | (0x39 + ~x + 1 >> 31));
```

**代码分析：**
- `x + ~0x30 + 1 = x - 0x30`（因为 `~a + 1 = -a`）
- `0x39 + ~x + 1 = 0x39 - x`
- 右移31位取符号位：负数表示 `x < 0x30` 或 `x > 0x39`

**改进：更清晰的写法**
```c
int isAsciiDigit(int x) {
    int lower = x + (~0x30 + 1);  // x - 0x30
    int upper = 0x39 + (~x + 1);  // 0x39 - x
    // lower>=0 且 upper>=0 时，两数符号位都为0
    return !((lower >> 31) | (upper >> 31));
}
```

#### 7. `conditional` - 实现 x ? y : z

**原解法：**
```c
return ~!!x + 1 & y | ~(~!!x + 1) & z;
```

**原理分析：**
- `!!x`：x≠0时为1，x=0时为0
- `~!!x + 1`：x≠0时为 `~1+1 = -1 = 0xFFFFFFFF`，x=0时为 `~0+1 = 0`
- 这个值作为掩码：全1选y，全0选z

**改进：更直观的理解**
```c
int conditional(int x, int y, int z) {
    int mask = (~!!x + 1);  // x≠0? 0xFFFFFFFF : 0
    return (mask & y) | (~mask & z);
}
```

#### 8. `isLessOrEqual` - 判断 x ≤ y

**原解法：**
```c
return (((x >> 31) & 1) ^ ((y >> 31) & 1)) & ((x >> 31) & 1)
       | !(((x >> 31) & 1) ^ ((y >> 31) & 1)) & (!((y + ~x + 1) >> 31));
```

**逻辑分解：**

| 情况     | 条件            | 结果                 |
| -------- | --------------- | -------------------- |
| x<0, y≥0 | 符号不同        | 直接返回1（x≤y成立） |
| x≥0, y<0 | 符号不同        | 直接返回0            |
| 符号相同 | 计算 y-x 的符号 | y-x≥0 返回1          |

**简化版：**
```c
int isLessOrEqual(int x, int y) {
    int signX = (x >> 31) & 1;
    int signY = (y >> 31) & 1;
    int diffSign = signX ^ signY;
    int diff = y + (~x + 1);  // y - x

    // 符号不同时：signX==1成立；符号相同时：diff符号位为0成立
    return (diffSign & signX) | (~diffSign & !(diff >> 31));
}
```

---

### 第四部分：进阶位操作（Rating 4）

#### 9. `logicalNeg` - 实现逻辑非

**原解法：**
```c
return ((x | (~x + 1)) >> 31) + 1;
```

**原理：**
- 对于x=0：`x | (-x) = 0`，右移31得0，+1=1
- 对于x≠0：`x | (-x)` 的符号位为1（正数或负数），右移31得-1（算术右移），+1=0

**另一种解法：**
```c
int logicalNeg(int x) {
    return ((~x + 1) | x) >> 31 & 1;
}
```

#### 10. `howManyBits` - 最少需要多少位表示（补码）

**原解法：**
```c
int howManyBits(int x) {
    int b16, b8, b4, b2, b1, b0;
    int sign = x >> 31;
    x = (~sign & x) | (sign & ~x);  // 若x<0则取反
    b16 = !!(x >> 16) << 4;
    x = x >> b16;
    b8 = !!(x >> 8) << 3;
    x = x >> b8;
    b4 = !!(x >> 4) << 2;
    x = x >> b4;
    b2 = !!(x >> 2) << 1;
    x = x >> b2;
    b1 = !!(x >> 1);
    x = x >> b1;
    b0 = x;
    return b16 + b8 + b4 + b2 + b1 + b0 + 1;
}
```

**二分查找思想：**
1. 负数取反（补码表示中，负数和正数的最高位不同）
2. 不断右移，找到最高位的1
3. 结果 = 最高位位置 + 1

**举例：**
- 12 = 1100₂ → 需要5位（01100）
- -5 = 1011₂ → 取反得0100₂ → 需要4位

---

## 四、浮点数操作（Rating 4）

### 浮点数格式回顾

```
单精度浮点数 (32位):
┌─────┬─────────┬─────────────────────┐
│sign │ exp(8)  │      frac(23)       │
│31   │ 30-23   │      22-0           │
└─────┴─────────┴─────────────────────┘

数值 = (-1)^sign × 2^(exp-127) × (1 + frac)  [规格化]
     = (-1)^sign × 2^(-126) × (0 + frac)    [非规格化]
```

### 特殊值

| 情况     | exp   | frac | 值     |
| -------- | ----- | ---- | ------ |
| 零       | 0     | 0    | ±0     |
| 非规格化 | 0     | ≠0   | 接近零 |
| 规格化   | 1~254 | 任意 | 正常   |
| 无穷大   | 255   | 0    | ±∞     |
| NaN      | 255   | ≠0   | 非数   |

#### 11. `floatScale2` - 2倍浮点数

**关键点：**
- NaN/Inf：原样返回
- 非规格化：frac左移1位，可能进位到规格化
- 规格化：exp+1，可能溢出到Inf

**改进：增加注释**
```c
unsigned floatScale2(unsigned uf) {
    unsigned sign = uf & 0x80000000;
    unsigned exp = (uf >> 23) & 0xFF;
    unsigned frac = uf & 0x7FFFFF;

    if (exp == 0xFF) return uf;  // NaN 或 Inf

    if (exp == 0) {  // 非规格化
        frac <<= 1;
        if (frac & 0x800000) {  // 进位
            exp = 1;
            frac &= 0x7FFFFF;
        }
    } else {  // 规格化
        exp++;
        if (exp == 0xFF) {  // 溢出到无穷大
            return sign | (0xFF << 23);
        }
    }
    return sign | (exp << 23) | frac;
}
```

#### 12. `floatFloat2Int` - 浮点数转整数

**关键点：**
- 提取sign, exp, frac
- 计算E = exp - 127
- 构造有效数字：规格化加隐含1，非规格化不加
- 根据E决定移位方向

**原解法中移位问题：**
```c
// 正确写法
if (E >= 23) {
    result = mantissa << (E - 23);
} else {
    result = mantissa >> (23 - E);  // 注意：不是150-exp
}
```

**完整改进版：**
```c
int floatFloat2Int(unsigned uf) {
    unsigned sign = uf >> 31;
    unsigned exp = (uf >> 23) & 0xFF;
    unsigned frac = uf & 0x7FFFFF;
    int E = (int)exp - 127;
    int result;

    if (exp == 0xFF) return 0x80000000u;  // NaN/Inf
    if (exp == 0) return 0;  // 太小的数

    // 规格化，加上隐含的1
    unsigned mantissa = (1 << 23) | frac;

    if (E < 0) return 0;
    if (E > 30) return 0x80000000u;

    if (E >= 23) {
        result = mantissa << (E - 23);
    } else {
        result = mantissa >> (23 - E);
    }

    return sign ? -result : result;
}
```

#### 13. `floatPower2` - 计算2.0^x

**原解法：**
```c
unsigned floatPower2(int x) {
    if (x > 127) return 0x7F800000;   // +INF
    if (x < -149) return 0;           // 太小

    if (x >= -126) {                  // 规格化
        int exp = x + 127;
        return exp << 23;
    }
    // 非规格化: x in [-149, -127]
    return 1 << (x + 149);
}
```

**解释：**
- 规格化范围：exp = x+127，要求 1 ≤ exp ≤ 254 → -126 ≤ x ≤ 127
- 非规格化范围：2^(x) = 2^(-126) × 2^(x+126)，但非规格化最小阶码-149
  - 2^(-149) = 2^(-126) × 2^(-23) → 对应frac最低位
  - 所以x从-127到-149用非规格化表示
- 小于-149：下溢为0

**边界检查：**
| x     | 结果           | 说明         |
| ----- | -------------- | ------------ |
| >127  | 0x7F800000     | +∞           |
| 127   | 0x7F800000?    | 规格化最大值 |
| -126  | 0x00800000?    | 最小规格化   |
| -127  | 非规格化最大值 | frac全1      |
| -149  | 非规格化最小值 | frac=1       |
| <-149 | 0              | 下溢         |

---

## 五、常见技巧总结

### 1. 生成掩码
```c
// 生成低n位全1
int mask_low_n = (1 << n) - 1;

// 生成0xAAAAAAAA
int mask_aa = 0xAA + (0xAA<<8) + (0xAA<<16) + (0xAA<<24);
```

### 2. 符号位操作
```c
// 取符号位
int sign = (x >> 31) & 1;

// 负数返回全1，正数返回0
int mask = x >> 31;

// 绝对值（条件取反）
int abs_x = (x ^ mask) - mask;  // 或 (mask & ~x) | (~mask & x)
```

### 3. 比较转掩码
```c
// x==y 返回全1，否则返回0
int eq_mask = ~(x ^ y) + 1;  // 或 !(x^y) 但结果只有0/1

// x>y 的掩码
int gt_mask = ((y + ~x + 1) >> 31) & 1;  // y-x 的符号
```

### 4. 条件选择
```c
// mask为全1选y，全0选z
int result = (mask & y) | (~mask & z);
```

### 5. 二分查找最高位
```c
// 在howManyBits中使用的方法
int pos = 0;
pos += (!!(x >> 16)) << 4;  x >>= (!!(x >> 16)) << 4;
pos += (!!(x >> 8)) << 3;   x >>= (!!(x >> 8)) << 3;
// ... 继续
```

---

## 六、调试建议

1. **使用dlc检查合法性**：`./dlc bits.c`
2. **使用btest测试正确性**：`make btest && ./btest`
3. **使用BDD验证**：`./btest -f 函数名 -g`
4. **分步调试**：将复杂表达式拆解为多个变量

---
