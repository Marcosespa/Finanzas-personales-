export const formatCurrency = (amount, currencyCode = 'COP') => {
    const locale = currencyCode === 'COP' ? 'es-CO' : 'en-US';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0, // No decimals for cleaner look, especially COP
    }).format(amount);
};
