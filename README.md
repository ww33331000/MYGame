# 中世纪战争 - 游戏 Demo 完整包

包含两个版本的中世纪战争游戏 Demo，满足不同需求。

---

## 📦 内容说明

### 版本一：Web 版 Demo（立即可玩 ⭐ 推荐）

**位置：** `MedievalWarfare_WebDemo/`

- ✅ 无需安装任何软件
- ✅ 浏览器直接打开就能玩
- ✅ 文件极小（单 HTML 文件，约 50KB）
- ✅ 完整游戏体验（大地图 + 3D 战斗）
- ✅ 跨平台（Windows / Mac / Linux 都能用）

**快速开始：**
1. 打开 `MedievalWarfare_WebDemo/index.html`
2. 用 Chrome / Edge / Firefox 浏览器打开
3. 点击「开始游戏」即可游玩

**注意：** 如果直接打开遇到问题，可以启动本地服务器：
```bash
cd MedievalWarfare_WebDemo
python3 -m http.server 8080
# 浏览器访问 http://localhost:8080
```

---

### 版本二：Unity 完整项目（可构建原生程序）

**位置：** `MedievalWarfare_UnityProject/`

- ✅ 完整的 Unity 3D 项目源码
- ✅ 28 个 C# 脚本，架构清晰
- ✅ 一键生成场景（编辑器菜单）
- ✅ 一键构建 Windows / Mac / Linux / WebGL
- ✅ 可扩展、可修改、可接入真实美术资源

**快速开始（5 分钟）：**
1. 安装 Unity Hub + Unity 2022.3 LTS（免费 Personal 版）
2. 用 Unity Hub 打开 `MedievalWarfare_UnityProject` 文件夹
3. 菜单：**中世纪战争 → 一键生成所有场景**
4. 打开 `Assets/Scenes/MainMenu.unity`，点击 ▶ Play 运行

**一键构建可执行程序：**
- 菜单：**中世纪战争 → 构建 → Windows版本**（或其他平台）
- 或运行脚本：`Build_Windows.bat`（Windows）/ `Build_MacLinux.sh`（Mac/Linux）

详细说明请查看 `MedievalWarfare_UnityProject/README.md`

---

## 🎮 游戏玩法

### 大地图模式
- 6 个可探索节点（村庄、森林、城堡等）
- 点击节点查看详情
- 只能前往相邻的节点
- 红色节点有敌人，击败后可占领

### 战斗模式
- **WASD** / 方向键 移动
- **鼠标** 控制视角
- **鼠标左键** 攻击
- **鼠标右键** 防御（减少 70% 伤害）
- **Shift** 奔跑
- **Esc** 暂停/退出

### 胜利条件
击败所有敌人即可获胜，生命值归零则战败。

---

## 🆚 两个版本对比

| 特性 | Web 版 (Three.js) | Unity 完整版 |
|------|-------------------|-------------|
| 立即可玩 | ✅ 是 | ❌ 需安装 Unity |
| 文件大小 | ~50KB（单文件） | ~28MB（项目源码） |
| 3D 画面 | ✅ 良好 | ✅ 优秀 |
| 大地图系统 | ✅ | ✅ |
| 战斗系统 | ✅ | ✅ |
| 敌人 AI | ✅ | ✅ |
| 角色动画 | ⚠️ 简单动画 | ✅ 完整 Animator |
| 可扩展性 | ⚠️ 需修改 JS | ✅ 完整 C# 架构 |
| 接入真实素材 | ❌ 不支持 | ✅ 完美支持 |
| 构建原生程序 | ❌ | ✅ Win/Mac/Linux/WebGL |

---

## 🎯 推荐使用场景

- **想立即体验游戏** → 使用 Web 版
- **想学习 Unity 开发** → 使用 Unity 项目
- **想修改/扩展游戏** → 使用 Unity 项目
- **想发布给别人玩** → 使用 Unity 项目构建

---

## 📁 文件结构

```
MedievalWarfare_Game/
├── MedievalWarfare_WebDemo/      # Web 版 Demo（立即可玩）
│   ├── index.html                 # 游戏主文件
│   └── README.md                  # 使用说明
│
├── MedievalWarfare_UnityProject/  # Unity 完整项目
│   ├── Assets/Scripts/            # 28个C#游戏脚本
│   ├── Packages/                  # 包配置
│   ├── ProjectSettings/           # 项目设置
│   ├── Build_Windows.bat          # Windows一键构建脚本
│   ├── Build_MacLinux.sh          # Mac/Linux一键构建脚本
│   └── README.md                  # 详细文档
│
└── README.md                      # 本文件
```
