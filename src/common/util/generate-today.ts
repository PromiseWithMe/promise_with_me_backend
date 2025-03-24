import { formatInTimeZone } from 'date-fns-tz';

export const generateToday = () => {
  const timeZone = 'Asia/Seoul';
  const formattedDate = formatInTimeZone(new Date(), timeZone, 'yyyy-MM-dd');
  return formattedDate;
};
