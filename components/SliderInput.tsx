
import React, { useRef, useCallback } from 'react';
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

  // Refs for robust touch handling
  const sliderRef = useRef<HTMLInputElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const gestureStateRef = useRef<'undetermined' | 'scrolling' | 'sliding'>('undetermined');
  const initialValueRef = useRef<number>(value);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    let numValue = Number(rawValue);

    if (!isNaN(numValue)) {
      if (numValue > max) numValue = max;
      onChange(numValue);
    } else if (rawValue === '') {
      onChange(0);
    }
  }, [max, onChange]);

  const handleBlur = useCallback(() => {
    if (value < min) {
      onChange(min);
    }
  }, [value, min, onChange]);

  const updateValueFromTouch = useCallback((touchX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (touchX - rect.left) / rect.width));
    const rawValue = min + percent * (max - min);
    
    // Snap to the nearest step for discrete sliders
    const steppedValue = Math.round(rawValue / step) * step;
    const finalValue = Math.max(min, Math.min(max, steppedValue));

    // Only call onChange if the value has actually changed
    if (finalValue !== value) {
      onChange(finalValue);
    }
  }, [min, max, step, value, onChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLInputElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    gestureStateRef.current = 'undetermined';
    initialValueRef.current = value;
  }, [value]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLInputElement>) => {
    if (!touchStartRef.current) return;

    // If we've already determined this is a scroll, we stop processing.
    if (gestureStateRef.current === 'scrolling') {
      e.preventDefault(); // Prevent slider from responding
      return;
    }

    const touch = e.touches[0];

    // On the first significant movement, determine the gesture's intent.
    if (gestureStateRef.current === 'undetermined') {
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
      // Increased threshold for more deliberate horizontal movement required
      const threshold = 8;

      if (deltaX > threshold || deltaY > threshold) {
        // Require significantly more horizontal movement to activate slider
        if (deltaY > deltaX * 0.7) {
          gestureStateRef.current = 'scrolling';
          e.preventDefault();
          return;
        } else {
          gestureStateRef.current = 'sliding';
        }
      } else {
        // Not enough movement to decide yet - prevent any changes
        e.preventDefault();
        return;
      }
    }
    
    // If we've reached here, the gesture is a slide.
    e.preventDefault(); // Prevent the browser from scrolling the page.
    updateValueFromTouch(touch.clientX);
  }, [updateValueFromTouch]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    gestureStateRef.current = 'undetermined';
  }, []);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Block native onChange during touch gestures entirely to prevent flicker
    // Touch gestures are handled by handleTouchMove
    if (touchStartRef.current !== null) {
      e.preventDefault();
      return;
    }
    // Only allow mouse/keyboard interactions when not in a touch gesture
    onChange(Number(e.target.value));
  }, [onChange]);

  const percentage = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const sliderStyle: React.CSSProperties = {
    background: `linear-gradient(to right, #10b981 ${percentage}%, #e5e7eb ${percentage}%)`,
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
            value={isCurrency ? formatIndianNumber(value) : (step < 1 ? value.toFixed(1) : String(value))}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="w-28 sm:w-32 p-2 text-right font-semibold text-slate-800 bg-transparent focus:outline-none"
          />
        </div>
      </div>
      <div>
        <input
          ref={sliderRef}
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
