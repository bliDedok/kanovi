export function getWaitTimeInfo(orderedAt: string, now: Date) {
  const orderTime = new Date(orderedAt).getTime();
  const diffMins = Math.floor((now.getTime() - orderTime) / 60000);

  return {
    diffMins,
    isOverdue: diffMins >= 15,
  };
}