
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
}

export function DateTimePicker({ value, onChange, minDate }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value || undefined);
  const [selectedHour, setSelectedHour] = useState<string>(value ? format(value, "HH") : "12");
  const [selectedMinute, setSelectedMinute] = useState<string>(value ? format(value, "mm") : "00");

  // Generate hour and minute options
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    updateDateTime(date);
  };

  const handleHourChange = (hour: string) => {
    setSelectedHour(hour);
    updateDateTime(selectedDate, hour);
  };

  const handleMinuteChange = (minute: string) => {
    setSelectedMinute(minute);
    updateDateTime(selectedDate, selectedHour, minute);
  };

  const updateDateTime = (
    date: Date | undefined, 
    hour: string = selectedHour, 
    minute: string = selectedMinute
  ) => {
    if (!date) {
      onChange(null);
      return;
    }

    const newDate = new Date(date);
    newDate.setHours(parseInt(hour, 10));
    newDate.setMinutes(parseInt(minute, 10));
    newDate.setSeconds(0);
    onChange(newDate);
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    setSelectedHour("12");
    setSelectedMinute("00");
    onChange(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              initialFocus
              disabled={minDate ? { before: minDate } : undefined}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex gap-2">
        <Select value={selectedHour} onValueChange={handleHourChange}>
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent>
            {hours.map((hour) => (
              <SelectItem key={hour} value={hour}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedMinute} onValueChange={handleMinuteChange}>
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="Minute" />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((minute) => (
              <SelectItem key={minute} value={minute}>
                {minute}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button variant="ghost" onClick={handleClear} className="self-start">
        Clear
      </Button>
    </div>
  );
}
