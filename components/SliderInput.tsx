import React from 'react';
import { formatIndianCurrency, numberToIndianWords, formatIndianNumber } from '../utils/formatters';

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
}) => {
  const isCurrency = unit === '₹';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove commas before converting to number. Works for range input too (no-op).
    const rawValue = e.target.value.replace(/,/g, '');
    let numValue = Number(rawValue);

    if (!isNaN(numValue)) {
      if (numValue > max) {
        numValue = max;
      } else if (numValue < min) {
        numValue = min;
      }
      
      onChange(numValue);
    } else if (rawValue === '') {
      // Handle user clearing the field
      onChange(min);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-600">{label}</label>
        <div className="flex items-center rounded-md border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-200">
          <span className="pl-3 text-slate-500">{unit}</span>
          <input
            type={isCurrency ? 'text' : 'number'}
            value={isCurrency ? formatIndianNumber(value) : value}
            onChange={handleInputChange}
            className="w-28 sm:w-32 p-2 text-right font-semibold text-slate-800 bg-transparent focus:outline-none"
            min={min}
            max={max}
            step={isCurrency ? undefined : step}
          />
        </div>
      </div>
      <div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleInputChange}
          className="w-full h-2 bg-slate-200/80 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        {unit === '₹' && value > 0 && (
          <p className="text-xs text-slate-500 text-right pt-1 h-4">
            {numberToIndianWords(value)}
          </p>
        )}
      </div>
    </div>
  );
};

export default SliderInput;