# 中世纪战争 (Medieval Warfare)

一款基于Unity3D引擎的中世纪战争游戏Demo，参考《骑马与砍杀》风格，包含大地图旅行和3D战斗双模式。

## 项目特性

- 🗺️ **大地图系统**：节点式地图，可在城镇、城堡、敌营之间旅行
- ⚔️ **战斗系统**：第三人称近战战斗，支持攻击和防御
- 🤖 **敌人AI**：巡逻、追击、攻击、撤退的完整状态机
- ❤️ **属性系统**：生命值、攻击力、防御力、格挡减伤
- 🎮 **完整UI**：主菜单、战斗HUD、大地图UI、结算界面、暂停菜单
- 🎨 **素材友好**：无美术资源也可运行，程序化生成占位内容

## 快速开始

### 环境要求
- Unity 2020.3 LTS 或更高版本
- .NET Framework 4.x

### 运行步骤

#### 方式一：使用GameBootstrap（推荐）

1. 打开Unity，创建新的3D项目
2. 将 `Assets/Scripts` 文件夹复制到项目的 `Assets` 目录下
3. 在场景中创建空物体，命名为 `GameBootstrap`
4. 给该物体添加 `GameBootstrap` 组件
5. 在Inspector的 `Start Mode` 中选择启动模式：
   - `MainMenu` - 从主菜单开始
   - `WorldMap` - 直接进入大地图
   - `Battle` - 直接进入战斗
6. 点击Play运行

#### 方式二：分别创建三个场景

1. 创建 `MainMenu` 场景，添加空物体挂 `MainMenuSetup`
2. 创建 `WorldMap` 场景，添加空物体挂 `WorldMapSceneSetup`
3. 创建 `BattleScene` 场景，添加空物体挂 `BattleSceneSetup`
4. 在Build Settings中添加三个场景
5. 从MainMenu场景开始运行

## 操作说明

### 战斗模式
| 按键 | 功能 |
|------|------|
| W / A / S / D | 移动 |
| 鼠标移动 | 旋转视角 |
| 鼠标左键 | 攻击 |
| 鼠标右键 | 防御（格挡） |
| ESC | 暂停 |

### 大地图模式
| 按键 | 功能 |
|------|------|
| W / A / S / D | 移动视角 |
| 鼠标滚轮 | 缩放地图 |
| 鼠标左键点击节点 | 选择/前往节点 |
| ESC | 暂停 |

## 核心脚本说明

### 核心系统
- [GameManager.cs](Assets/Scripts/Core/GameManager.cs) - 游戏状态管理（单例）
- [EventManager.cs](Assets/Scripts/Core/EventManager.cs) - 全局事件系统

### 角色系统
- [CharacterStats.cs](Assets/Scripts/Character/CharacterStats.cs) - 角色属性数据结构
- [CharacterHealth.cs](Assets/Scripts/Character/CharacterHealth.cs) - 生命值、受伤、死亡
- [CharacterMotor.cs](Assets/Scripts/Character/CharacterMotor.cs) - 角色移动（CharacterController）
- [PlayerController.cs](Assets/Scripts/Character/PlayerController.cs) - 玩家输入控制
- [EnemyAI.cs](Assets/Scripts/Character/EnemyAI.cs) - 敌人AI状态机

### 战斗系统
- [CharacterCombat.cs](Assets/Scripts/Combat/CharacterCombat.cs) - 角色战斗逻辑（攻击、格挡）
- [BattleManager.cs](Assets/Scripts/Combat/BattleManager.cs) - 战斗管理器（生成、胜负判定）

### 大地图系统
- [MapNode.cs](Assets/Scripts/Map/MapNode.cs) - 地图节点
- [WorldMapManager.cs](Assets/Scripts/Map/WorldMapManager.cs) - 大地图管理器
- [WorldMapCamera.cs](Assets/Scripts/Map/WorldMapCamera.cs) - 大地图相机控制

### UI系统
- [MainMenuUI.cs](Assets/Scripts/UI/MainMenuUI.cs) - 主菜单
- [BattleHUD.cs](Assets/Scripts/UI/BattleHUD.cs) - 战斗HUD（血条、敌人计数）
- [WorldMapUI.cs](Assets/Scripts/UI/WorldMapUI.cs) - 大地图UI
- [BattleResultUI.cs](Assets/Scripts/UI/BattleResultUI.cs) - 战斗结算
- [PauseMenuUI.cs](Assets/Scripts/UI/PauseMenuUI.cs) - 暂停菜单

### 管理系统
- [SceneController.cs](Assets/Scripts/Management/SceneController.cs) - 场景切换控制器
- [GameBootstrap.cs](Assets/Scripts/Management/GameBootstrap.cs) - 游戏启动器

## 接入真实美术资源

### 角色模型接入
1. 导入人型模型，配置Humanoid Avatar
2. 在模型上添加以下组件：
   - `CharacterController`
   - `CharacterHealth`
   - `CharacterMotor`
   - `CharacterCombat`
   - `Animator` + `CharacterAnimation`
   - 玩家额外添加 `PlayerController`
   - 敌人额外添加 `EnemyAI`
3. 配置Animator Controller，设置对应参数和状态

### 动画参数表
| 参数名 | 类型 | 说明 |
|--------|------|------|
| Speed | Float | 移动速度（0=待机, 1=行走/奔跑） |
| IsAttacking | Bool | 是否在攻击 |
| IsBlocking | Bool | 是否在防御 |
| IsDead | Bool | 是否死亡 |
| Attack | Trigger | 触发攻击动画 |
| Hit | Trigger | 触发受击动画 |

### 素材推荐
详见 [DESIGN_DOC.md](DESIGN_DOC.md) 中的"基础素材方案"章节。

## 项目结构

```
MedievalWarfare/
├── Assets/
│   └── Scripts/
│       ├── Core/          # 核心系统
│       ├── Character/     # 角色系统
│       ├── Combat/        # 战斗系统
│       ├── Map/           # 大地图系统
│       ├── UI/            # UI系统
│       ├── Animation/     # 动画系统
│       ├── Management/    # 管理系统
│       └── Utils/         # 工具类
└── DESIGN_DOC.md          # 详细设计文档
```

## 设计文档

完整的游戏设计文档请查看 [DESIGN_DOC.md](DESIGN_DOC.md)，包含：
- 游戏玩法详细设计
- 核心代码架构说明
- 基础素材方案
- 扩展方向建议

## License

MIT License
