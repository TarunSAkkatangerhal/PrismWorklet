import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Professional Select/Dropdown Component
 * A clean, modern dropdown with consistent styling across the application
 */
const ProfessionalSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  label,
  required = false,
  disabled = false,
  error,
  className = "",
  name,
  id,
  lightModeOnly = false
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label 
          htmlFor={id || name}
          className={`block text-sm font-medium ${lightModeOnly ? 'text-gray-700' : 'text-gray-700 dark:text-gray-300'} mb-2`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`
            w-full px-4 py-2.5 pr-10
            ${lightModeOnly ? 'bg-white' : 'bg-white dark:bg-gray-800'}
            border ${error ? 'border-red-500' : lightModeOnly ? 'border-gray-300' : 'border-gray-300 dark:border-gray-600'}
            rounded-lg
            ${lightModeOnly ? 'text-gray-900' : 'text-gray-900 dark:text-gray-100'}
            text-sm
            appearance-none
            cursor-pointer
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${lightModeOnly ? 'hover:border-gray-400' : 'hover:border-gray-400 dark:hover:border-gray-500'}
            ${lightModeOnly ? 'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100' : 'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-900'}
            ${!value ? (lightModeOnly ? 'text-gray-400' : 'text-gray-400 dark:text-gray-500') : ''}
          `}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((option, index) => {
            const optionValue = option.value !== undefined ? option.value : option;
            const optionLabel = option.label !== undefined ? option.label : option;
            const isDisabled = option.disabled || false;
            
            return (
              <option
                key={index}
                value={optionValue}
                disabled={isDisabled}
                className={lightModeOnly ? 'text-gray-900 bg-white' : 'text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800'}
              >
                {optionLabel}
              </option>
            );
          })}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown 
            size={18} 
            className={`${lightModeOnly ? 'text-gray-400' : 'text-gray-400 dark:text-gray-500'} transition-transform ${disabled ? 'opacity-50' : ''}`}
          />
        </div>
      </div>
      
      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default ProfessionalSelect;
