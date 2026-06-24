# 中世纪战争 - 游戏设计文档

## 一、游戏概述

一款基于Unity3D引擎的中世纪战争游戏，参考《骑马与砍杀》风格，采用大地图旅行 + 3D战斗的双模式玩法。

### 核心特色
- **大地图战略层**：在广阔的中世纪地图上旅行，探索城镇、村庄、城堡等地点
- **3D战斗层**：遭遇敌人后进入即时动作战斗，体验近身肉搏的刺激
- **写实风格**：中世纪战争题材，注重真实感与沉浸感

---

## 二、游戏玩法设计

### 2.1 大地图模式

#### 地图节点类型
| 类型 | 说明 | 是否有敌人 |
|------|------|-----------|
| 城镇(Town) | 交易、补给、招募士兵 | 否 |
| 村庄(Village) | 小型补给点 | 否 |
| 城堡(Castle) | 战略要地，防御坚固 | 是 |
| 敌军营地(EnemyCamp) | 敌方正规军 | 是 |
| 强盗巢穴(BanditLair) | 强盗土匪 | 是 |
| 森林(Forest) | 地形障碍 | 随机 |
| 山脉(Mountain) | 地形障碍 | 否 |
| 河流(River) | 地形障碍 | 否 |

#### 旅行机制
- 玩家只能在**相邻连接**的节点之间移动
- 点击相邻节点即可开始旅行
- 旅行过程中玩家标记在地图上平滑移动
- 抵达新节点后触发相应事件

#### 节点交互
- **攻击**：若节点有敌人且未被清除，可发起进攻
- **进入**：若节点安全，可进入查看详情（扩展功能）

---

### 2.2 战斗模式

#### 操作方式
| 按键 | 功能 |
|------|------|
| W/A/S/D | 移动 |
| 鼠标移动 | 视角旋转（第三人称跟随） |
| 鼠标左键 | 攻击（近战挥砍） |
| 鼠标右键 | 防御（举盾格挡） |
| ESC | 暂停菜单 |

#### 战斗属性
- **生命值(HP)**：角色生命值，归零则死亡
- **攻击力**：每次攻击造成的基础伤害
- **防御力**：减免受到的伤害
- **攻击速度**：攻击冷却时间
- **攻击范围**：近战攻击有效距离
- **格挡减伤**：防御状态下的伤害减免比例（默认50%）

#### 伤害公式
```
实际伤害 = max(1, 基础攻击 - 防御力) * (防御状态 ? 0.5 : 1.0)
```

#### 敌人AI行为
1. **巡逻状态**：在出生点附近随机巡逻
2. **警戒状态**：检测到玩家进入视野范围
3. **追击状态**：朝玩家方向移动
4. **攻击状态**：进入攻击范围后发起攻击
5. **撤退状态**：玩家脱离追击范围后返回出生点

---

### 2.3 胜负机制

#### 战斗胜利条件
- 消灭所有敌人
- 玩家存活

#### 战斗失败条件
- 玩家生命值归零

#### 战斗结算
- 胜利：清除当前地图节点的敌人，返回大地图
- 失败：可选择重试或返回大地图

---

## 三、核心代码结构

### 3.1 目录结构
```
Assets/
├── Scripts/
│   ├── Core/           # 核心系统
│   │   ├── GameManager.cs       # 游戏状态管理
│   │   └── EventManager.cs      # 全局事件系统
│   ├── Character/      # 角色系统
│   │   ├── CharacterStats.cs    # 角色属性数据
│   │   ├── CharacterHealth.cs   # 生命值与受伤逻辑
│   │   ├── CharacterMotor.cs    # 角色移动控制
│   │   ├── PlayerController.cs  # 玩家输入控制
│   │   └── EnemyAI.cs           # 敌人AI状态机
│   ├── Combat/         # 战斗系统
│   │   ├── CharacterCombat.cs   # 角色战斗逻辑
│   │   ├── BattleManager.cs     # 战斗管理器
│   │   └── BattleInitializer.cs # 战斗初始化
│   ├── Map/            # 大地图系统
│   │   ├── MapNode.cs           # 地图节点
│   │   ├── WorldMapManager.cs   # 大地图管理器
│   │   └── WorldMapCamera.cs    # 大地图相机
│   ├── UI/             # UI系统
│   │   ├── MainMenuUI.cs        # 主菜单UI
│   │   ├── BattleHUD.cs         # 战斗HUD
│   │   ├── WorldMapUI.cs        # 大地图UI
│   │   ├── BattleResultUI.cs    # 战斗结算UI
│   │   └── PauseMenuUI.cs       # 暂停菜单
│   ├── Animation/      # 动画系统
│   │   └── CharacterAnimation.cs # 角色动画控制
│   ├── Management/     # 管理系统
│   │   ├── SceneController.cs   # 场景切换控制器
│   │   ├── GameBootstrap.cs     # 游戏启动器
│   │   ├── MainMenuSetup.cs     # 主菜单场景搭建
│   │   ├── WorldMapSceneSetup.cs# 大地图场景搭建
│   │   └── BattleSceneSetup.cs  # 战斗场景搭建
│   └── Utils/          # 工具类
│       ├── GameObjectExtensions.cs # GameObject扩展方法
│       └── DemoCharacterFactory.cs # Demo角色工厂
├── Data/               # 数据配置
├── Scenes/             # 场景文件
├── Prefabs/            # 预制体
└── Art/                # 美术资源
    ├── Models/
    ├── Textures/
    ├── Animations/
    └── Materials/
```

### 3.2 核心系统架构

#### 游戏状态机
```
MainMenu → WorldMap → Battle → Victory/Defeat → WorldMap
              ↑                        ↓
              └────────────────────────┘
```

#### 事件系统
使用静态事件管理器解耦各模块：
- `EventManager.Character` - 角色相关事件
- `EventManager.Battle` - 战斗相关事件
- `EventManager.WorldMap` - 大地图相关事件
- `EventManager.UI` - UI相关事件

---

## 四、基础素材方案

### 4.1 角色模型

#### 玩家角色
- **推荐风格**：中世纪骑士/战士造型
- **参考资源**：
  - Mixamo免费角色模型 + 动作库
  - Unity Asset Store: "Medieval Warrior Pack"
- **必备骨骼**：人形Avatar标准骨骼

#### 敌人类型
| 敌人类型 | 难度 | 建议来源 |
|---------|------|---------|
| 强盗(Bandit) | 简单 | Mixamo "Bandit" 模型 |
| 轻步兵(Light Infantry) | 中等 | "Medieval Soldiers Pack" |
| 骑士(Knight) | 困难 | "Knight Character Pack" |

### 4.2 动画资源

#### 必备动画剪辑
| 动画名称 | 说明 | 循环 |
|---------|------|------|
| Idle | 待机 | 是 |
| Walk | 行走 | 是 |
| Run | 奔跑 | 是 |
| Attack | 攻击挥砍 | 否 |
| Block | 防御姿势 | 是 |
| Hit | 受击 | 否 |
| Death | 死亡 | 否 |

#### Animator参数
- `Speed` (Float) - 移动速度，控制行走/奔跑/待机混合
- `IsAttacking` (Bool) - 是否在攻击
- `IsBlocking` (Bool) - 是否在防御
- `IsDead` (Bool) - 是否死亡
- `Attack` (Trigger) - 触发攻击动画
- `Hit` (Trigger) - 触发受击动画

### 4.3 场景素材

#### 大地图
- **地形贴图**：草地、山地、沙漠、雪地等
- **地标模型**：城堡、城镇、村庄图标（2D Sprite或3D模型）
- **连接线**：节点之间的路径可视化

#### 战斗场景
- **地形**：中世纪战场地形（草地、土路、石块）
- **道具**：树木、岩石、栅栏、破车等掩体
- **天空盒**：中世纪风格天空盒

### 4.4 UI素材

#### 风格参考
- 参考《骑马与砍杀》UI风格：羊皮纸质感、金属边框、中世纪字体
- 主色调：棕色、金色、暗红色、深灰色

#### 必备UI元素
- 血条：带金属边框的横条血条
- 按钮：带雕刻纹理的金属按钮
- 面板：羊皮纸/皮革质感面板
- 字体：中世纪风格字体（推荐：Cinzel、UnifrakturMaguntia）

### 4.5 音效资源

| 类别 | 内容 | 建议来源 |
|------|------|---------|
| 背景音 | 大地图背景音乐、战斗背景音乐 | YouTube Audio Library |
| 音效 | 挥砍声、命中声、盾挡声、脚步声 | Freesound.org |
| 人声 | 战吼、受击呻吟、死亡叫声 | 自制或素材库 |

### 4.6 免费资源推荐

| 资源名称 | 类型 | 来源 |
|---------|------|------|
| Mixamo | 角色模型+动画 | www.mixamo.com |
| Unity Asset Store Free | 各种素材 | assetstore.unity.com |
| Poly Haven | 贴图/HDRI | polyhaven.com |
| Kenney | UI/图标 | kenney.nl/assets |
| Freesound | 音效 | freesound.org |

---

## 五、Demo快速上手

### 5.1 导入步骤
1. 在Unity中创建新的3D项目
2. 将 `Assets/Scripts` 目录下的所有脚本复制到项目中
3. 创建空场景，添加空物体并挂载 `GameBootstrap` 组件
4. 在Inspector中选择启动模式（MainMenu/WorldMap/Battle）
5. 点击运行即可体验

### 5.2 Demo模式说明
- **MainMenu**：主菜单界面，点击"开始游戏"进入大地图
- **WorldMap**：大地图模式，点击相邻节点旅行，到达有敌人的节点可发起战斗
- **Battle**：直接进入战斗场景，体验战斗操作

### 5.3 注意事项
- Demo使用程序化生成的占位角色和场景，无美术资源也可运行
- 角色使用胶囊体+球体的简单几何体代替
- 动画系统已预留接口，接入真实模型和动画后即可正常工作
- 建议使用Unity 2020.3 LTS或更高版本

---

## 六、扩展方向

### 短期扩展
- 装备系统（武器、防具）
- 技能系统
- 物品/背包系统
- 队伍系统（招募同伴）

### 中期扩展
- 骑乘系统（马匹）
- 远程攻击（弓箭）
- 城堡围攻战
- 经济系统（交易、税收）

### 长期扩展
- 阵营/声望系统
- 任务系统
- 多人联机
- 开放世界沙盒玩法
