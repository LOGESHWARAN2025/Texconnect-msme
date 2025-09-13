import React from 'react';

interface InventoryProgressBarProps {
  currentStock: number;
  initialStock: number;
  showNumbers?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const InventoryProgressBar: React.FC<InventoryProgressBarProps> = ({
  currentStock,
  initialStock,
  showNumbers = true,
  size = 'md',
  className = ''
}) => {
  // Calculate progress percentage
  const usedStock = initialStock - currentStock;
  const progressPercentage = initialStock > 0 ? (usedStock / initialStock) * 100 : 0;
  
  // Determine color based on stock level
  const getProgressColor = () => {
    if (progressPercentage >= 90) return 'bg-red-500';
    if (progressPercentage >= 70) return 'bg-yellow-500';
    if (progressPercentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      height: 'h-2',
      text: 'text-xs',
      padding: 'py-1'
    },
    md: {
      height: 'h-3',
      text: 'text-sm',
      padding: 'py-2'
    },
    lg: {
      height: 'h-4',
      text: 'text-base',
      padding: 'py-3'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={`w-full ${className}`}>
      {showNumbers && (
        <div className={`flex justify-between items-center ${config.padding}`}>
          <span className={`${config.text} font-medium text-slate-700`}>
            Stock: {currentStock.toLocaleString()}
          </span>
          <span className={`${config.text} text-slate-500`}>
            {progressPercentage.toFixed(1)}% used
          </span>
        </div>
      )}
      
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${config.height}`}>
        <div
          className={`${config.height} ${getProgressColor()} transition-all duration-300 ease-in-out rounded-full`}
          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
        />
      </div>
      
      {showNumbers && (
        <div className={`flex justify-between items-center mt-1 ${config.text} text-slate-500`}>
          <span>0</span>
          <span>{initialStock.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

export default InventoryProgressBar;
