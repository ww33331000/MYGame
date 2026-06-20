"""
游戏配置类
"""

class Settings:
    """游戏全局配置"""

    # 窗口设置
    WINDOW_WIDTH = 1280
    WINDOW_HEIGHT = 720
    WINDOW_TITLE = "像素骑士：大陆争霸"
    FPS = 60
    FULLSCREEN = False

    # 像素缩放
    TILE_SIZE = 32
    SCALE = 2

    # 颜色定义
    COLORS = {
        'white': (255, 255, 255),
        'black': (0, 0, 0),
        'red': (255, 0, 0),
        'green': (0, 255, 0),
        'blue': (0, 0, 255),
        'yellow': (255, 255, 0),
        'gray': (128, 128, 128),
        'dark_gray': (64, 64, 64),
        'light_gray': (192, 192, 192),
        'brown': (139, 69, 19),
        'gold': (255, 215, 0),
        'dark_green': (0, 100, 0),
        'dark_blue': (0, 0, 139),
        'purple': (128, 0, 128),
        'orange': (255, 165, 0),
    }

    # 世界地图设置
    WORLD_MAP_WIDTH = 200  # 地图格子宽度
    WORLD_MAP_HEIGHT = 150  # 地图格子高度

    # 世界生成参数
    NUM_TOWNS = 40
    NUM_CASTLES = 120
    NUM_VILLAGES = 300

    # 角色属性
    PLAYER_BASE_HEALTH = 100
    PLAYER_BASE_STAMINA = 100
    PLAYER_BASE_SPEED = 5

    # 战斗设置
    BATTLE_MAP_WIDTH = 80
    BATTLE_MAP_HEIGHT = 60

    # 经济设置
    STARTING_GOLD = 1000
    TRADE_TAX_RATE = 0.05  # 交易税率

    # 势力设置
    INITIAL_FACTIONS = 6  # 初始势力数量

    # 任务设置
    MAX_ACTIVE_QUESTS = 10

    # 存档设置
    SAVE_DIR = "saves"
    AUTO_SAVE_INTERVAL = 300  # 自动保存间隔(秒)

    @classmethod
    def get_scaled_tile_size(cls):
        """获取缩放后的瓦片大小"""
        return cls.TILE_SIZE * cls.SCALE

    @classmethod
    def get_resolution(cls):
        """获取分辨率"""
        return (cls.WINDOW_WIDTH, cls.WINDOW_HEIGHT)