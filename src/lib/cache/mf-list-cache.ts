import type { ClassifiedScheme } from '@/lib/api/mfapi';

let _cache: ClassifiedScheme[] | null = null;
let _promise: Promise<ClassifiedScheme[]> | null = null;

export function fetchClassifiedSchemes(): Promise<ClassifiedScheme[]> {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;

  _promise = fetch('/api/mutual-funds/list')
    .then((res) => res.json())
    .then((data: ClassifiedScheme[]) => {
      _cache = data;
      return data;
    })
    .catch(() => {
      _promise = null;
      return [] as ClassifiedScheme[];
    });

  return _promise;
}
