'use client';

import { useId, ReactNode } from 'react';

type FormFieldProps = {
  label: string;                 // texto do rótulo (use "srOnly" p/ esconder)
  name: string;                  // OBRIGATÓRIO
  id?: string;                   // opcional -> gera automático se faltar
  srOnlyLabel?: boolean;         // se true, usa sr-only no label
  hint?: string;                 // texto auxiliar
  error?: string;                // msg de erro
  children?: ReactNode;          // opcional p/ inputs custom
  required?: boolean;            // se o campo é obrigatório
  autoComplete?: string;         // autocomplete para acessibilidade
} & React.InputHTMLAttributes<HTMLInputElement>;

export function FormField({
  label, 
  name, 
  id, 
  srOnlyLabel = false, 
  hint, 
  error, 
  children, 
  required = false,
  autoComplete,
  ...inputProps
}: FormFieldProps) {
  const autoId = useId();
  const fieldId = id ?? `${name}-${autoId}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1">
      <label 
        htmlFor={fieldId} 
        className={srOnlyLabel ? 'sr-only' : 'block text-sm font-medium mb-1.5'}
        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {children ?? (
        <input
          id={fieldId}
          name={name}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          {...inputProps}
          className={`w-full px-3 py-2.5 border rounded-md shadow-sm focus:outline-none text-base sm:text-sm ${
            inputProps.className ?? ''
          }`}
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.07)',
            borderColor: error ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            transition: 'all 0.2s ease'
          }}
        />
      )}

      {hint && (
        <p id={hintId} className="text-xs text-gray-400 mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="text-xs text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

// Componente específico para Checkbox
type CheckboxFieldProps = {
  label: string;
  name: string;
  id?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange'>;

export function CheckboxField({ 
  label, 
  name, 
  id, 
  checked, 
  onChange, 
  required = false,
  ...props 
}: CheckboxFieldProps) {
  const autoId = useId();
  const fieldId = id ?? `${name}-${autoId}`;
  
  return (
    <div className="flex items-center gap-2">
      <input 
        id={fieldId} 
        name={name} 
        type="checkbox" 
        checked={checked}
        onChange={onChange}
        required={required}
        className="sr-only"
        {...props}
      />
      <span 
        className="relative inline-block w-10 h-5 rounded-full transition-colors duration-300 ease-in-out mr-3 cursor-pointer"
        style={{ 
          backgroundColor: checked ? '#7fdb3f' : 'rgba(255, 255, 255, 0.2)'
        }}
        onClick={() => onChange?.({ target: { checked: !checked } } as React.ChangeEvent<HTMLInputElement>)}
      >
        <span 
          className="absolute inset-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out"
          style={{ 
            transform: checked ? 'translateX(1.25rem)' : 'translateX(0)'
          }}
        />
      </span>
      <label 
        htmlFor={fieldId} 
        className="cursor-pointer"
        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
    </div>
  );
}

// Componente específico para Radio
type RadioFieldProps = {
  label: string;
  name: string;
  value: string;
  id?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange' | 'value'>;

export function RadioField({ 
  label, 
  name, 
  value,
  id, 
  checked, 
  onChange, 
  required = false,
  ...props 
}: RadioFieldProps) {
  const autoId = useId();
  const fieldId = id ?? `${name}-${value}-${autoId}`;
  
  return (
    <div className="flex items-center gap-2">
      <input 
        id={fieldId} 
        name={name} 
        type="radio" 
        value={value}
        checked={checked}
        onChange={onChange}
        required={required}
        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 focus:ring-emerald-500"
        {...props}
      />
      <label 
        htmlFor={fieldId} 
        className="cursor-pointer"
        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
    </div>
  );
}

// Componente específico para Textarea
type TextareaFieldProps = {
  label: string;
  name: string;
  id?: string;
  srOnlyLabel?: boolean;
  hint?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  rows?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'name' | 'value' | 'onChange'>;

export function TextareaField({
  label,
  name,
  id,
  srOnlyLabel = false,
  hint,
  error,
  required = false,
  autoComplete,
  rows = 3,
  value,
  onChange,
  ...props
}: TextareaFieldProps) {
  const autoId = useId();
  const fieldId = id ?? `${name}-${autoId}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1">
      <label 
        htmlFor={fieldId} 
        className={srOnlyLabel ? 'sr-only' : 'block text-sm font-medium mb-1.5'}
        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <textarea
        id={fieldId}
        name={name}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        rows={rows}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2.5 border rounded-md shadow-sm focus:outline-none text-base sm:text-sm resize-vertical"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.07)',
          borderColor: error ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          transition: 'all 0.2s ease'
        }}
        {...props}
      />

      {hint && (
        <p id={hintId} className="text-xs text-gray-400 mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="text-xs text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

