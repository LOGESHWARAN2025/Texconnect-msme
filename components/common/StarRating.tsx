import React from 'react';

interface StarRatingProps {
  rating: number; // 0-5
  totalRatings?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  totalRatings = 0, 
  size = 'md',
  showCount = true 
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="text-yellow-400">★</span>
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-400">⯨</span>
      );
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-slate-300">★</span>
      );
    }

    return stars;
  };

  if (rating === 0 && totalRatings === 0) {
    return (
      <span className={`${sizeClasses[size]} text-slate-400`}>
        No ratings yet
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${sizeClasses[size]}`}>
      <div className="flex">
        {renderStars()}
      </div>
      {showCount && (
        <span className="text-slate-600 text-sm">
          {rating.toFixed(1)} {totalRatings > 0 && `(${totalRatings})`}
        </span>
      )}
    </div>
  );
};

export default StarRating;
