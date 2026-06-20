// ================================
// 大陆风云 - 存档系统
// ================================

export class SaveLoadManager {
  constructor() {
    this.savePrefix = '大陆风云_save_';
    this.maxSlots = 3;
    this.currentVersion = '1.0.0';
  }
  
  // 保存游戏
  save(slot, data) {
    if (slot < 0 || slot >= this.maxSlots) {
      console.error('无效的存档位:', slot);
      return false;
    }
    
    try {
      const key = this.savePrefix + slot;
      const saveData = {
        ...data,
        version: this.currentVersion,
        saveVersion: data.version
      };
      
      const json = JSON.stringify(saveData);
      localStorage.setItem(key, json);
      return true;
    } catch (e) {
      console.error('保存失败:', e);
      return false;
    }
  }
  
  // 加载游戏
  load(slot) {
    if (slot < 0 || slot >= this.maxSlots) {
      console.error('无效的存档位:', slot);
      return null;
    }
    
    try {
      const key = this.savePrefix + slot;
      const json = localStorage.getItem(key);
      
      if (!json) {
        return null;
      }
      
      const data = JSON.parse(json);
      
      // 版本检查
      if (data.version !== this.currentVersion) {
        console.warn('存档版本不匹配:', data.version, 'vs', this.currentVersion);
        // 可以添加版本迁移逻辑
      }
      
      return data;
    } catch (e) {
      console.error('加载失败:', e);
      return null;
    }
  }
  
  // 删除存档
  delete(slot) {
    if (slot < 0 || slot >= this.maxSlots) {
      return false;
    }
    
    try {
      const key = this.savePrefix + slot;
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('删除失败:', e);
      return false;
    }
  }
  
  // 列出所有存档
  listSaves() {
    const saves = [];
    
    for (let i = 0; i < this.maxSlots; i++) {
      const data = this.load(i);
      saves.push(data);
    }
    
    return saves;
  }
  
  // 检查存档是否存在
  hasSave(slot) {
    const key = this.savePrefix + slot;
    return localStorage.getItem(key) !== null;
  }
  
  // 获取存档信息（不加载完整数据）
  getSaveInfo(slot) {
    const data = this.load(slot);
    
    if (!data) {
      return null;
    }
    
    return {
      version: data.version,
      timestamp: data.timestamp,
      playerName: data.player ? data.player.name : '未知',
      playerLevel: data.player ? data.player.level : 0,
      day: data.world ? data.world.day : 0
    };
  }
  
  // 导出存档为文件
  exportSave(slot) {
    const data = this.load(slot);
    if (!data) return null;
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `save_${slot}_${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }
  
  // 从文件导入存档
  async importSave(slot, file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          this.save(slot, data);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
  
  // 清除所有存档
  clearAllSaves() {
    for (let i = 0; i < this.maxSlots; i++) {
      this.delete(i);
    }
  }
}
