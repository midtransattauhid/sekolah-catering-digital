
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon } from 'lucide-react';
import { id as idLocale } from 'date-fns/locale';
import { isWeekend } from 'date-fns';

interface OrderSchedule {
  date: string;
  is_blocked: boolean;
  cutoff_time: string;
  cutoff_date: string | null;
  max_orders: number | null;
  current_orders: number;
  notes: string | null;
}

interface DateCalendarProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  orderSchedules: OrderSchedule[];
  isDateDisabled: (date: Date) => boolean;
}

const DateCalendar = ({ selectedDate, onDateSelect, orderSchedules, isDateDisabled }: DateCalendarProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-orange-600" />
          Pilih Tanggal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          disabled={isDateDisabled}
          locale={idLocale}
          className="rounded-md border"
        />
        
        {/* Legend */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 bg-gray-400 rounded mr-2"></div>
            <span>Sabtu & Minggu (Tutup)</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 bg-red-200 rounded mr-2"></div>
            <span>Tanggal diblokir/penuh</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 bg-orange-200 rounded mr-2"></div>
            <span>Batas waktu terlewat</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 bg-green-200 rounded mr-2"></div>
            <span>Tersedia untuk dipesan</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateCalendar;
