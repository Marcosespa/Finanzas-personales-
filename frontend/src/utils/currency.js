export const formatCurrency = (amount, currencyCode = 'COP') => {
    const locale = currencyCode === 'COP' ? 'es-CO' : 'en-US';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0, // No decimals for cleaner look, especially COP
    }).format(amount);
};

// Formatea un número con puntos para miles (COP y CZK)
export const formatNumberWithThousands = (value, currencyCode = 'COP') => {
    if (!value && value !== 0) return '';
    
    // Remover todos los puntos, comas y espacios
    const numericValue = String(value).replace(/[.,\s]/g, '');
    
    // Si está vacío, retornar vacío
    if (numericValue === '') return '';
    
    // Convertir a número
    const num = parseFloat(numericValue);
    if (isNaN(num)) return '';
    
    // Formatear manualmente con puntos para miles
    const parts = Math.floor(num).toString().split('');
    let formatted = '';
    for (let i = parts.length - 1, j = 0; i >= 0; i--, j++) {
        if (j > 0 && j % 3 === 0) {
            formatted = '.' + formatted;
        }
        formatted = parts[i] + formatted;
    }
    
    return formatted;
};

// Convierte un string formateado de vuelta a número
export const parseFormattedNumber = (formattedValue) => {
    if (!formattedValue) return '';
    // Remover puntos y espacios, mantener solo números y punto decimal
    const cleaned = String(formattedValue).replace(/\./g, '').replace(/\s/g, '');
    return cleaned === '' ? '' : cleaned;
};

// Handler para inputs que formatean mientras se escribe
export const handleFormattedInputChange = (value, currencyCode = 'COP', setValue) => {
    // Permitir solo números y punto decimal
    const cleaned = value.replace(/[^\d.]/g, '');
    
    // Si está vacío, establecer vacío
    if (cleaned === '' || cleaned === '.') {
        setValue('');
        return;
    }
    
    // Formatear con puntos para miles
    const formatted = formatNumberWithThousands(cleaned, currencyCode);
    setValue(formatted);
};
