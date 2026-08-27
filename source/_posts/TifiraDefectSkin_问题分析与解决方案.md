---
title: 蒂菲拉故障机器人皮肤 Mod：问题分析与解决方案
date: 2026-08-27 19:39:00
tags:
  - slay the spire2
  - game 
cover: /img/img6.jpg
---
# 蒂菲拉故障机器人皮肤 Mod：问题分析与解决方案

特别声明：**该mod的原作者是b站up主——异色瞳墨灵**，我只是使用时发现有bug，随手修了一下

## 一、涉及文件

本报告针对以下两个 Mod：

- `TifiraDefectSkin`：替换故障机器人模型、选人界面背景和战斗相关动画资源。
- `TifiraCardSkin`：替换故障机器人及其他角色的卡牌图片。



## 二、现象和对应问题

### 1. 图片不显示或显示为空白

表现：

- 选人界面背景或角色图片不显示。
- 部分卡面可能变成空白。
- 游戏日志中能看到资源加载失败或资源路径回退信息。

主要原因：

- Mod 使用的是旧版游戏资源加载和角色显示逻辑。
- 部分 `.tres` 文件中的 Godot UID 是旧环境生成的 UID。当前游戏会提示 `invalid UID`，然后尝试使用文本路径加载。
- 旧 DLL 没有对资源是否存在进行检查，资源加载失败后仍继续使用空资源，可能导致图片为空。

日志中出现过类似信息：

`invalid UID ... using text path instead`

这类信息通常表示 UID 失效但路径回退仍可能成功，不等同于所有资源都加载失败。真正需要关注的是其后是否出现空引用、异常或对应画面缺失。

### 2. 选人界面图片是静态的

表现：

- 选人界面能看到蒂菲拉图案。
- 但原本应该播放的 Spine 动画不动，或者只停留在初始帧。

主要原因：

- 选人背景的 Spine 骨骼是异步初始化的。
- 原 Mod 在骨骼尚未准备完成时立即调用播放动画函数，调用时机过早。
- 新版游戏提供了 `SpineNodeExtensions.RunWhenSpineReady`，原 Mod 没有使用这个等待机制。

修复方式：

- 先等待 Spine 骨骼准备完成。
- 骨骼准备完成后，再调用 `SetAnimation` 播放背景循环动画。
- 普通选人背景使用 `b_idle`；动态角色展示场景使用 `11_step10_play_ko`。

### 3. 进入游戏后仍显示原版故障机器人

表现：

- 选人界面的蒂菲拉图案已经出现。
- 进入战斗后，角色主体仍是原版故障机器人，没有替换成蒂菲拉模型。

主要原因：

- 原 Mod 只扫描 `Body` 节点的直接子节点，寻找其中的 `SpineSprite`。
- 当前游戏版本把角色主体本身直接作为 `SpineSprite` 挂在 `Body` 上，不再是旧版的子节点结构。
- 因此旧代码找不到目标节点，替换函数直接结束，原版模型继续显示。
- 另外，模型替换也可能发生在 Spine 骨骼初始化完成之前，导致替换调用没有实际效果。

修复方式：

- 如果 `Body` 本身就是 `SpineSprite`，直接把它作为替换目标。
- 保留旧版子节点扫描逻辑，兼容旧结构。
- 对模型资源使用当前 PCK 中的资源：

`res://TifiraDefectSkin/tifirabody/Tifira.tres`

- 必要时在 Spine 准备完成后再执行模型替换。

### 4. 出牌后卡住或动作队列不再继续

表现：

- 进入战斗后点击卡牌，角色动作或卡牌流程卡住。
- 攻击、胜利、受伤等动作播放异常。
- 游戏日志出现 `MissingMethodException`，尤其是 `MegaAnimationState.SetAnimation` 或 `AddAnimation`。

主要原因：

当前游戏版本为 `v0.111.0`，而两个 Mod 的 DLL 编译时间为 2026-05-23，使用了旧版 API 签名：

- 旧版 `MegaAnimationState.SetAnimation(...)` 返回动画轨道对象。
- 当前版 `SetAnimation(...)` 返回 `void`。
- 旧版 `MegaAnimationState.AddAnimation(...)` 返回动画轨道对象。
- 当前版 `AddAnimation(...)` 返回 `void`。
- 旧版使用 `GetAnimations()`。
- 当前版改为 `GetAnimationNames()`，并返回 `IReadOnlyList<string>`。

旧 DLL 仍按旧签名调用时，运行时无法找到方法，抛出 `MissingMethodException`。异常发生在动作队列中，会使后续动作和出牌流程无法正常完成。

修复方式：

- 在 DLL 中加入兼容包装函数。
- 将旧的 `SetAnimation`、`AddAnimation`、`GetAnimations` 调用转换为当前游戏 API。
- 兼容函数保留旧调用方需要的返回类型，当前游戏 API 执行完成后返回空轨道对象，避免旧代码因签名不匹配而崩溃。

### 5. 快速连续动作可能再次卡住

表现：

- 普通动作基本正常。
- 快速连续出牌、触发强化或连续动画时，角色可能卡在某个动作上。

主要原因：

- 原 Mod 的蒂菲拉 Spine 资源没有名为 `process` 的动画。
- 游戏的 `PowerUp` 触发器在当前角色动画逻辑中可能会被映射到 `process`。
- 对蒂菲拉模型来说，该动画不存在，导致动画状态机无法正常回到待机动画。

修复方式：

- 仅对被标记为蒂菲拉模型的角色，将 `PowerUp` 触发器转换为蒂菲拉资源中存在的 `Cast` 动画。
- 不修改其他角色的动作逻辑。

### 6. 两个 Mod 之间的关系

`TifiraDefectSkin` 负责模型和动画，`TifiraCardSkin` 负责卡图。两者可以同时启用，但卡面 Mod 的资源路径和角色模型 Mod 的资源路径是分开的。

如果只安装卡面 Mod：

- 卡图可能替换成功。
- 角色模型不会替换。

如果只安装模型 Mod：

- 角色模型和选人界面可能替换。
- 卡面仍使用原版，除非其他卡面 Mod 正在生效。

## 三、当前修正版已经处理的内容

`TifiraMods-fixed.zip` 中包含：

- 修复新版 `SetAnimation` API 不兼容。
- 修复新版 `AddAnimation` API 不兼容。
- 将 `GetAnimations()` 适配为 `GetAnimationNames()`。
- 选人界面等待 Spine 骨骼初始化后再播放动画。
- 兼容当前版本 `Body` 本身就是 `SpineSprite` 的节点结构。
- 卡图资源替换前检查资源是否存在，资源不存在时保留原卡图。
- 将蒂菲拉模型不支持的 `PowerUp -> process` 动画触发转换为 `Cast`。
- 原始 `TifiraDefectSkin` 和 `TifiraCardSkin` 文件未修改，可以用于回滚。

截至当前日志检查结果：

- 游戏能加载并初始化 `TifiraDefectSkin`。
- 游戏能加载并初始化 `TifiraCardSkin`。
- 最新日志中未再看到之前导致卡住的 `MissingMethodException`。
- 最新日志仍有大量旧 UID 回退警告，这些警告本身通常不是致命错误。
- 最新日志的主要战斗流程是铁甲战士，尚未凭日志确认故障机器人实际进入战斗后的模型替换结果，因此需要按下面的故障机器人专项流程验证。

## 四、安装修正版的操作步骤

### 1. 关闭游戏

完全退出《杀戮尖塔 2》，确认任务管理器中没有残留游戏进程。

### 2. 打开当前安装目录

进入steam，右键 `slay the spire2` ，点击管理，点击浏览本地目录



### 3. 解压修正版


把压缩包中的以下两个文件夹复制到游戏的 `mods` 目录：

- `TifiraDefectSkin`
- `TifiraCardSkin`

最终目录应包含：

`D:\Game\Steam\steamapps\common\Slay the Spire 2\mods\TifiraDefectSkin\TifiraDefectSkin.dll`

`D:\Game\Steam\steamapps\common\Slay the Spire 2\mods\TifiraDefectSkin\TifiraDefectSkin.pck`

`D:\Game\Steam\steamapps\common\Slay the Spire 2\mods\TifiraCardSkin\TifiraCardSkin.dll`

`D:\Game\Steam\steamapps\common\Slay the Spire 2\mods\TifiraCardSkin\TifiraCardSkin.pck`


### 4. 第一次测试时减少 Mod 干扰

测试蒂菲拉故障机器人时，建议暂时禁用其他会修改角色模型或 Spine 动画的 Mod，尤其是：

- 其他角色皮肤 Mod。
- 其他故障机器人或角色动画 Mod。
- 会修改角色 `Ready`、模型或动画触发器的 Mod。

其他 Mod 的错误可能与蒂菲拉无关。例如日志中出现过 `OrchisNecrobinderSkinMod` 的模型初始化错误，这属于另一个 Mod 的问题。

## 五、专项验证流程(可无视)

### A. 验证选人界面动画

1. 启动游戏。
2. 打开角色选择界面。
3. 选择故障机器人。
4. 观察蒂菲拉背景是否持续变化，而不是只显示一张静态图。
5. 返回角色选择界面后再次进入，确认动画仍能播放。

### B. 验证战斗模型

1. 使用故障机器人开始一局新游戏。
2. 进入第一场战斗。
3. 观察角色主体是否已经替换为蒂菲拉模型。
4. 依次测试普通出牌、攻击、获得能量、结束回合和胜利动画。
5. 快速连续打出两到三张牌，确认动作队列能够继续完成。

### C. 验证卡面

1. 在故障机器人牌组中检查攻击牌、防御牌和能力牌。
2. 确认卡面图片显示正常。
3. 如果某张卡仍显示原图，不要立即判断为故障，先确认该卡是否在原 Mod 的替换范围内。

## 六、出现问题时如何收集日志(可无视)

完成一次专项测试后，关闭游戏，打开 PowerShell，执行：

```powershell
$log = Get-ChildItem 'C:\Users\25566\AppData\Roaming\SlayTheSpire2\logs' -Filter '*.log' |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

Select-String -LiteralPath $log.FullName -Pattern `
    'TifiraDefectSkin', 'TifiraCardSkin', 'MissingMethodException', `
    'NullReferenceException', 'SetSkeletonDataRes', 'SpineSprite', `
    'invalid UID', 'Exception' |
    Select-Object -Last 200
```

重点查看：

- 是否还有 `MissingMethodException`。
- 是否出现 `NullReferenceException`。
- 是否有模型资源 `Tifira.tres` 加载失败。
- 是否仍然只出现资源 UID 警告，且没有后续异常。

当前日志位置通常为：

`C:\Users\25566\AppData\Roaming\SlayTheSpire2\logs\godot.log`

## 七、回滚操作(可无视)

如果修正版导致新的问题：

1. 关闭游戏。
2. 删除或移走当前的 `TifiraDefectSkin` 和 `TifiraCardSkin` 文件夹。
3. 将 `TifiraDefectSkin_original` 改回 `TifiraDefectSkin`。
4. 将 `TifiraCardSkin_original` 改回 `TifiraCardSkin`。
5. 重新启动游戏。

## 八、结论

这两个 Mod 的核心问题不是图片素材本身损坏，而是 Mod DLL 针对旧版《杀戮尖塔 2》编译，遇到了新版 API、Spine 异步初始化和角色节点结构变化。最严重的问题是旧动画 API 引发的 `MissingMethodException`，它会直接中断动作队列并表现为出牌卡住。

当前修正版已经覆盖这些兼容性问题。选人界面动画和故障机器人战斗模型还必须使用故障机器人角色实际开局验证；验证时应暂时排除其他角色皮肤 Mod 的干扰，并以专项测试后的最新日志作为最终判断依据。

## 九、实际修复过程：我是怎样改 Bug 的

这一部分说明修复 DLL 的技术过程，不是安装步骤。修改对象是 Mod 的托管 DLL；PCK 内的贴图、Spine 图集和模型资源没有重新绘制，也没有覆盖原始文件。

### 第一步：确认游戏版本和 DLL 是否匹配

先读取游戏目录中的 `sts2.dll` 和 `GodotSharp.dll`，再读取两个 Mod 的 DLL，检查它们引用的类型、方法名、参数数量和返回值。对照后发现，Mod 编译时使用的接口与当前 `v0.111.0` 不一致。

重点差异如下：

| 调用 | Mod 期待的旧接口 | 当前游戏接口 | 处理方式 |
|---|---|---|---|
| `MegaAnimationState.SetAnimation` | 返回轨道对象 | 返回 `void` | 加兼容包装方法 |
| `MegaAnimationState.AddAnimation` | 返回轨道对象 | 返回 `void` | 加兼容包装方法 |
| `GetAnimations` | 返回旧集合 | 已改为 `GetAnimationNames()` | 转换为名称列表 |
| 角色模型节点 | `Body` 的子节点包含 `SpineSprite` | `Body` 本身可能就是 `SpineSprite` | 增加直接节点路径 |

这一步解释了为什么问题同时表现为“出牌卡住”和“模型不替换”：它们不是两个完全独立的图片问题，而是同一个旧 DLL 在新版运行时遇到多个兼容性变化。

### 第二步：用 Mono.Cecil 修改 DLL 的 IL 引用

由于没有原始工程源码和当前版本的完整编译环境，采用 Mono.Cecil 直接修改程序集。`patch_mods.ps1` 的处理逻辑是：

1. 加载当前游戏的 `sts2.dll` 和 `GodotSharp.dll`，从中取得当前版本真实的方法签名。
2. 加载原始 `TifiraDefectSkin.dll`。
3. 遍历所有类型和方法的 IL 指令。
4. 找到旧的 `SetAnimation`、`AddAnimation` 和 `GetAnimations` 方法引用。
5. 在 `TifiraDefectSkin.Scripts.Entry` 中注入新的兼容方法。
6. 把旧 IL 指令的目标替换为这些兼容方法。
7. 写出新的 DLL，不修改原 DLL。

注入的兼容方法大致对应以下逻辑：

```csharp
TrackEntry SetAnimationCompat(
    MegaAnimationState state, string name, bool loop, int trackId)
{
    state.SetAnimation(name, loop, trackId);
    return null;
}

TrackEntry AddAnimationCompat(
    MegaAnimationState state, string name, float delay,
    bool loop, int trackId)
{
    state.AddAnimation(name, delay, loop, trackId);
    return null;
}
```

这里返回 `null` 的目的，是维持旧 Mod 调用方的栈结构和返回类型；真正的动画调用已经由当前版本的 `void` 方法完成。这样可以避免运行时继续寻找旧返回值签名，从根源上消除 `MissingMethodException`。

对 `GetAnimations` 的处理不是简单改名字，而是增加了适配层：调用当前的 `GetAnimationNames()`，再通过 `Count` 和索引器提供旧代码需要的遍历形式。

### 第三步：修复选人界面静态动画

反编译后发现，原逻辑在加载 `.tres` 后立即取得 Spine 数据并调用播放动画。新版游戏的 Spine 资源初始化是异步的，因此这个时刻可能只有节点，没有可用的 skeleton data。原 Mod 的异常处理会吞掉这个时序错误，最终留下静态初始画面。

修复时把原先的“立即读取 skeleton 并播放”改成：

```text
加载场景
  -> 找到 SpineSprite
  -> RunWhenSpineReady
  -> 骨骼准备完成
  -> SetAnimation
```

具体做法是在 DLL 中注入 `PlayBackgroundAnimation` 和 `PlayBackgroundAnimationReady` 两个方法：

- `PlayBackgroundAnimation` 保存要播放的动画名。
- 调用游戏现有的 `SpineNodeExtensions.RunWhenSpineReady`。
- 回调 `PlayBackgroundAnimationReady`。
- 回调中设置时间倍率并调用新版 `SetAnimation`。

因此，静态图问题的修复重点不是替换 PNG，而是把动画调用从错误的初始化时机移动到 Spine 已就绪之后。

### 第四步：修复战斗模型没有替换

反编译 `NCreature_Ready_Patch.Postfix` 后，发现原代码类似于：

```text
Body.GetChildren()
  -> 遍历子节点
  -> 找 SpineSprite
  -> 替换 skeleton
```

但当前版本的节点结构可能是：

```text
NCreature
  -> Body (SpineSprite)
```

也就是说，`Body.GetChildren()` 找不到目标，补丁没有抛出明显错误，只是走完了“未找到模型”的路径。

因此在原有子节点扫描前插入了一个判断：

```text
如果 Body.GetClass() == "SpineSprite"
    直接把 Body 作为目标模型
否则
    继续执行旧版的子节点扫描
```

这样既适配当前游戏结构，也保留旧版本结构的兼容性。目标资源仍然使用 PCK 中的：

`res://TifiraDefectSkin/tifirabody/Tifira.tres`

### 第五步：修复 `PowerUp` 触发不存在动画的问题

继续检查动作状态机后发现，蒂菲拉的 Spine 资源没有 `process` 动画，但某些快速连续动作会把 `PowerUp` 触发器映射到 `process`。这会让状态机进入不存在的动画状态，表现为动作停住或后续动作不再排队。

修复时注入了 `NormalizePowerUpTrigger`，并通过 Mod 自己已有的 Harmony 初始化流程给 `CreatureAnimator.SetTrigger` 加前置补丁：

```text
如果角色的 SpineSprite 带有 is_tifira 标记
且 trigger == "PowerUp"
    trigger 改为 "Cast"
```

只对蒂菲拉模型处理，避免改变其他角色的动画行为。`ApplyPowerUpAnimationPatch` 只负责注册这个 Harmony 补丁；补丁本身在后续版本修复中保留为空实现，以避免重复注册造成冲突。

### 第六步：修复卡面资源加载失败时的连锁影响

反编译 `TifiraCardSkin` 的卡图 Postfix 后，发现它会直接把替换路径写入结果，即使路径对应的资源不存在。新版资源目录发生变化时，这会把原本有效的卡图结果替换成空资源。

在写入替换结果前插入：

```csharp
if (!ResourceLoader.Exists(replacementPath, null))
    return;
```

这样单张卡图路径失效时保留原版图片，不会影响其他卡牌，也不会因为一张资源缺失而中断整个卡面补丁。

### 第七步：输出、部署和验证

修复脚本将两个新的 DLL 输出到独立目录，再复制原始 JSON 和 PCK：

- DLL：已修改。
- JSON：保持原样。
- PCK：保持原样。
- 原始 DLL：保持原样，用于回滚。

然后把修复后的 DLL 部署到游戏 `mods` 目录。通过日志确认：

- 两个 Mod 都能完成初始化。
- 游戏流程中不再出现原先的 `MissingMethodException`。
- 仍看到 `invalid UID ... using text path instead` 时，说明 Godot 正在从 UID 回退到文本路径；只要资源最终显示且后续没有异常，这属于兼容性警告。

模型替换和动态动画必须用故障机器人实际开局验证，因为仅启动 Mod 或使用铁甲战士进入战斗，无法覆盖 `NCreature_Ready_Patch` 的故障机器人路径。

## 修复版夸克网盘链接
链接：https://pan.quark.cn/s/8ea0bcd20b49?pwd=1V3H
提取码：1V3H