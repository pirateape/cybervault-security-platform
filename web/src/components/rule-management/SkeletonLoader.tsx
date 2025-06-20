import React from 'react';

export interface SkeletonLoaderProps {
  className?: string;
}

/**
 * SkeletonLoader displays a loading skeleton.
 * @param className Additional class names
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
}) => (
  <div
    className={`animate-pulse bg-base-300 rounded ${className}`}
    aria-busy="true"
  />
);

export default SkeletonLoader;
