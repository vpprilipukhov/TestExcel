/**
 * Преобразование денежной суммы в русскую пропись.
 *
 * Поддерживает числа вплоть до 100 000 000 000 (сто миллиардов).
 * Входное значение может быть числом или строкой. В строке допустимы
 * пробелы/неразрывные пробелы как разделители разрядов, а также запятая
 * или точка в качестве десятичного разделителя. Дробная часть всегда
 * интерпретируется как копейки (до двух знаков).
 *
 * Примеры:
 *   numberToRussianWords('1 324 324.20')
 *     => 'Один миллион триста двадцать четыре тысячи триста двадцать четыре рубля Двадцать копеек'
 *   numberToRussianWords(0)
 *     => 'Ноль рублей Ноль копеек'
 *   numberToRussianWords('10,05')
 *     => 'Десять рублей Пять копеек'
 */

type Gender = 'masculine' | 'feminine';

const UNITS_MASC: readonly string[] = [
  'ноль', 'один', 'два', 'три', 'четыре',
  'пять', 'шесть', 'семь', 'восемь', 'девять',
];

const UNITS_FEM: readonly string[] = [
  'ноль', 'одна', 'две', 'три', 'четыре',
  'пять', 'шесть', 'семь', 'восемь', 'девять',
];

const TEENS: readonly string[] = [
  'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать',
  'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать',
];

const TENS: readonly string[] = [
  '', '', 'двадцать', 'тридцать', 'сорок',
  'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто',
];

const HUNDREDS: readonly string[] = [
  '', 'сто', 'двести', 'триста', 'четыреста',
  'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот',
];

/** Формы существительного для выбора по количеству: [1, 2-4, 5+]. */
type PluralForms = readonly [string, string, string];

const RUBLES: PluralForms = ['рубль', 'рубля', 'рублей'];
const KOPECKS: PluralForms = ['копейка', 'копейки', 'копеек'];
const THOUSANDS: PluralForms = ['тысяча', 'тысячи', 'тысяч'];
const MILLIONS: PluralForms = ['миллион', 'миллиона', 'миллионов'];
const BILLIONS: PluralForms = ['миллиард', 'миллиарда', 'миллиардов'];

/**
 * Выбор правильной формы существительного по числу.
 */
function pluralize(n: number, forms: PluralForms): string {
  const abs = Math.abs(n) % 100;
  const lastTwo = abs;
  const lastDigit = abs % 10;
  if (lastTwo >= 11 && lastTwo <= 19) return forms[2];
  if (lastDigit === 1) return forms[0];
  if (lastDigit >= 2 && lastDigit <= 4) return forms[1];
  return forms[2];
}

/**
 * Прописывает число от 0 до 999 с учётом рода последнего разряда.
 */
function tripletToWords(n: number, gender: Gender): string {
  if (n < 0 || n > 999) {
    throw new Error(`tripletToWords expects 0..999, got ${n}`);
  }

  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rem = n % 100;
  const tens = Math.floor(rem / 10);
  const units = rem % 10;

  if (hundreds > 0) parts.push(HUNDREDS[hundreds]);

  if (rem >= 10 && rem <= 19) {
    parts.push(TEENS[rem - 10]);
  } else {
    if (tens >= 2) parts.push(TENS[tens]);
    if (units > 0) {
      const unitWords = gender === 'feminine' ? UNITS_FEM : UNITS_MASC;
      parts.push(unitWords[units]);
    }
  }

  return parts.join(' ');
}

/**
 * Преобразует «сырое» значение в неотрицательное число копеек.
 * Нормализует разделители и обрабатывает переполнение копеек (0.999 -> 100 коп).
 */
function toKopecks(value: number | string): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid number: ${value}`);
    }
    // Округляем до копеек, избегая накопления ошибок плавающей точки.
    return Math.round(Math.abs(value) * 100);
  }

  const cleaned = value
    .replace(/\u00A0/g, ' ')        // неразрывный пробел -> обычный
    .replace(/[\s_'`]/g, '')        // уберём любые разделители разрядов
    .replace(',', '.')              // десятичная запятая -> точка
    .trim();

  if (cleaned.length === 0) {
    throw new Error('Empty number string');
  }

  // Принимаем ведущий знак, но берём абсолютную величину.
  const match = /^[-+]?(\d+)(?:\.(\d+))?$/.exec(cleaned);
  if (!match) {
    throw new Error(`Cannot parse number: "${value}"`);
  }

  const intPart = match[1];
  const fracPartRaw = match[2] ?? '';
  // Берём ровно 2 знака после запятой, остальное отбрасываем
  // (по ТЗ всегда до 2 знаков — дополнительные знаки просто игнорируем).
  const fracPart = (fracPartRaw + '00').slice(0, 2);

  const rubles = BigInt(intPart);
  const kopecks = BigInt(fracPart);
  const totalKopecks = rubles * 100n + kopecks;

  // Проверяем верхнюю границу: до 100 миллиардов рублей включительно.
  const MAX_RUBLES = 100_000_000_000n;
  if (rubles > MAX_RUBLES) {
    throw new Error(
      `Amount exceeds supported maximum of 100 000 000 000 rubles: ${value}`,
    );
  }

  // Number безопасно вмещает 100 млрд * 100 = 1e13 (< 2^53).
  return Number(totalKopecks);
}

/**
 * Конвертирует целое неотрицательное число в русскую пропись
 * с учётом рода младшего разряда (для рублей — masculine, для копеек — feminine).
 */
function integerToWords(value: number, gender: Gender): string {
  if (value === 0) {
    return gender === 'feminine' ? UNITS_FEM[0] : UNITS_MASC[0];
  }

  // Разбиваем число на тройки: миллиарды, миллионы, тысячи, единицы.
  const billions = Math.floor(value / 1_000_000_000);
  const millions = Math.floor((value % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((value % 1_000_000) / 1_000);
  const units = value % 1_000;

  const parts: string[] = [];

  if (billions > 0) {
    parts.push(tripletToWords(billions, 'masculine'));
    parts.push(pluralize(billions, BILLIONS));
  }
  if (millions > 0) {
    parts.push(tripletToWords(millions, 'masculine'));
    parts.push(pluralize(millions, MILLIONS));
  }
  if (thousands > 0) {
    parts.push(tripletToWords(thousands, 'feminine'));
    parts.push(pluralize(thousands, THOUSANDS));
  }
  if (units > 0) {
    parts.push(tripletToWords(units, gender));
  }

  return parts.join(' ');
}

/**
 * Делает первую букву строки заглавной.
 */
function capitalize(s: string): string {
  if (s.length === 0) return s;
  return s[0].toUpperCase() + s.slice(1);
}

/**
 * Главная функция: превращает денежную сумму в полную русскую пропись.
 */
export function numberToRussianWords(value: number | string): string {
  const totalKopecks = toKopecks(value);
  const rubles = Math.floor(totalKopecks / 100);
  const kopecks = totalKopecks % 100;

  const rublesWords = capitalize(integerToWords(rubles, 'masculine'));
  const rublesNoun = pluralize(rubles, RUBLES);

  const kopecksWords = capitalize(integerToWords(kopecks, 'feminine'));
  const kopecksNoun = pluralize(kopecks, KOPECKS);

  return `${rublesWords} ${rublesNoun} ${kopecksWords} ${kopecksNoun}`;
}

export default numberToRussianWords;
