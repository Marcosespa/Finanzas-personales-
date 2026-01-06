import React from 'react';

const StatCard = ({ title, value, subtext, trend, icon, color = 'accent-primary' }) => {
    return (
        <div className="card h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-sm font-medium text-muted">{title}</p>
                    <h3 className="text-2xl font-bold mt-1">{value}</h3>
                </div>
                {icon && (
                    <div className={`p-2 rounded-lg bg-${color}/10 text-${color}`}>
                        {icon}
                    </div>
                )}
            </div>
            {(subtext || trend) && (
                <div className="flex items-center text-sm">
                    {trend && (
                        <span className={`font-medium ${trend > 0 ? 'text-success' : 'text-danger'} mr-2`}>
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                    )}
                    {subtext && <span className="text-muted">{subtext}</span>}
                </div>
            )}
        </div>
    );
};

export default StatCard;
