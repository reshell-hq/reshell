/**
 * Fractional order keys for user-ordered placements (edge groups, pin strip, etc.).
 * Fractional indices for stable insert/reorder without renumbering the whole list.
 */

export type FractionalOrderKey = string;

const BASE_62_DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function midpoint(a: string, b: string | null, digits: string): string {
  const zero = digits[0];
  if (b !== null && a >= b) {
    throw new Error(`${a} >= ${b}`);
  }
  if (a.slice(-1) === zero || (b !== null && b.slice(-1) === zero)) {
    throw new Error("trailing zero");
  }
  if (b !== null) {
    let n = 0;
    while ((a[n] ?? zero) === b[n]) {
      n++;
    }
    if (n > 0) {
      return b.slice(0, n) + midpoint(a.slice(n), b.slice(n), digits);
    }
  }
  const digitA = a ? digits.indexOf(a[0]) : 0;
  const digitB = b !== null ? digits.indexOf(b[0]) : digits.length;
  if (digitB - digitA > 1) {
    const midDigit = Math.round(0.5 * (digitA + digitB));
    return digits[midDigit];
  }
  if (b !== null && b.length > 1) {
    return b.slice(0, 1);
  }
  return digits[digitA] + midpoint(a.slice(1), null, digits);
}

function validateInteger(int: string): void {
  if (int.length !== getIntegerLength(int[0])) {
    throw new Error(`invalid integer part of order key: ${int}`);
  }
}

function getIntegerLength(head: string): number {
  if (head >= "a" && head <= "z") {
    return head.charCodeAt(0) - "a".charCodeAt(0) + 2;
  }
  if (head >= "A" && head <= "Z") {
    return "Z".charCodeAt(0) - head.charCodeAt(0) + 2;
  }
  throw new Error(`invalid order key head: ${head}`);
}

function getIntegerPart(key: string): string {
  const integerPartLength = getIntegerLength(key[0]);
  if (integerPartLength > key.length) {
    throw new Error(`invalid order key: ${key}`);
  }
  return key.slice(0, integerPartLength);
}

function validateOrderKey(key: string, digits: string): void {
  if (key === "A" + digits[0].repeat(26)) {
    throw new Error(`invalid order key: ${key}`);
  }
  const integerPart = getIntegerPart(key);
  const fractional = key.slice(integerPart.length);
  if (fractional.slice(-1) === digits[0]) {
    throw new Error(`invalid order key: ${key}`);
  }
}

function incrementInteger(x: string, digits: string): string | null {
  validateInteger(x);
  const [head, ...digitChars] = x.split("");
  let carry = true;
  for (let i = digitChars.length - 1; carry && i >= 0; i--) {
    const d = digits.indexOf(digitChars[i]) + 1;
    if (d === digits.length) {
      digitChars[i] = digits[0];
    } else {
      digitChars[i] = digits[d];
      carry = false;
    }
  }
  if (carry) {
    if (head === "Z") {
      return "a" + digits[0];
    }
    if (head === "z") {
      return null;
    }
    const nextHead = String.fromCharCode(head.charCodeAt(0) + 1);
    if (nextHead > "a") {
      digitChars.push(digits[0]);
    } else {
      digitChars.pop();
    }
    return nextHead + digitChars.join("");
  }
  return head + digitChars.join("");
}

function decrementInteger(x: string, digits: string): string | null {
  validateInteger(x);
  const [head, ...digitChars] = x.split("");
  let borrow = true;
  for (let i = digitChars.length - 1; borrow && i >= 0; i--) {
    const d = digits.indexOf(digitChars[i]) - 1;
    if (d === -1) {
      digitChars[i] = digits.slice(-1);
    } else {
      digitChars[i] = digits[d];
      borrow = false;
    }
  }
  if (borrow) {
    if (head === "a") {
      return "Z" + digits.slice(-1);
    }
    if (head === "A") {
      return null;
    }
    const nextHead = String.fromCharCode(head.charCodeAt(0) - 1);
    if (nextHead < "Z") {
      digitChars.push(digits.slice(-1));
    } else {
      digitChars.pop();
    }
    return nextHead + digitChars.join("");
  }
  return head + digitChars.join("");
}

function generateKeyBetween(
  before: FractionalOrderKey | null,
  after: FractionalOrderKey | null,
  digits = BASE_62_DIGITS,
): FractionalOrderKey {
  if (before !== null) {
    validateOrderKey(before, digits);
  }
  if (after !== null) {
    validateOrderKey(after, digits);
  }
  if (before !== null && after !== null && before >= after) {
    throw new Error(`${before} >= ${after}`);
  }
  if (before === null) {
    if (after === null) {
      return "a" + digits[0];
    }
    const afterInteger = getIntegerPart(after);
    const afterFractional = after.slice(afterInteger.length);
    if (afterInteger === "A" + digits[0].repeat(26)) {
      return afterInteger + midpoint("", afterFractional, digits);
    }
    if (afterInteger < after) {
      return afterInteger;
    }
    const decremented = decrementInteger(afterInteger, digits);
    if (decremented === null) {
      throw new Error("cannot decrement any more");
    }
    return decremented;
  }
  if (after === null) {
    const beforeInteger = getIntegerPart(before);
    const beforeFractional = before.slice(beforeInteger.length);
    const incremented = incrementInteger(beforeInteger, digits);
    return incremented === null
      ? beforeInteger + midpoint(beforeFractional, null, digits)
      : incremented;
  }
  const beforeInteger = getIntegerPart(before);
  const beforeFractional = before.slice(beforeInteger.length);
  const afterInteger = getIntegerPart(after);
  const afterFractional = after.slice(afterInteger.length);
  if (beforeInteger === afterInteger) {
    return beforeInteger + midpoint(beforeFractional, afterFractional, digits);
  }
  const incremented = incrementInteger(beforeInteger, digits);
  if (incremented === null) {
    throw new Error("cannot increment any more");
  }
  if (incremented < after) {
    return incremented;
  }
  return beforeInteger + midpoint(beforeFractional, null, digits);
}

function generateNKeysBetween(
  before: FractionalOrderKey | null,
  after: FractionalOrderKey | null,
  count: number,
  digits = BASE_62_DIGITS,
): FractionalOrderKey[] {
  if (count === 0) {
    return [];
  }
  if (count === 1) {
    return [generateKeyBetween(before, after, digits)];
  }
  if (after === null) {
    let current = generateKeyBetween(before, after, digits);
    const keys = [current];
    for (let i = 0; i < count - 1; i++) {
      current = generateKeyBetween(current, after, digits);
      keys.push(current);
    }
    return keys;
  }
  if (before === null) {
    let current = generateKeyBetween(before, after, digits);
    const keys = [current];
    for (let i = 0; i < count - 1; i++) {
      current = generateKeyBetween(before, current, digits);
      keys.push(current);
    }
    keys.reverse();
    return keys;
  }
  const mid = Math.floor(count / 2);
  const middle = generateKeyBetween(before, after, digits);
  return [
    ...generateNKeysBetween(before, middle, mid, digits),
    middle,
    ...generateNKeysBetween(middle, after, count - mid - 1, digits),
  ];
}

/** First key when a user-ordered sequence is empty. */
export function initialKey(): FractionalOrderKey {
  return generateKeyBetween(null, null);
}

/** Assign a new key between two neighbors (`null` = unbounded end). */
export function insertBetween(
  before: FractionalOrderKey | null,
  after: FractionalOrderKey | null,
): FractionalOrderKey {
  return generateKeyBetween(before, after);
}

/** Lexicographic compare for fractional order keys. */
export function compareKeys(a: FractionalOrderKey, b: FractionalOrderKey): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** Sort items by fractional order key, preserving input order on ties. */
export function sortByKey<T>(items: readonly T[], getKey: (item: T) => FractionalOrderKey): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const byKey = compareKeys(getKey(a.item), getKey(b.item));
      return byKey !== 0 ? byKey : a.index - b.index;
    })
    .map(({ item }) => item);
}

/** Reassign evenly spaced keys when neighbors are too dense to insert between. */
export function rebalanceKeys(count: number): FractionalOrderKey[] {
  return generateNKeysBetween(null, null, count);
}
