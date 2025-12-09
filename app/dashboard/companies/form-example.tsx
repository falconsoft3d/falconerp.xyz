'use client';

import { FormView, FormField } from '@/components/FormView';

export default function NewCompanyFormExample() {
  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Nombre de la Empresa',
      type: 'text',
      required: true,
      placeholder: 'Ej: Mi Empresa S.L.',
      gridColumn: 'full',
    },
    {
      name: 'nif',
      label: 'NIF/CIF',
      type: 'text',
      placeholder: 'B12345678',
      gridColumn: 'half',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'contacto@empresa.com',
      gridColumn: 'half',
    },
    {
      name: 'address',
      label: 'Dirección',
      type: 'text',
      placeholder: 'Calle Principal 123',
      gridColumn: 'full',
    },
    {
      name: 'city',
      label: 'Ciudad',
      type: 'text',
      placeholder: 'Madrid',
      gridColumn: 'third',
    },
    {
      name: 'postalCode',
      label: 'Código Postal',
      type: 'text',
      placeholder: '28001',
      gridColumn: 'third',
    },
    {
      name: 'country',
      label: 'País',
      type: 'text',
      placeholder: 'España',
      gridColumn: 'third',
    },
    {
      name: 'phone',
      label: 'Teléfono',
      type: 'tel',
      placeholder: '+34 123 456 789',
      gridColumn: 'half',
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Error al crear empresa');
    }
  };

  return (
    <FormView
      title="Nueva Empresa"
      description="Crea una nueva empresa para gestionar tu negocio"
      fields={fields}
      onSubmit={handleSubmit}
      backLink="/dashboard/companies"
      submitLabel="Crear Empresa"
    />
  );
}
