# 中世纪战争 - Unity3D 游戏 Demo

一款基于 Unity3D 引擎的中世纪战争游戏，参考《骑马与砍杀》风格，包含大地图旅行 + 3D 战斗双模式。

## 🚀 快速开始（3步运行）

### 第一步：打开项目

1. 安装 **Unity Hub** 和 **Unity 2022.3 LTS**（或更高版本）
2. 打开 Unity Hub，点击 **"Add"** → **"Add project from disk"**
3. 选择 `MedievalWarfare_UnityProject` 文件夹
4. 等待 Unity 导入完成

### 第二步：生成场景

1. 打开项目后，在顶部菜单栏找到 **"中世纪战争"**
2. 点击 **"一键生成所有场景"**
3. 等待生成完成（会弹出提示对话框）

### 第三步：运行游戏

1. 在 Project 窗口中找到 `Assets/Scenes/MainMenu.unity`
2. 双击打开主菜单场景
3. 点击顶部的 **▶ Play** 按钮运行游戏

---

## 🎮 游戏玩法

### 主菜单
- **开始游戏**：进入大地图开始冒险
- **继续游戏**：继续游戏（同开始游戏）
- **设置**：设置面板
- **退出游戏**：退出游戏

### 大地图模式
| 操作 | 说明 |
|------|------|
| W / A / S / D | 移动地图视角 |
| 鼠标滚轮 | 缩放地图 |
| 鼠标左键点击节点 | 选择节点/前往相邻节点 |
| ESC | 暂停菜单 |

地图节点类型：
- 🔵 **城堡** - 战略要地，有精锐部队驻守
- 🟡 **村庄** - 安全地点
- 🔴 **强盗营地** - 低难度敌人
- 🟣 **敌军营地** - 中等难度敌人
- 🟢 **要塞** - 高难度敌人
- ⚪ **起始据点** - 你的出发点

### 战斗模式
| 操作 | 说明 |
|------|------|
| W / A / S / D | 移动角色 |
| 鼠标移动 | 旋转视角（第三人称跟随） |
| 鼠标左键 | 近战攻击 |
| 鼠标右键（按住） | 举盾防御（减免50%伤害） |
| ESC | 暂停菜单 |

### 战斗机制
- **生命值**：玩家150HP，敌人80HP
- **伤害计算**：实际伤害 = max(1, 攻击力 - 防御力) × 格挡减伤
- **敌人AI**：巡逻 → 发现玩家 → 追击 → 攻击 → 撤退

---

## 📁 项目结构

```
MedievalWarfare_UnityProject/
├── Assets/
│   ├── Scenes/              # 场景文件（生成后出现）
│   └── Scripts/
│       ├── Editor/          # 编辑器工具
│       │   ├── GameSceneGenerator.cs   # 一键生成场景
│       │   └── GameBuilder.cs          # 构建工具
│       ├── Core/              # 核心系统
│       │   ├── GameManager.cs
│       │   └── EventManager.cs
│       ├── Character/         # 角色系统
│       │   ├── CharacterStats.cs
│       │   ├── CharacterHealth.cs
│       │   ├── CharacterMotor.cs
│       │   ├── PlayerController.cs
│       │   └── EnemyAI.cs
│       ├── Combat/            # 战斗系统
│       │   ├── CharacterCombat.cs
│       │   ├── BattleManager.cs
│       │   └── BattleInitializer.cs
│       ├── Map/               # 大地图系统
│       │   ├── MapNode.cs
│       │   ├── WorldMapManager.cs
│       │   └── WorldMapCamera.cs
│       ├── UI/                # UI系统
│       │   ├── MainMenuUI.cs
│       │   ├── BattleHUD.cs
│       │   ├── WorldMapUI.cs
│       │   ├── BattleResultUI.cs
│       │   └── PauseMenuUI.cs
│       ├── Animation/         # 动画系统
│       │   └── CharacterAnimation.cs
│       ├── Management/        # 管理系统
│       │   ├── SceneController.cs
│       │   ├── GameBootstrap.cs
│       │   ├── MainMenuSetup.cs
│       │   ├── WorldMapSceneSetup.cs
│       │   └── BattleSceneSetup.cs
│       └── Utils/             # 工具类
│           ├── GameObjectExtensions.cs
│           └── DemoCharacterFactory.cs
├── Packages/
│   └── manifest.json
├── ProjectSettings/
│   └── ProjectVersion.txt
└── README.md
```

---

## 🔧 构建可执行程序

### 在 Unity 编辑器中构建

1. 确保已生成所有场景（**中世纪战争 → 一键生成所有场景**）
2. 点击菜单 **中世纪战争 → 构建 → Windows版本**（或 Linux / macOS）
3. 等待构建完成
4. 构建产物在 `Build/` 文件夹中

### 构建产物
- **Windows**: `Build/Windows/MedievalWarfare.exe`
- **Linux**: `Build/Linux/MedievalWarfare`
- **macOS**: `Build/macOS/MedievalWarfare.app`

---

## 🎨 接入真实美术资源

### 角色模型
1. 导入人型模型（Humanoid Avatar）
2. 添加组件：`CharacterController` + `CharacterHealth` + `CharacterMotor` + `CharacterCombat` + `Animator` + `CharacterAnimation`
3. 玩家额外添加 `PlayerController`，敌人额外添加 `EnemyAI`
4. 配置 Animator Controller

### Animator 参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| Speed | Float | 移动速度（0=待机，1=移动） |
| IsAttacking | Bool | 是否在攻击 |
| IsBlocking | Bool | 是否在防御 |
| IsDead | Bool | 是否死亡 |
| Attack | Trigger | 触发攻击动画 |
| Hit | Trigger | 触发受击动画 |

### 推荐免费资源
- **模型动画**：[Mixamo](https://www.mixamo.com/) - 免费角色模型和动画
- **贴图素材**：[Poly Haven](https://polyhaven.com/) - 免费PBR贴图
- **UI素材**：[Kenney Assets](https://kenney.nl/assets) - 免费游戏素材
- **音效**：[Freesound](https://freesound.org/) - 免费音效

---

## 🐛 常见问题

### Q: 点击"一键生成所有场景"后报错？
A: 确保使用 Unity 2022.3 LTS 或更高版本。如果是旧版本，可能需要升级。

### Q: 角色不能移动？
A: 检查是否添加了 `CharacterController` 组件，以及 `CharacterMotor` 组件。

### Q: 敌人不攻击玩家？
A: 确保玩家对象的 Tag 设置为 "Player"。

### Q: 点击大地图节点没反应？
A: 只有与当前位置**相邻连接**的节点才能直接前往。当前节点会显示信息面板。

### Q: 如何修改敌人数量/难度？
A: 在 `WorldMapManager` 中找到对应节点，在 Inspector 中修改 `Enemy Count` 和难度倍率。

---

## 📖 更多信息

完整的游戏设计文档请参考 `MedievalWarfare/DESIGN_DOC.md`，包含：
- 详细玩法设计
- 核心代码架构说明
- 完整素材方案
- 扩展方向建议

---

## 📜 License

MIT License
