export const formatCurrency = (amount: number, currency: string = 'NGN') => {
  if (currency === 'USDT') {
    // USDT formatting (e.g., ₮500.00)
    return `₮${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }
  
  // NGN formatting
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
    .format(amount).replace('.00', '');
};