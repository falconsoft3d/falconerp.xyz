'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import Link from 'next/link';

export interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  gridColumn?: 'full' | 'half' | 'third';
}

interface FormViewProps {
  title: string;
  description?: string;
  fields: FormField[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  backLink: string;
  submitLabel?: string;
  cancelLabel?: string;
}

export function FormView({
  title,
  description,
  fields,
  initialData = {},
  onSubmit,
  backLink,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
}: FormViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>(
    fields.reduce((acc, field) => {
      acc[field.name] = initialData[field.name] || '';
      return acc;
    }, {} as Record<string, any>)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit(formData);
      router.push(backLink);
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderField = (field: FormField) => {
    const commonProps = {
      name: field.name,
      value: formData[field.name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        handleChange(field.name, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value),
      required: field.required,
      placeholder: field.placeholder,
    };

    if (field.type === 'textarea') {
      return (
        <div key={field.name} className={getGridClass(field.gridColumn)}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            {...commonProps}
            rows={field.rows || 3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      );
    }

    if (field.type === 'select' && field.options) {
      return (
        <div key={field.name} className={getGridClass(field.gridColumn)}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            {...commonProps}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">Seleccionar...</option>
            {field.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={field.name} className={getGridClass(field.gridColumn)}>
        <Input
          label={field.label}
          type={field.type || 'text'}
          {...commonProps}
          min={field.min}
          max={field.max}
          step={field.step}
        />
      </div>
    );
  };

  const getGridClass = (gridColumn?: 'full' | 'half' | 'third') => {
    switch (gridColumn) {
      case 'full':
        return 'col-span-1 md:col-span-2 lg:col-span-3';
      case 'third':
        return 'col-span-1';
      case 'half':
      default:
        return 'col-span-1 md:col-span-1';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href={backLink}>
            <Button variant="secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
            {description && <p className="text-gray-600 mt-1">{description}</p>}
          </div>
        </div>
      </div>

      {/* Formulario */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map(field => renderField(field))}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <Link href={backLink} className="flex-1">
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                className="w-full"
              >
                {cancelLabel}
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
