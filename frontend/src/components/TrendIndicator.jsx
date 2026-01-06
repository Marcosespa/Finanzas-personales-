import React from 'react';

const TrendIndicator = ({ value, percentage, isPositive = true, label }) => {
    const arrow = isPositive ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
    ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
    );

    return (
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-accent-success' : 'text-accent-danger'}`}>
            {arrow}
            <span>{percentage.toFixed(1)}%</span>
            {label && <span className="text-muted ml-1">{label}</span>}
        </div>
    );
};

export default TrendIndicator;
