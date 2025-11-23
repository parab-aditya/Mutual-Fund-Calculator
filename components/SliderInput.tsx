import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatIndianCurrency, numberToIndianWords, formatIndianNumber } from '../utils/formatters';

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  markerValue?: number;
  markerLabel?: string;
}

const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  markerValue,
  markerLabel,
}) => {
  const isCurrency = unit === '₹';

  // --- START: Performance Optimization for Smooth Sliding ---
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  // Sync with parent state only when not actively dragging.
  // This allows the slider UI to be driven by a responsive local state during
  // a drag, while still reflecting the authoritative parent state at all other times.
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);
  // --- END: Performance Optimization ---

  // Refs for robust touch handling
  const sliderRef = useRef<HTMLInputElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const gestureStateRef = useRef<'undetermined' | 'scrolling' | 'sliding'>('undetermined');

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

  const snapToMarker = useCallback((val: number) => {
    if (markerValue !== undefined) {
      const range = max - min;
      const threshold = range * 0.03; // 3% snap threshold
      if (Math.abs(val - markerValue) <= threshold) {
        return markerValue;
      }
    }
    return val;
  }, [markerValue, max, min]);

  const updateValueFromTouch = useCallback((touchX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (touchX - rect.left) / rect.width));
    const rawValue = min + percent * (max - min);

    // Priority: Check snap on raw value first
    const snappedValue = snapToMarker(rawValue);

    let finalValue = snappedValue;

    // If not snapped (value returned as is), apply stepping
    if (snappedValue === rawValue) {
      finalValue = Math.round(rawValue / step) * step;
    }

    finalValue = Math.max(min, Math.min(max, finalValue));

    // Update local state immediately for smooth UI
    setLocalValue(finalValue);

    // Propagate change to parent for calculations, only if it's a new value
    if (finalValue !== value) {
      onChange(finalValue);
    }
  }, [min, max, step, value, onChange, snapToMarker]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLInputElement>) => {
    setIsDragging(true); // Start drag state
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    gestureStateRef.current = 'undetermined';
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLInputElement>) => {
    if (!touchStartRef.current) return;
    if (gestureStateRef.current === 'scrolling') {
      e.preventDefault();
      return;
    }
    const touch = e.touches[0];
    if (gestureStateRef.current === 'undetermined') {
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
      const threshold = 8;

      if (deltaX > threshold || deltaY > threshold) {
        if (deltaY > deltaX * 0.7) {
          gestureStateRef.current = 'scrolling';
          e.preventDefault();
          return;
        } else {
          gestureStateRef.current = 'sliding';
        }
      } else {
        e.preventDefault();
        return;
      }
    }

    e.preventDefault();
    updateValueFromTouch(touch.clientX);
  }, [updateValueFromTouch]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false); // End drag state
    touchStartRef.current = null;
    gestureStateRef.current = 'undetermined';
  }, []);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (touchStartRef.current !== null) {
      e.preventDefault();
      return;
    }
    let rawValue = Number(e.target.value);

    // Priority: Check snap on raw value first
    const snappedValue = snapToMarker(rawValue);

    let finalValue = snappedValue;

    // If not snapped, apply stepping
    if (snappedValue === rawValue) {
      finalValue = Math.round(rawValue / step) * step;
    }

    finalValue = Math.max(min, Math.min(max, finalValue));

    setLocalValue(finalValue); // Update local state
    onChange(finalValue); // And parent state
  }, [onChange, snapToMarker, step, min, max]);

  // Add mouse handlers to control isDragging state for desktop
  const handleMouseDown = useCallback(() => setIsDragging(true), []);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const percentage = max > min ? ((localValue - min) / (max - min)) * 100 : 0;
  const sliderStyle: React.CSSProperties = {
    background: `linear-gradient(to right, #10b981 ${percentage}%, #e5e7eb ${percentage}%)`,
  };

  const markerPercentage = markerValue !== undefined && markerValue >= min && markerValue <= max
    ? ((markerValue - min) / (max - min)) * 100
    : null;

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
      <div className="relative">
        <input
          ref={sliderRef}
          type="range"
          min={min}
          max={max}
          step="any"
          value={localValue} // Use localValue for rendering for immediate feedback
          onChange={handleSliderChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={sliderStyle}
          className="w-full custom-slider relative z-10"
        />
        {markerPercentage !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-6 -ml-2 z-0 group cursor-help flex items-center justify-center"
            style={{ left: `${markerPercentage}%` }}
          >
            <div className="w-1 h-3 bg-slate-400 rounded-full" />
            {markerLabel && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-600 whitespace-nowrap bg-white px-2 py-1 rounded shadow-md border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                {markerLabel}
              </div>
            )}
          </div>
        )}
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