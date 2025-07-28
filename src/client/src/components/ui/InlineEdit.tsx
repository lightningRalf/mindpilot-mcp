import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  editClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  requireDoubleClick?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
}

export interface InlineEditRef {
  startEditing: () => void;
}

export const InlineEdit = forwardRef<InlineEditRef, InlineEditProps>(function InlineEdit({ 
  value, 
  onSave, 
  className = '', 
  editClassName = '',
  placeholder = 'Click to edit',
  disabled = false,
  requireDoubleClick = false,
  onEditingChange
}, ref) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const contentRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    startEditing: () => {
      if (!disabled) {
        setIsEditing(true);
      }
    }
  }));

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    onEditingChange?.(isEditing);
  }, [isEditing, onEditingChange]);

  useEffect(() => {
    if (isEditing && contentRef.current) {
      // Focus and select all text
      contentRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(contentRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== value) {
      onSave(trimmedValue);
    }
    setIsEditing(false);
  }, [editValue, value, onSave]);

  // Handle clicking outside to exit edit mode
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        handleSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, handleSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const handleInput = () => {
    if (contentRef.current) {
      setEditValue(contentRef.current.textContent || '');
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || isEditing) return;
    if (!requireDoubleClick) {
      e.stopPropagation();
      setIsEditing(true);
    }
    // If requireDoubleClick is true, let single clicks bubble through
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (disabled || isEditing) return;
    if (requireDoubleClick) {
      e.stopPropagation();
      setIsEditing(true);
    }
  };

  if (disabled && !value) {
    return <span className={className}>{placeholder}</span>;
  }

  // Remove truncate class when editing to show full text
  const displayClassName = isEditing 
    ? className.replace(/\btruncate\b/g, '').trim()
    : className;

  return (
    <div
      ref={contentRef}
      contentEditable={isEditing && !disabled}
      suppressContentEditableWarning
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      className={`${displayClassName} ${isEditing ? editClassName : ''} ${!disabled && !isEditing ? 'cursor-pointer' : ''} focus:outline-none`}
      role="textbox"
      aria-label={requireDoubleClick ? "Double-click to edit" : "Click to edit"}
      title={requireDoubleClick ? "Double-click to edit" : "Click to edit"}
    >
      {value || placeholder}
    </div>
  );
});