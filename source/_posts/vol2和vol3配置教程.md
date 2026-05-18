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

# volatility2补充 
由于我电脑内存爆炸了，所以我重装了一次电脑，但是就在我在wsl里再次安装vol2的时候，发现按照我上面的步骤不行了，主要就是python2和其pip安装的问题，没招了，所以我在这里给出其他解决方案

```
# 各位按照上面步骤安装时
sudo apt install -y python2 python2-dev libpython2-dev build-essential git libdistorm3-dev yara libraw1394-11 libcap2-bin

# 应该会显示这个
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
Package python2 is not available, but is referred to by another package.
This may mean that the package is missing, has been obsoleted, or
is only available from another source

E: Package 'python2' has no installation candidate
E: Unable to locate package python2-dev
E: Unable to locate package libpython2-dev
```

这报错也很简单，就是仓库里已经默认移除了   
`python2 / python2-dev / libpython2-dev`  

我们要安装python2，这里建议用 pyenv/源码装 Python 2.7，装一个隔离的python2  

1.安装依赖   
```
sudo apt update
sudo apt install -y build-essential git curl \
  libssl-dev zlib1g-dev libb2-dev libreadline-dev libsqlite3-dev \
  libffi-dev liblzma-dev
```   

2.安装pyenv
```
curl https://pyenv.run | bash
```

然后把
```
export PATH="$HOME/.pyenv/bin:$PATH"  
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"
```
这三行加入`~/.bashrc`
```
cat <<'EOF' >> ~/.bashrc

# pyenv
export PATH="$HOME/.pyenv/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"
EOF
```

然后让它生效  
```
source ~/.bashrc
```

验证
```
command -v pyenv
pyenv --version
```

3.接下来安装python2
```
pyenv install 2.7.18
pyenv global 2.7.18
python --version
```
这样python2基本就安装成功了

还有pip2的安装
```
sudo python2 -m pip install -U setuptools wheel

sudo: python2: command not found
```
会显示找不到python2，这是正常现象：你用 pyenv 装的 python2 在你的用户环境 PATH 里可用，但 sudo 默认会用“更干净的 PATH”，不会加载你的 ~/.bashrc，所以找不到 python2

注意：其实可以把`sudo`删掉试试，包括后面一切需要用到`sudo python2`的命令都可以这样

这里安装的隔离的python2.7.18是自带pip的  
`python2 -m pip --version || true`  
这条命令是可以检测的  
如果没有的话
```
curl -sS https://bootstrap.pypa.io/pip/2.7/get-pip.py -o /tmp/get-pip.py
python2 /tmp/get-pip.py

# 升级
python2 -m pip install -U --user setuptools wheel
```
后续的操作基本没问题，有问题我还会修改的  
谢谢各位观看喵~  

文章作者: ka1saaa