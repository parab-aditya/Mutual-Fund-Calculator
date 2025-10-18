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
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  // Use a state machine to track the gesture: undetermined -> scrolling or sliding
  const gestureStateRef = React.useRef<'undetermined' | 'scrolling' | 'sliding'>('undetermined');


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
  
  const handleTouchStart = (e: React.TouchEvent<HTMLInputElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    gestureStateRef.current = 'undetermined'; // Reset on new touch
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLInputElement>) => {
    if (!touchStartRef.current || gestureStateRef.current === 'scrolling') {
      // If we've decided it's a scroll, do nothing and let the browser handle it.
      return;
    }
    
    // If we've decided it's a slide, prevent the page from scrolling.
    if (gestureStateRef.current === 'sliding') {
      e.preventDefault();
      return;
    }

    // If gesture is undetermined, we determine it here.
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const threshold = 5; // A small movement threshold before making a decision.

    // Only decide after a small movement.
    if (deltaX > threshold || deltaY > threshold) {
      if (deltaY > deltaX) {
        // More vertical movement means it's a scroll.
        gestureStateRef.current = 'scrolling';
      } else {
        // More horizontal movement means it's a slide.
        gestureStateRef.current = 'sliding';
        // From now on, prevent default on move to stop vertical page scrolling.
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    gestureStateRef.current = 'undetermined'; // Reset for the next gesture
  };
  
  // The slider's native onChange is now sufficient, as we prevent it from
  // triggering during a scroll by managing the browser's default behavior
  // in onTouchMove.
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const percentage = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const sliderStyle: React.CSSProperties = {
    background: `linear-gradient(to right, #10b981 ${percentage}%, #e5e7eb ${percentage}%)`,
    touchAction: 'pan-y',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-600">{label}</label>
        <div className="flex items-center rounded-lg bg-emerald-50 border border-emerald-200/60 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/40 transition-all duration-200 shadow-sm">
          <span className="pl-3 text-emerald-800 font-medium">{unit}</span>
          <input
            type="text"
            inputMode={step < 1 ? 'decimal' : 'numeric'}
            pattern={step < 1 ? "[0-9,.]*" : "[0-9,]*"}
            value={isCurrency ? formatIndianNumber(value) : String(value)}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="w-28 sm:w-32 p-2 text-right font-semibold text-slate-800 bg-transparent focus:outline-none"
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
          onChange={handleSliderChange}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={sliderStyle}
          className="w-full custom-slider"
        />
        {unit === '₹' ? (
          <p className="text-xs text-slate-500 text-right pt-2 min-h-4">
            {value > 0 ? numberToIndianWords(value) : <>&nbsp;</>}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default SliderInput;