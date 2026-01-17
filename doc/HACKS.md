# 嵌入式开发黑科技手册 🔧

这是一份面向固件体积与内存优化的实战手册，LinkerLens 会将这些命令转化为可视化工具，寻找优化点更直观。


这些都是实战中摸爬滚打总结出来的硬核技巧，专治各种疑难杂症。

## 一、固件体积分析与优化

### 1.1 符号体积榜单生成

当你的固件莫名其妙变大了，先看看谁在占空间：

```bash
# 生成符号大小排序列表
arm-none-eabi-nm -S --size-sort -C firmware.elf > nm.txt

# 看最大的80个符号
tail -n 80 nm.txt

# 如果想看具体数字，加上地址和大小
arm-none-eabi-nm -S --size-sort --radix=d -C firmware.elf | tail -n 100
```

**参数解释：**
- `-S`: 显示符号大小
- `--size-sort`: 按大小排序
- `-C`: 反编译C++符号（demangle）
- `--radix=d`: 用十进制显示（默认是十六进制）

### 1.2 对比分析法

怀疑某个功能导致体积暴增？对比一下就知道了：

```bash
# 编译两个版本
make clean && make CONFIG_NO_FLOAT=1  # 生成 firmware_no_float.elf
make clean && make                     # 生成 firmware_float.elf

# 分别生成符号表
arm-none-eabi-nm -S --size-sort -C firmware_no_float.elf > nm_no_float.txt
arm-none-eabi-nm -S --size-sort -C firmware_float.elf > nm_float.txt

# 对比差异
diff -u nm_no_float.txt nm_float.txt | less

# 或者只看新增的符号
diff nm_no_float.txt nm_float.txt | grep "^>" | sort -k2 -n
```

**常见罪魁祸首：**
- `__dtoa`, `__printf_fp`: printf浮点格式化
- `__aeabi_d*`, `__aeabi_f*`: ARM浮点运算库
- `std::to_chars`, `dragonbox`: C++浮点转换
- `__exidx_start/end`: 异常处理表（C++）

### 1.3 section级别分析

看看各个section占了多少空间：

```bash
# 查看section大小
arm-none-eabi-size -A -d firmware.elf

# 更详细的section信息
arm-none-eabi-objdump -h firmware.elf

# 看看哪些文件贡献了代码
arm-none-eabi-nm --size-sort -S firmware.elf | \
  awk '{print $4}' | sed 's/:.*//g' | sort | uniq -c | sort -rn
```

## 二、编译优化黑魔法

### 2.1 链接时优化（LTO）

让编译器跨文件优化，能省不少空间：

```makefile
# Makefile中添加
CFLAGS += -flto
LDFLAGS += -flto -fuse-linker-plugin
```

### 2.2 移除未使用代码

```makefile
# 编译时每个函数/数据独立section
CFLAGS += -ffunction-sections -fdata-sections

# 链接时移除未使用section
LDFLAGS += -Wl,--gc-sections

# 查看移除了什么（可选）
LDFLAGS += -Wl,--print-gc-sections
```

### 2.3 优化等级实验

不同优化等级效果差异很大：

```bash
# 分别测试
make CFLAGS="-Os"  # 体积优先
make CFLAGS="-O2"  # 性能优先
make CFLAGS="-O3"  # 激进优化
make CFLAGS="-Oz"  # 极致体积（Clang）

# 对比结果
ls -lh firmware*.elf
```

## 三、内存使用分析

### 3.1 查看RAM/ROM占用

```bash
# 快速查看
arm-none-eabi-size firmware.elf

# 详细分析（十进制）
arm-none-eabi-size -A -d firmware.elf

# 看看是谁占了RAM
arm-none-eabi-nm --size-sort -S firmware.elf | grep ' [bBdD] '
```

**符号类型速查：**
- `T/t`: 代码段（Flash）
- `D/d`: 已初始化数据（Flash+RAM）
- `B/b`: 未初始化数据（RAM）
- `R/r`: 只读数据（Flash）

### 3.2 栈使用分析

```bash
# 生成汇编并分析栈使用
arm-none-eabi-objdump -d firmware.elf | grep "sub.*sp" | less

# 或者用专门的工具
arm-none-eabi-gcc -fstack-usage *.c
cat *.su | sort -k2 -n | tail -n 20  # 看栈使用最多的函数
```

### 3.3 查找大数组/结构体

```bash
# 找出所有超过1KB的符号
arm-none-eabi-nm -S --size-sort firmware.elf | \
  awk '$2 > 1024 {print $2/1024 "KB", $0}'

# 看看数据段里都有啥大家伙
arm-none-eabi-nm -S --size-sort firmware.elf | \
  grep ' [bBdD] ' | awk '$2 > 100'
```

## 四、调试与追踪技巧

### 4.1 查看函数调用关系

```bash
# 生成调用图（需要Graphviz）
arm-none-eabi-gcc -fdump-rtl-expand *.c
egypt *.expand | dot -Tpng -o callgraph.png

# 或者用更现代的工具
gprof2dot -f pstats profile.stats | dot -Tpng -o profile.png
```

### 4.2 反汇编分析

```bash
# 反汇编整个固件
arm-none-eabi-objdump -d firmware.elf > firmware.asm

# 只看某个函数
arm-none-eabi-objdump -d firmware.elf | sed -n '/<your_function>/,/^$/p'

# 看C代码和汇编混合
arm-none-eabi-objdump -S firmware.elf > mixed.asm
```

### 4.3 查看字符串常量

```bash
# 提取所有字符串
arm-none-eabi-strings firmware.elf > strings.txt

# 找找有没有意外包含的调试字符串
grep -i "debug\|test\|todo" strings.txt
```

## 五、高级技巧

### 5.1 对比两个固件版本

```bash
# 生成可读的二进制对比
arm-none-eabi-objdump -d firmware_v1.elf > v1.asm
arm-none-eabi-objdump -d firmware_v2.elf > v2.asm
diff -u v1.asm v2.asm | less

# 或者直接二进制对比
cmp -l firmware_v1.bin firmware_v2.bin | \
  awk '{printf "%08X %02X %02X\n", $1-1, strtonum(0$2), strtonum(0$3)}'
```

### 5.2 找出占ROM最多的头文件

```bash
# 编译时生成依赖关系
arm-none-eabi-gcc -MM *.c > deps.txt

# 统计哪个头文件被包含最多
cat deps.txt | tr ' ' '\n' | grep "\.h$" | sort | uniq -c | sort -rn
```

### 5.3 暴力搜索优化点

```python
#!/usr/bin/env python3
# 自动化测试不同编译选项的脚本
import subprocess, os

options = [
    "-Os",
    "-Os -flto",
    "-Os -flto -ffunction-sections -fdata-sections",
]

for opt in options:
    os.system(f'make clean && make CFLAGS="{opt}"')
    size = subprocess.check_output(['arm-none-eabi-size', 'firmware.elf'])
    print(f"\n=== {opt} ===\n{size.decode()}")
```

### 5.4 检查是否有未对齐的数据

```bash
# 查看数据对齐情况
arm-none-eabi-nm -S firmware.elf | \
  awk '{if ($1 % 4 != 0 && $3 ~ /[dDbB]/) print "未对齐:", $0}'
```

## 六、常见问题速查表

| 问题 | 快速诊断命令 |
|------|------------|
| 固件太大 | `arm-none-eabi-nm -S --size-sort firmware.elf \| tail -n 50` |
| RAM不够 | `arm-none-eabi-nm --size-sort firmware.elf \| grep ' [bBdD] '` |
| 栈溢出 | `arm-none-eabi-gcc -fstack-usage *.c && cat *.su` |
| 浮点库太大 | `arm-none-eabi-nm firmware.elf \| grep -i "float\|dtoa\|aeabi_[df]"` |
| C++异常表 | `arm-none-eabi-objdump -h firmware.elf \| grep exidx` |
| 字符串太多 | `arm-none-eabi-strings firmware.elf \| wc -l` |

## 七、终极武器：自定义链接脚本

有时候需要精确控制内存布局：

```ld
/* 把某些函数放到RAM中执行（加速） */
.ram_functions : {
    *(.ram_code)
    *critical_function.o(.text)
} > RAM AT > FLASH

/* 把大数组放到特定地址 */
.big_buffer (NOLOAD) : {
    *(.big_buffer)
} > EXTERNAL_RAM
```

配合代码：

```c
// 把函数放到RAM
__attribute__((section(".ram_code")))
void critical_function(void) {
    // 速度敏感代码
}

// 把数组放到外部RAM
__attribute__((section(".big_buffer")))
uint8_t huge_buffer[1024*1024];
```

---
