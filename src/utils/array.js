export function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

export function unique(array) {
    return [...new Set(array)];
}

export function groupBy(array, keyFn) {
    const groups = {};
    for (const item of array) {
        const key = keyFn(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
    }
    return groups;
}

export function sum(array, fn) {
    return array.reduce((acc, item) => acc + (fn ? fn(item) : item), 0);
}

export function average(array, fn) {
    if (array.length === 0) return 0;
    return sum(array, fn) / array.length;
}

export function min(array, fn) {
    if (array.length === 0) return undefined;
    return array.reduce((min, item) => {
        const val = fn ? fn(item) : item;
        return val < min.val ? { val, item } : min;
    }, { val: fn ? fn(array[0]) : array[0], item: array[0] }).item;
}

export function max(array, fn) {
    if (array.length === 0) return undefined;
    return array.reduce((max, item) => {
        const val = fn ? fn(item) : item;
        return val > max.val ? { val, item } : max;
    }, { val: fn ? fn(array[0]) : array[0], item: array[0] }).item;
}
