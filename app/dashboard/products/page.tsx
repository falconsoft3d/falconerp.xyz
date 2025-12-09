'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/Button';

interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  tax: number;
  stock?: number;
  category?: string;
  unit: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Obtener empresa activa
      const companiesRes = await fetch('/api/companies');
      if (!companiesRes.ok) {
        console.error('Error fetching companies');
        setLoading(false);
        return;
      }
      
      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: any) => c.active);
      
      if (!activeCompany) {
        console.error('No active company');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/products?companyId=${activeCompany.id}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };



  const columns = [
    { 
      key: 'code', 
      label: 'Código',
      sortable: true,
      searchable: true
    },
    { 
      key: 'name', 
      label: 'Producto',
      sortable: true,
      searchable: true
    },
    { 
      key: 'description', 
      label: 'Descripción',
      searchable: true,
      render: (product: Product) => product.description || '-'
    },
    { 
      key: 'category', 
      label: 'Categoría',
      sortable: true,
      searchable: true,
      render: (product: Product) => product.category || '-'
    },
    { 
      key: 'price', 
      label: 'Precio',
      sortable: true,
      render: (product: Product) => `€${product.price.toFixed(2)}`
    },
    { 
      key: 'tax', 
      label: 'IVA',
      sortable: true,
      render: (product: Product) => `${product.tax}%`
    },
    { 
      key: 'stock', 
      label: 'Stock',
      sortable: true,
      render: (product: Product) => product.stock !== undefined ? product.stock : '-'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Productos</h2>
          <p className="text-gray-600 mt-1">Gestiona tu catálogo de productos</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Producto
          </Button>
        </Link>
      </div>

      <DataTable
        data={products}
        columns={columns}
        onEdit={(product) => router.push(`/dashboard/products/${product.id}`)}
        searchKeys={['code', 'name', 'description', 'category']}
        emptyMessage="No hay productos registrados"
      />
    </div>
  );
}
