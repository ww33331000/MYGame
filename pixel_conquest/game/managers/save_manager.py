"""
存档管理器
"""

import json
import os
from typing import Dict, Optional, List
from datetime import datetime


class SaveManager:
    """存档管理器"""

    def __init__(self, save_dir: str = "saves"):
        self.save_dir = save_dir
        self._ensure_save_dir()

    def _ensure_save_dir(self):
        """确保存档目录存在"""
        if not os.path.exists(self.save_dir):
            os.makedirs(self.save_dir)

    def save(self, save_name: str, game_data: Dict) -> bool:
        """保存游戏"""
        try:
            # 添加保存时间
            game_data['save_time'] = datetime.now().isoformat()
            game_data['save_name'] = save_name

            # 保存文件
            save_path = os.path.join(self.save_dir, f"{save_name}.json")
            with open(save_path, 'w', encoding='utf-8') as f:
                json.dump(game_data, f, ensure_ascii=False, indent=2)

            return True
        except Exception as e:
            print(f"保存失败: {e}")
            return False

    def load(self, save_name: str) -> Optional[Dict]:
        """加载游戏"""
        try:
            save_path = os.path.join(self.save_dir, f"{save_name}.json")
            if not os.path.exists(save_path):
                return None

            with open(save_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"加载失败: {e}")
            return None

    def delete(self, save_name: str) -> bool:
        """删除存档"""
        try:
            save_path = os.path.join(self.save_dir, f"{save_name}.json")
            if os.path.exists(save_path):
                os.remove(save_path)
                return True
            return False
        except Exception as e:
            print(f"删除失败: {e}")
            return False

    def get_save_list(self) -> List[Dict]:
        """获取存档列表"""
        saves = []
        try:
            for filename in os.listdir(self.save_dir):
                if filename.endswith('.json'):
                    save_path = os.path.join(self.save_dir, filename)
                    with open(save_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        saves.append({
                            'name': data.get('save_name', filename[:-5]),
                            'time': data.get('save_time', '未知'),
                            'day': data.get('day', 0),
                            'player_name': data.get('player', {}).get('name', '未知'),
                        })
        except Exception as e:
            print(f"获取存档列表失败: {e}")

        # 按时间排序
        saves.sort(key=lambda x: x['time'], reverse=True)
        return saves

    def get_quick_save_name(self) -> str:
        """获取快速存档名称"""
        return "quicksave"

    def get_auto_save_name(self) -> str:
        """获取自动存档名称"""
        return "autosave"

    def quick_save(self, game_data: Dict) -> bool:
        """快速存档"""
        return self.save(self.get_quick_save_name(), game_data)

    def quick_load(self) -> Optional[Dict]:
        """快速读档"""
        return self.load(self.get_quick_save_name())

    def auto_save(self, game_data: Dict) -> bool:
        """自动存档"""
        return self.save(self.get_auto_save_name(), game_data)

    def auto_load(self) -> Optional[Dict]:
        """自动读档"""
        return self.load(self.get_auto_save_name())