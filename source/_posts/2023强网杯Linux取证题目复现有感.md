---
title: 2023强网杯Linux取证题目复现有感
date: 2026-05-04 01:05:49
tags:
  - Linux取证
cover: /img/img6.jpg
---
# 你找到 PNG 了吗：一次 Linux 内存取证环境搭建记录
## 前言
这是我做的第一道 Linux 内存取证题。为了方便，我没有单独开虚拟机，而是直接使用 VS Code + Docker 来完成环境搭建和 Profile 制作。


首先我们要知道为什么要制作 Linux Profile：  
Linux 内存取证和 Windows 不同，
在 Volatility 2 中，分析 Linux 内存通常需要根据目标系统的内核版本单独制作 Profile，因为不同内核版本之间的数据结构差异较大，不能直接通用。

所以我们做题步骤一般就是三步：
```
1.用 Volatility 3 识别内核版本  
2.为 Volatility 2 制作对应的 Linux Profile  
3.使用 Volatility 2 进行分析
```
## 实操
### 识别内核版本
先查看内存镜像中的 Banner：  
`
vol3 -f mem.mem banners.Banners  
`  

可以看到目标系统内核版本大致为：  
`Ubuntu 5.4.0-100.113-generic 5.4.166  `  
也就是说，后续需要准备与 5.4.0-100-generic 对应的头文件和符号表。

### 准备文件
```
我参考了 Lunatic 大佬的博客：

https://goodlunatic.github.io/posts/761da51/
https://mirrors.ustc.edu.cn/ubuntu/pool/main/l/linux/
```

我们先创建一个题目文件夹，
目录结构如下：
```
Vanguard-png  
├─ Dockerfile    
├─ mem.mem  
└─ src   
   ├─ tools.zip    
   ├─ linux-headers-5.4.0-100_5.4.0-100.113_all.deb  
   ├─ linux-headers-5.4.0-100-generic_5.4.0-100.113_amd64.deb  
   ├─ linux-modules-5.4.0-100-generic_5.4.0-100.113_amd64.deb  
   └─ data  
      └─ boot
```
### 提取System.map
制作Profile前要提取对应版本的 System.map  
System.map-5.4.0-100-generic 需要从 linux-modules 包中提取。
```
1.先启动一个临时 Ubuntu 容器，把本地 src 目录挂载到容器的 /work：

docker run --rm -it -v D:\Vanguard-png\src:/work ubuntu:20.04 bash

2.进入容器后安装工具：

apt update
apt install -y xz-utils binutils

3.进入目录并解包：

cd /work
mkdir extracted
dpkg-deb -x linux-modules-5.4.0-100-generic_5.4.0-100.113_amd64.deb extracted
find extracted -name "System.map*"

4.复制到 data/boot：

mkdir -p /work/data/boot
cp extracted/boot/System.map-5.4.0-100-generic /work/data/boot/
ls /work/data/boot

5.完成后退出容器：

exit
```
### 生成module.dwarf  
接下来生成 module.dwarf  
在项目根目录创建 Dockerfile：
```
FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

COPY ./src/ /src/

RUN sed -i 's/archive.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list \
    && sed -i 's/security.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list \
    && apt update \
    && apt install -y --no-install-recommends \
        gcc \
        dwarfdump \
        build-essential \
        unzip \
        kmod \
        linux-base \
        make \
        flex \
        bison \
        libelf-dev \
        python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src

RUN unzip tools.zip \
    && dpkg -i linux-headers-5.4.0-100_5.4.0-100.113_all.deb \
    && dpkg -i linux-headers-5.4.0-100-generic_5.4.0-100.113_amd64.deb

WORKDIR /src/tools/linux

RUN echo 'MODULE_LICENSE("GPL");' >> module.c \
    && sed -i 's/$(shell uname -r)/5.4.0-100-generic/g' Makefile \
    && make \
    && mv module.dwarf /tmp/module.dwarf
```
然后删除src/extracted目录构建镜像并运行容器：
```
cd D:\Vanguard-png
docker build -t profile .
docker run -it --name profile-builder profile /bin/bash

检查文件是否生成：

ls /tmp

如果有 module.dwarf，退出容器并复制到宿主机：

exit

docker cp profile-builder:/tmp/module.dwarf D:\Vanguard-png\module.dwarf
docker rm -f profile-builder
```
### 打包 Profile  
首先我们要知道Volatility 2 的 Linux Profile 由两个文件组成：

`module.dwarf`和·
`System.map-5.4.0-100-generic`  
```
创建输出目录：

mkdir D:\Vanguard-png\profile-output

复制文件：

copy D:\Vanguard-png\module.dwarf D:\Vanguard-png\profile-output\
copy D:\Vanguard-png\src\data\boot\System.map-5.4.0-100-generic D:\Vanguard-png\profile-output\

压缩：

cd D:\Vanguard-png\profile-output
Compress-Archive -Path .\module.dwarf, .\System.map-5.4.0-100-generic -DestinationPath .\Ubuntu2004-5.4.0-100-generic.zip -Force
注意：压缩包内部最好直接就是这两个文件，不要多套一层目录。
```
### 部署 Volatility 2  
新建目录：
```
D:\volatility2-lab
├─ Dockerfile
├─ mem.mem
└─ profiles
   └─ Ubuntu2004-5.4.0-100-generic.zip
```
Dockerfile 内容如下：
```
FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

RUN sed -i 's/archive.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list \
    && sed -i 's/security.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list \
    && apt update \
    && apt install -y --no-install-recommends \
        ca-certificates \
        git \
        build-essential \
        wget \
        unzip \
        python2 \
        python2-dev \
        python-pip \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt

RUN git clone https://github.com/volatilityfoundation/volatility.git

WORKDIR /opt/volatility

CMD ["/bin/bash"]
```
构建并进入容器：
```
cd D:\volatility2-lab
docker build -t volatility2 .
docker run --rm -it -v "${PWD}:/data" volatility2 bash
```
### 加载 Profile
进入容器后，先检查目录：
```
ls /data
ls /data/profiles  
这一步如果没有文件，就把我们刚刚的压缩包复制过去
复制 profile 到 overlays 目录：

mkdir -p /opt/volatility/volatility/plugins/overlays/linux
cp /data/profiles/*.zip /opt/volatility/volatility/plugins/overlays/linux/
检查是否识别成功：

cd /opt/volatility
python2 vol.py --info | grep -i linux
如果识别成功，输出中会出现新增的 Linux Profile 名称。
后续 --profile= 参数必须写 Volatility 实际识别到的名称，不一定等于 zip 文件名。
```
### 使用
例如，假设 vol.py --info 中识别到的 Profile 名称为：  
`
LinuxUbuntu2004-5_4_0-100-genericx64
`  
那么列出进程的命令为：  
`
python2 vol.py -f /data/mem.mem --profile=LinuxUbuntu2004-5_4_0-100-genericx64 linux_pslist
`  
还可以继续使用这些常见插件：
```
python2 vol.py -f /data/mem.mem --profile=LinuxUbuntu2004-5_4_0-100-genericx64 linux_pstree  
python2 vol.py -f /data/mem.mem --profile=LinuxUbuntu2004-5_4_0-100-genericx64 linux_psaux  
python2 vol.py -f /data/mem.mem --profile=LinuxUbuntu2004-5_4_0-100-genericx64 linux_netstat  
python2 vol.py -f /data/mem.mem --profile=LinuxUbuntu2004-5_4_0-100-genericx64 linux_lsof
```
## 总结
整个流程可以概括为：
```
用 Volatility 3 识别内核版本
提取对应的 System.map
编译生成 module.dwarf
将两者打包成 Volatility 2 的 Linux Profile
把 Profile 放到 overlays 目录
用 vol.py --info 确认识别成功
再使用 linux_pslist 等插件进行分析
```

这是我第一次做有关的题目，文章中出现错误也是在所难免的，如有错误，请各位师傅多多包涵并指正，后续我也会更新更多取证相关题目qwq