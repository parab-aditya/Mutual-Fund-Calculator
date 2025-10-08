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
    // Remove commas before converting to number.
    const rawValue = e.target.value.replace(/,/g, '');
    let numValue = Number(rawValue);

    if (!isNaN(numValue)) {
      if (numValue > max) {
        numValue = max;
      }
      // We no longer clamp to min here to allow users to type values freely.
      // The min value will be enforced on blur.
      onChange(numValue);
    } else if (rawValue === '') {
      // Handle user clearing the field. Set to 0 to allow them to type a new value.
      onChange(0);
    }
  };
  
  const handleBlur = () => {
    // On blur, enforce the minimum value if the current value is below it.
    if (value < min) {
      onChange(min);
    }
  };
  
  const percentage = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const sliderStyle = {
    background: `linear-gradient(to right, #10b981 ${percentage}%, #e5e7eb ${percentage}%)`,
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-600">{label}</label>
        <div className="flex items-center rounded-lg bg-emerald-50 border border-emerald-200/60 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/40 transition-all duration-200 shadow-sm">
          <span className="pl-3 text-emerald-800 font-medium">{unit}</span>
          <input
            type={isCurrency ? 'text' : 'number'}
            value={isCurrency ? formatIndianNumber(value) : value}
            onChange={handleInputChange}
            onBlur={handleBlur}
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
          onChange={(e) => onChange(Number(e.target.value))}
          style={sliderStyle}
          className="w-full custom-slider"
        />
        {unit === '₹' && value > 0 && (
          <p className="text-xs text-slate-500 text-right pt-2 h-4">
            {numberToIndianWords(value)}
          </p>
        )}
      </div>
    </div>
  );
};

export default SliderInput;