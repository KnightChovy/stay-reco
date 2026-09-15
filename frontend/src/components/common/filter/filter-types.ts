import type { DateRange } from 'react-day-picker';

export type FilterOption = {
  label: string;
  value: string;
  count?: number;
};

type BaseFilter = {
  key: string;
  label: string;
  placeholder?: string;
};

export type FilterDefinition =
  | (BaseFilter & {
      type: 'select';
      options: FilterOption[];
      allLabel?: string;
    })
  | (BaseFilter & {
      type: 'multi-select';
      options: FilterOption[];
    })
  | (BaseFilter & {
      type: 'date-range';
    });

export type FilterValue = string | string[] | DateRange | undefined;
export type FilterValues = Record<string, FilterValue>;

export function isDateRange(value: FilterValue): value is DateRange {
  return Boolean(
    value &&
      !Array.isArray(value) &&
      typeof value === 'object' &&
      ('from' in value || 'to' in value),
  );
}
