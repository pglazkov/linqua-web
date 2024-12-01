export function createSortComparer<T, R>(
  propertyGetter: (o: T) => R,
  direction: 'asc' | 'desc' = 'asc',
): (a: T, b: T) => number {
  return (a, b) =>
    propertyGetter(a) > propertyGetter(b)
      ? direction === 'asc'
        ? 1
        : -1
      : propertyGetter(a) < propertyGetter(b)
        ? direction === 'asc'
          ? -1
          : 1
        : 0;
}
