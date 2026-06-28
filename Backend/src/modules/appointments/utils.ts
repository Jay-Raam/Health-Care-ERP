export const formatAppointmentTime = (date: Date, startTime: string): string => {
  const dateString = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return `${dateString} at ${startTime}`;
};
