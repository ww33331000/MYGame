export function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

export function padLeft(str, length, char = '0') {
    str = String(str);
    while (str.length < length) {
        str = char + str;
    }
    return str;
}

export function padRight(str, length, char = ' ') {
    str = String(str);
    while (str.length < length) {
        str = str + char;
    }
    return str;
}

export function truncate(str, maxLength, suffix = '...') {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
}

export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}小时${minutes % 60}分钟`;
    }
    if (minutes > 0) {
        return `${minutes}分钟${seconds % 60}秒`;
    }
    return `${seconds}秒`;
}

export function formatDate(day) {
    const year = Math.floor(day / 365) + 1;
    const month = Math.floor((day % 365) / 30) + 1;
    const d = (day % 30) + 1;
    return `第${year}年${month}月${d}日`;
}
