export const parseMetricValue = (str: string): number => {
  const match = str.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
};
