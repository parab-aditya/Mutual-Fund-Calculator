
import React from 'react';
import { formatIndianCurrency, numberToIndianWords } from '../utils/formatters';

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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = Number(e.target.value);
    if (!isNaN(numValue)) {
      if (numValue > max) {
        onChange(max);
      } else if (numValue < min) {
        onChange(min);
      } else {
        onChange(numValue);
      }
    }
  };

  const displayValue = unit === '₹' ? formatIndianCurrency(value) : value;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline">
        <label className="text-base font-medium text-slate-700">{label}</label>
        <div className="flex items-center bg-slate-100 rounded-md border border-slate-200">
          <span className="pl-3 text-slate-500">{unit}</span>
          <input
            type="number"
            value={value}
            onChange={handleInputChange}
            className="w-32 sm:w-36 p-2 text-right font-semibold text-slate-800 bg-transparent focus:outline-none"
            min={min}
            max={max}
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
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
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
