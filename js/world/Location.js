// ================================
// 大陆风云 - 地点基类
// ================================

export class Location {
  constructor(config) {
    this.id = config.id || '';
    this.name = config.name || '未知地点';
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.type = 'location';
  }
  
  // 获取距离
  distanceTo(other) {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }
  
  // 判断是否在范围内
  isInRange(other, range) {
    return this.distanceTo(other) <= range;
  }
}
