

export const formatIndianCurrency = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) {
    return '₹ 0';
  }

  // Use Intl.NumberFormat for proper Indian numbering system formatting (lakhs, crores separators)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
};

export const formatIndianNumber = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN').format(Math.round(value));
};

export const formatAxisTick = (tickValue: number): string => {
  if (isNaN(tickValue)) return '0';
  
  const crore = 10000000;
  const lakh = 100000;
  const thousand = 1000;

  if (Math.abs(tickValue) >= crore) {
    const val = tickValue / crore;
    return `${parseFloat(val.toFixed(1))} Cr`;
  }
  if (Math.abs(tickValue) >= lakh) {
    const val = tickValue / lakh;
    return `${parseFloat(val.toFixed(1))} L`;
  }
  if (Math.abs(tickValue) >= thousand) {
    const val = tickValue / thousand;
    return `${parseFloat(val.toFixed(0))} K`;
  }
  return String(Math.round(tickValue));
};

/**
 * Returns a dynamic Tailwind CSS font size class based on the length of a string.
 * This is used to prevent large currency values from clipping their containers.
 * @param text The string to measure.
 * @returns A Tailwind CSS class string (e.g., 'text-4xl', 'text-3xl').
 */
export const getDynamicValueClass = (text: string): string => {
  const len = text.length;
  // Thresholds are chosen based on typical formatted currency string lengths.
  // Example: "₹1,00,00,000" is 12 chars. "₹10,00,00,000" is 13 chars.
  if (len > 16) {
    return 'text-2xl'; // For very large numbers like "₹1,00,00,00,000" (16 chars)
  }
  if (len > 13) {
    return 'text-3xl'; // For numbers like "₹10,00,00,000"
  }
  return 'text-4xl'; // Default for smaller numbers
};


const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const numToWords = (n: number): string => {
  if (n < 20) {
    return ones[n];
  }
  if (n < 100) {
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
  }
  if (n < 1000) {
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + numToWords(n % 100) : '');
  }
  return '';
};

export const numberToIndianWords = (value: number): string => {
  if (value === 0) return 'Zero';

  let num = Math.round(value);

  if (num >= 1000000000) return '100 Crore or more'; // Handle edge case

  let result = '';
  
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  if (crore > 0) {
    result += numToWords(crore) + ' Crore ';
  }
  
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  if (lakh > 0) {
    result += numToWords(lakh) + ' Lakh ';
  }
  
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  if (thousand > 0) {
    result += numToWords(thousand) + ' Thousand ';
  }
  
  if (num > 0) {
    result += numToWords(num);
  }
  
  return result.trim();
};