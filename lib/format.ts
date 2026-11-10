const LIMA_TIME_ZONE = 'America/Lima';
const LIMA_OFFSET = '-05:00';

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: LIMA_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: LIMA_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const limaPartsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: LIMA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatCurrencyFromCents(cents: number | null | undefined): string {
  return currencyFormatter.format((cents ?? 0) / 100);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return 'Sin fecha';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }
  return dateTimeFormatter.format(date);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return 'Sin fecha';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }
  return dateFormatter.format(date);
}

export function formatContractNumber(value: number | null | undefined): string {
  if (!value) {
    return 'Sin número';
  }
  return `N° ${String(value).padStart(5, '0')}`;
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) {
    return 'Sin teléfono';
  }
  if (value.startsWith('+51') && value.length === 12) {
    return `+51 ${value.slice(3, 6)} ${value.slice(6, 9)} ${value.slice(9, 12)}`;
  }
  return value;
}

export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  const national =
    digits.startsWith('51') && digits.length >= 11 ? digits.slice(2) : digits;
  const limited = national.slice(0, 9);

  return [limited.slice(0, 3), limited.slice(3, 6), limited.slice(6, 9)]
    .filter(Boolean)
    .join(' ');
}

export function formatLimaInput(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const parts = limaPartsFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
}

export type LimaDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export function parseLimaInputParts(value: string): LimaDateTimeParts | null {
  const match = value
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})$/);
  if (!match || !parseLimaDateTimeInput(value)) {
    return null;
  }

  const [, year, month, day, hour, minute] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  };
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function limaInputFromParts(parts: LimaDateTimeParts): string {
  return `${String(parts.year).padStart(4, '0')}-${padDatePart(parts.month)}-${padDatePart(parts.day)} ${padDatePart(parts.hour)}:${padDatePart(parts.minute)}`;
}

export function limaPickerDate(value: string | null | undefined): Date {
  const parts = value ? parseLimaInputParts(value) : null;
  if (parts) {
    return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  }

  const current = parseLimaInputParts(formatLimaInput(new Date().toISOString()));
  return new Date(
    current?.year ?? new Date().getFullYear(),
    (current?.month ?? 1) - 1,
    current?.day ?? 1,
    18,
    0,
  );
}

export function applyLimaPickerDate(value: string, picked: Date): string {
  const current = limaPickerDate(value);
  return limaInputFromParts({
    year: picked.getFullYear(),
    month: picked.getMonth() + 1,
    day: picked.getDate(),
    hour: current.getHours(),
    minute: current.getMinutes(),
  });
}

export function applyLimaPickerTime(value: string, picked: Date): string {
  const current = limaPickerDate(value);
  return limaInputFromParts({
    year: current.getFullYear(),
    month: current.getMonth() + 1,
    day: current.getDate(),
    hour: picked.getHours(),
    minute: picked.getMinutes(),
  });
}

const monthShortLabels = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'set',
  'oct',
  'nov',
  'dic',
];

export function formatLimaDateInput(value: string): string {
  const parts = parseLimaInputParts(value);
  if (!parts) {
    return '';
  }
  return `${padDatePart(parts.day)} ${monthShortLabels[parts.month - 1]} ${parts.year}`;
}

export function formatLimaTimeInput(value: string): string {
  const parts = parseLimaInputParts(value);
  if (!parts) {
    return '';
  }
  return `${padDatePart(parts.hour)}:${padDatePart(parts.minute)}`;
}

export function parseLimaDateTimeInput(value: string): string | null {
  const match = value
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute] = match;
  if (!year || !month || !day || !hour || !minute) {
    return null;
  }

  const paddedHour = hour.padStart(2, '0');
  const date = new Date(
    `${year}-${month}-${day}T${paddedHour}:${minute}:00${LIMA_OFFSET}`,
  );
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (formatLimaInput(date.toISOString()) !== `${year}-${month}-${day} ${paddedHour}:${minute}`) {
    return null;
  }

  return date.toISOString();
}

export function centsToInput(cents: number | null | undefined): string {
  return ((cents ?? 0) / 100).toFixed(2);
}

export function parseSolesToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  let normalized = trimmed.replace(/[^\d.,-]/g, '');
  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.replace(/,/g, '');
  } else if (normalized.includes(',')) {
    const [, decimalPart] = normalized.split(',');
    normalized =
      decimalPart && decimalPart.length <= 2
        ? normalized.replace(',', '.')
        : normalized.replace(/,/g, '');
  }

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100);
}

export function normalizePhoneE164(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 9) {
    return `+51${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('51')) {
    return `+${digits}`;
  }
  return null;
}

export function safeSearchTerm(value: string): string {
  return value
    .trim()
    .replace(/[^0-9a-zA-ZáéíóúÁÉÍÓÚñÑüÜ+@.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 120);
}
