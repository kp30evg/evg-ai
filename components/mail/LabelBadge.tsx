/**
 * LabelBadge Component
 * Displays auto-label badges with consistent styling
 */

import React from 'react';
import { motion } from 'framer-motion';
import { getLabel } from '@/lib/evermail/constants/labels';

interface LabelBadgeProps {
  labelId: string;
  onClick?: () => void;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export default function LabelBadge({ 
  labelId, 
  onClick, 
  showName = true,
  size = 'sm',
  style 
}: LabelBadgeProps) {
  const label = getLabel(labelId);
  
  if (!label) {
    return null;
  }
  
  const sizeStyles = {
    sm: {
      padding: '2px 6px',
      fontSize: '11px',
      borderRadius: '4px'
    },
    md: {
      padding: '4px 8px',
      fontSize: '12px',
      borderRadius: '6px'
    },
    lg: {
      padding: '6px 12px',
      fontSize: '14px',
      borderRadius: '8px'
    }
  };
  
  return (
    <motion.span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: label.bgColor,
        color: label.color,
        border: `1px solid ${label.borderColor}`,
        fontWeight: 500,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        ...sizeStyles[size],
        ...style
      }}
      whileHover={onClick ? { 
        scale: 1.05,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      transition={{ duration: 0.15 }}
    >
      {showName && label.name}
    </motion.span>
  );
}

interface LabelBadgeGroupProps {
  labelIds: string[];
  onLabelClick?: (labelId: string) => void;
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export function LabelBadgeGroup({
  labelIds,
  onLabelClick,
  maxVisible = 3,
  size = 'sm',
  style
}: LabelBadgeGroupProps) {
  if (!labelIds || labelIds.length === 0) {
    return null;
  }
  
  const visibleLabels = labelIds.slice(0, maxVisible);
  const hiddenCount = labelIds.length - maxVisible;
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      flexWrap: 'wrap',
      ...style
    }}>
      {visibleLabels.map(labelId => (
        <LabelBadge
          key={labelId}
          labelId={labelId}
          onClick={onLabelClick ? () => onLabelClick(labelId) : undefined}
          size={size}
        />
      ))}
      {hiddenCount > 0 && (
        <span style={{
          padding: size === 'sm' ? '2px 6px' : size === 'md' ? '4px 8px' : '6px 12px',
          fontSize: size === 'sm' ? '11px' : size === 'md' ? '12px' : '14px',
          color: '#6B7280',
          backgroundColor: '#F3F4F6',
          border: '1px solid #E5E7EB',
          borderRadius: size === 'sm' ? '4px' : size === 'md' ? '6px' : '8px',
          fontWeight: 500
        }}>
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}