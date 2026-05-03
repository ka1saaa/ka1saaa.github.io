---
title: vol2和vol3配置教程
date: 2026-05-04 01:00:25
tags:
  - Windows内存取证
cover: /img/img7.jpg
---
# volatility2
## 安装教程
1.首先更新软件源，并安装构建工具和python2的基础支持
```
sudo apt update
sudo apt install -y python2 python2-dev libpython2-dev build-essential git libdistorm3-dev yara libraw1394-11 libcap2-bin
```
2.手动安装python2的pip
由于现在ubuntu和kali的仓库不再提供python-pip，我们需要在官方归档中下载
```
# 下载针对 Python 2.7 的 pip 安装脚本
curl https://bootstrap.pypa.io/pip/2.7/get-pip.py --output get-pip.py

# 安装 pip
sudo python2 get-pip.py

# 验证安装
python2 -m pip --version
# 输出应包含 "python 2.7"
```
3.安装volatiliy2的核心python库
volatility 2 依赖 pycrypto 和 distorm3。由于 pycrypto 已废弃，安装时可能会报错，我们需要先安装 setuptools 和 wheel。
```
# 更新安装工具
sudo python2 -m pip install -U setuptools wheel

# 安装核心依赖
sudo python2 -m pip install pycrypto distorm3==3.4.4
sudo python2 -m pip install pycryptodome distorm3==3.4.4（目前更推荐）
```
4.下载并运行volatility2
```
# 克隆仓库
git clone https://github.com/volatilityfoundation/volatility.git

# 进入目录
cd volatility

# 赋予执行权限
chmod +x vol.py

# 测试运行
python2 vol.py -h
```
注意：有时候会 Git 网络传输中断错误，在通过 HTTPS 拉取仓库时，TLS 连接被异常中断，可以改用SSH，需要SSH key添加到GitHub账号
```
# 检查是否已有密钥
ls -al ~/.ssh

# 如果没有
ssh-keygen -t ed25519 -C "your_email@example.com" 

# 复制公钥
cat ~/.ssh/id_ed25519.pub
登录GitHub添加：
◦ 点开右上角头像，进入 Settings。
◦ 在左侧菜单栏找到并点击 SSH and GPG keys
◦ 点击绿色的 New SSH key 按钮。
◦ Title：给你的设备起个名（比如“My MacBook Pro”），方便以后管理。
◦ Key type：选 Authentication Key。
◦ Key：把刚才复制的公钥粘贴进去
◦ 点击 Add SSH key，按提示输入GitHub密码确认即可。

检查连接
ssh -T git@github.com
git clone git@github.com:volatilityfoundation/volatility.git
```
做题时把文件拖到volatility2中即可进行解题
# volatility3
## 安装教程
1.下载并解压
```
wget https://github.com/volatilityfoundation/volatility3/archive/refs/tags/v2.5.2.zip -O volatility3.zip
unzip volatility3.zip
```
2.安装依赖
```
cd volatility3-2.5.2
pip3 install -r requirements.txt
注意：如果提示 error:externally-managed-environment，这个时候我们只需要创建一个虚拟环境

#安装 venv 模块 (如果尚未安装)
sudo apt install -y python3-venv

#创建名为 venv 的虚拟环境
python3 -m venv 虚拟环境名

#激活虚拟环境
source 虚拟环境名/bin/activate
pip install -r requirements.txt
```
3.制作快捷启动指令
```
退回上一级目录
cd ..

创建快捷指令（注意路径里多了个 /venv/bin/）

echo '~/ctf/volatility3-2.5.2/venv/bin/python3 ~/ctf/volatility3-2.5.2/vol.py "$@"' > vol3

给权限

chmod +x vol3
```
然后就可以使用./vol3进行做题了

文章作者: ka1saaa