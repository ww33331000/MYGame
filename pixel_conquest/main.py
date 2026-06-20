"""
像素骑士：大陆争霸
一款类骑马与砍杀的像素风格开放世界游戏
"""

__version__ = "0.1.0"
__author__ = "Game Developer"

from game.core.game import Game

def main():
    """游戏入口"""
    game = Game()
    game.run()

if __name__ == "__main__":
    main()