import { IDoctorAvailability } from './types.js';

export const isTimeWithinSlot = (time: string, slot: IDoctorAvailability): boolean => {
  const [hour, min] = time.split(':').map(Number);
  const [startHour, startMin] = slot.startTime.split(':').map(Number);
  const [endHour, endMin] = slot.endTime.split(':').map(Number);

  const check = hour * 60 + min;
  const start = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;

  return check >= start && check <= end;
};
