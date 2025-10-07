
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
  if (value >= 1000000000) return '100 Crore or more'; // Handle edge case

  let result = '';
  
  const crore = Math.floor(value / 10000000);
  value %= 10000000;
  if (crore > 0) {
    result += numToWords(crore) + ' Crore ';
  }
  
  const lakh = Math.floor(value / 100000);
  value %= 100000;
  if (lakh > 0) {
    result += numToWords(lakh) + ' Lakh ';
  }
  
  const thousand = Math.floor(value / 1000);
  value %= 1000;
  if (thousand > 0) {
    result += numToWords(thousand) + ' Thousand ';
  }
  
  if (value > 0) {
    result += numToWords(value);
  }
  
  return result.trim();
};
