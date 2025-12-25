import React from 'react';

// Define a type for the icon props to ensure type safety with cloneElement
interface IconProps {
  className?: string;
  [key: string]: any;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  leftIcon?: React.ReactElement<IconProps>;
}

const Input: React.FC<InputProps> = ({ label, id, error, containerClassName = '', className='', leftIcon, ...props }) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  
  const inputBaseClasses = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const inputErrorClasses = error ? 'border-red-500' : '';
  const inputIconPadding = leftIcon ? 'pl-10' : '';

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {React.isValidElement(leftIcon) && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {React.cloneElement(leftIcon as React.ReactElement<any>, { className: `${(leftIcon.props.className || 'h-5 w-5')} ${props.disabled ? 'text-gray-300' : 'text-gray-400'}`.trim() })}
          </div>
        )}
        <input
          id={inputId}
          className={`${inputBaseClasses} ${inputErrorClasses} ${inputIconPadding} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Input;