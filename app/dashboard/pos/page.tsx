'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import toast, { Toaster } from 'react-hot-toast';

interface Product {
  id: string;
  code: string;
  name: string;
  image?: string;
  price: number;
  tax: number;
  stock: number;
  category?: string;
  unit?: string;
}

interface Contact {
  id: string;
  name: string;
  nif?: string;
  isCustomer: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  tax: number;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export default function POSPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantityInput, setQuantityInput] = useState('1');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = products;

    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  useEffect(() => {
    console.log('Carrito actualizado:', cart);
    console.log('Número de items:', cart.length);
  }, [cart]);

  const fetchData = async () => {
    try {
      // Obtener empresa activa
      const companiesRes = await fetch('/api/companies');
      if (companiesRes.ok) {
        const companies = await companiesRes.json();
        const activeCompany = companies.find((c: any) => c.active) || companies[0];
        if (activeCompany) {
          setCompanyId(activeCompany.id);

          // Obtener productos
          const productsRes = await fetch(`/api/products?companyId=${activeCompany.id}`);
          if (productsRes.ok) {
            const productsData = await productsRes.json();
            setProducts(productsData);
            setFilteredProducts(productsData);
            
            // Extraer categorías únicas
            const uniqueCategories = Array.from(
              new Set(
                productsData
                  .map((p: Product) => p.category)
                  .filter((c): c is string => !!c && c.trim() !== '')
              )
            ).sort() as string[];
            setCategories(uniqueCategories);
          }

          // Obtener clientes
          const contactsRes = await fetch(`/api/contacts?companyId=${activeCompany.id}`);
          if (contactsRes.ok) {
            const contactsData = await contactsRes.json();
            const customers = contactsData.filter((c: Contact) => c.isCustomer);
            setContacts(customers);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    console.log('Click en producto:', product.name);
    console.log('Cantidad input:', quantityInput);
    console.log('Stock disponible:', product.stock);
    
    const quantity = parseFloat(quantityInput) || 1;
    console.log('Cantidad parseada:', quantity);
    
    if (quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    const existingItemIndex = cart.findIndex(item => item.product.id === product.id);
    console.log('Índice existente:', existingItemIndex);

    if (existingItemIndex >= 0) {
      // Actualizar cantidad si ya existe
      const newCart = [...cart];
      const newQuantity = newCart[existingItemIndex].quantity + quantity;

      const subtotal = newQuantity * product.price;
      const taxAmount = subtotal * (product.tax / 100);
      const total = subtotal + taxAmount;

      newCart[existingItemIndex] = {
        ...newCart[existingItemIndex],
        quantity: newQuantity,
        subtotal,
        taxAmount,
        total,
      };

      console.log('Actualizando item existente:', newCart[existingItemIndex]);
      setCart(newCart);
    } else {
      // Agregar nuevo item
      const subtotal = quantity * product.price;
      const taxAmount = subtotal * (product.tax / 100);
      const total = subtotal + taxAmount;

      const newItem = {
        product,
        quantity,
        price: product.price,
        tax: product.tax,
        subtotal,
        taxAmount,
        total,
      };

      console.log('Agregando nuevo item:', newItem);
      setCart([...cart, newItem]);
    }

    setQuantityInput('1');
    console.log('Carrito después de agregar:', cart.length + 1);
  };

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }

    const item = cart[index];

    const subtotal = newQuantity * item.price;
    const taxAmount = subtotal * (item.tax / 100);
    const total = subtotal + taxAmount;

    const newCart = [...cart];
    newCart[index] = {
      ...item,
      quantity: newQuantity,
      subtotal,
      taxAmount,
      total,
    };

    setCart(newCart);
  };

  const handleNumberPadClick = (value: string) => {
    if (value === 'C') {
      setQuantityInput('1');
    } else if (value === '←') {
      setQuantityInput(prev => prev.length > 1 ? prev.slice(0, -1) : '1');
    } else if (value === '.') {
      if (!quantityInput.includes('.')) {
        setQuantityInput(prev => prev + '.');
      }
    } else {
      if (quantityInput === '1') {
        setQuantityInput(value);
      } else {
        setQuantityInput(prev => prev + value);
      }
    }
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = cart.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = cart.reduce((sum, item) => sum + item.total, 0);
    return { subtotal, taxAmount, total };
  };

  const handleCheckout = async () => {
    if (!selectedContact) {
      toast.error('Por favor selecciona un cliente');
      return;
    }

    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    setSaving(true);

    try {
      const { subtotal, taxAmount, total } = calculateTotals();

      const invoiceData = {
        type: 'invoice_out',
        companyId,
        contactId: selectedContact,
        date: new Date().toISOString(),
        currency: 'EUR',
        status: 'DRAFT',
        paymentStatus: 'UNPAID',
        notes: '',
        items: cart.map(item => ({
          productId: item.product.id,
          description: item.product.name,
          quantity: item.quantity,
          price: item.price,
          tax: item.tax,
        })),
      };

      console.log('Datos de factura a enviar:', invoiceData);

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });

      if (res.ok) {
        const invoice = await res.json();
        console.log('Factura creada:', invoice);
        // Limpiar carrito y preparar para nueva venta, manteniendo el cliente seleccionado
        setCart([]);
        setQuantityInput('1');
        toast.success('✓ Venta completada exitosamente', {
          duration: 3000,
          style: {
            background: '#10b981',
            color: '#fff',
          },
        });
      } else {
        const errorData = await res.json();
        console.error('Error del servidor:', errorData);
        toast.error(`Error: ${errorData.error || 'Error al crear factura'}`, {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Error al crear factura: ' + (error instanceof Error ? error.message : 'Error desconocido'), {
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <div className="flex-1 flex overflow-hidden">
        {/* Área de productos - 60% */}
        <div className="w-[60%] flex flex-col border-r border-gray-200 bg-white">
          {/* Búsqueda y Filtros */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <Input
              type="text"
              placeholder="Buscar producto por nombre, código o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-lg"
            />
            
            {/* Filtro de categorías */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === ''
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todas
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid de productos */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  type="button"
                  className="p-4 rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer bg-white border-gray-200 hover:border-emerald-500"
                >
                  <div className="text-left">
                    {/* Imagen del producto */}
                    {product.image ? (
                      <div className="mb-3 rounded-md overflow-hidden bg-gray-50">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    ) : (
                      <div className="mb-3 rounded-md bg-gray-100 flex items-center justify-center h-32">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mb-1">{product.code}</div>
                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    {product.category && (
                      <div className="text-xs text-gray-500 mb-2">{product.category}</div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-emerald-600">
                        €{product.price.toFixed(2)}
                      </span>
                      <span className={`text-xs ${product.stock <= 5 ? 'text-red-500' : 'text-gray-500'}`}>
                        Stock: {product.stock}
                      </span>
                    </div>
                    {product.tax > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        IVA {product.tax}%
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No se encontraron productos
              </div>
            )}
          </div>
        </div>

        {/* Área de carrito y checkout - 40% */}
        <div className="w-[40%] flex flex-col bg-gray-50">
          {/* Cliente y Cantidad en dos columnas */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <select
                  value={selectedContact}
                  onChange={(e) => setSelectedContact(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Seleccionar...</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                  min="0.01"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Carrito */}
          <div className="overflow-y-auto p-4 bg-white" style={{ maxHeight: '45vh' }}>
            <h2 className="text-lg font-bold text-gray-800 mb-3">
              Carrito ({cart.length})
            </h2>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                El carrito está vacío
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          €{item.price.toFixed(2)} × {item.quantity} {item.product.unit || 'ud'}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                          className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 text-gray-900"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateCartItemQuantity(index, parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-gray-900"
                          min="0"
                          step="0.01"
                        />
                        <button
                          onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                          className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 text-gray-900"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-800">
                          €{item.total.toFixed(2)}
                        </div>
                        {item.tax > 0 && (
                          <div className="text-xs text-gray-500">
                            IVA: €{item.taxAmount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales y checkout */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>€{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>IVA:</span>
                <span>€{totals.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-gray-800 pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>€{totals.total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={saving || cart.length === 0 || !selectedContact}
              className="w-full py-4 text-lg font-semibold"
            >
              {saving ? 'Procesando...' : 'Finalizar Venta'}
            </Button>

            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="w-full mt-2 py-2 text-red-600 hover:text-red-700 font-medium"
              >
                Vaciar Carrito
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
