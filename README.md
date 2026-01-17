<div align="center">

# [LinkerLens](https://github.com/Little-Red-Cap/Charm-bake)

**单片机固件可视化分析工具**
<br>
**A visual analyzer for embedded firmware.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Build Status](https://github.com/Little-Red-Cap/LinkerLens/actions/workflows/tauri.yml/badge.svg)](https://github.com/Little-Red-Cap/LinkerLens/actions)

</div>

[English](doc/README_en.md) | [简体中文](README.md)

---

你是否在单片机开发中遇到这样的烦恼：
- 怀疑某个功能导致体积暴增，却找不到“罪魁祸首”
- 想对比两次固件的差异，但 MAP/ELF 输出读不懂、对不齐
- 程序运行崩溃时，PC 指针看不懂，不知道运行到了哪里
- RAM 不够、FLASH 不够、栈溢出，问题定位总是靠“盲人摸象”

LinkerLens 让你用更直观的方式读懂固件：输入 `.elf` 与 `.map`，就能获得结构化的符号、段、对象、库与内存占用视图，快速定位优化点。

## 主要功能
- 段占用概览：`.text/.rodata/.data/.bss` 一目了然
- 内存区域使用：RAM/FLASH 使用量、占用比例与来源提示
- 符号分析：排序、过滤、大小与地址展示，支持详情查看
- 对象与库贡献：从 MAP 解析对象/库占用（含可视化）
- PC 地址反查：根据 PC 反查函数符号与偏移

## 使用场景
- 固件体积突增：快速定位“变胖”的函数或对象文件
- RAM 吃紧：识别大对象、定位 BSS/DATA 占用来源
- 崩溃排查：用 PC 地址快速反查函数名

## 常见排查命令与 LinkerLens 对照
下列命令往往分散、输出难读，LinkerLens 会将这些信息整合为可视化视图。

```bash
# 固件太大：查看体积最大的符号
arm-none-eabi-nm -S --size-sort firmware.elf | tail -n 50

# RAM 不够：查看占用 RAM 的符号
arm-none-eabi-nm --size-sort firmware.elf | grep ' [bBdD] '

# 栈使用分析
arm-none-eabi-gcc -fstack-usage *.c && cat *.su

# 浮点库体积过大
arm-none-eabi-nm firmware.elf | grep -i "float|dtoa|aeabi_[df]"

# C++ 异常表
arm-none-eabi-objdump -h firmware.elf | grep exidx

# 字符串数量
arm-none-eabi-strings firmware.elf | wc -l
```

## 一个最小示例流程
1. 选择 `.elf` 与 `.map`
2. 查看“内存区域”与“段占用概览”
3. 进入“符号分析”筛选大符号
4. 使用“PC 地址反查”定位崩溃点

## 技术栈
Tauri + React + Ant Design + Vite

## 运行与构建
本项目为 Tauri 桌面应用，建议使用最新版 Rust 与 Node.js。

```bash
npm install
npm run tauri dev
```

--- 

<div align="center">

问题反馈：[GitHub Issues](https://github.com/Little-Red-Cap/LinkerLens/issues)

[回到顶部](#LinkerLens)

</div>
