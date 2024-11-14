import React, { useState } from 'react';

type DatePickerProps = {
  value: string;
  onChange: (date: string) => void;
  className?: string;
};

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, className }) => {
  const [selectedDate, setSelectedDate] = useState(value);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    setSelectedDate(target.value);
    onChange(target.value);
  };

  return (
    <input
      type="date"
      value={selectedDate}
      onChange={handleDateChange}
      className={className}
    />
  );
};

export default DatePicker; 