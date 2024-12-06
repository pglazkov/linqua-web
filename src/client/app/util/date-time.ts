export function getDateWithoutTime(date: Date) {
  const dateWithoutTime = new Date(date);
  dateWithoutTime.setHours(0, 0, 0, 0);

  return dateWithoutTime;
}
