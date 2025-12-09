'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Product {
  id: string;
  code: string;
  name: string;
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
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantityInput, setQuantityInput] = useState('1');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

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
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    if (quantity > product.stock) {
      alert(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }

    const existingItemIndex = cart.findIndex(item => item.product.id === product.id);
    console.log('Índice existente:', existingItemIndex);

    if (existingItemIndex >= 0) {
      // Actualizar cantidad si ya existe
      const newCart = [...cart];
      const newQuantity = newCart[existingItemIndex].quantity + quantity;
      
      if (newQuantity > product.stock) {
        alert(`Stock insuficiente. Disponible: ${product.stock}`);
        return;
      }

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
    if (newQuantity > item.product.stock) {
      alert(`Stock insuficiente. Disponible: ${item.product.stock}`);
      return;
    }

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
      alert('Por favor selecciona un cliente');
      return;
    }

    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    setSaving(true);

    try {
      const { subtotal, taxAmount, total } = calculateTotals();

      const invoiceData = {
        type: 'SALE',
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
        // Limpiar carrito
        setCart([]);
        setSelectedContact('');
        alert('Factura creada exitosamente');
        router.push(`/dashboard/invoices/${invoice.id}`);
      } else {
        const errorData = await res.json();
        console.error('Error del servidor:', errorData);
        alert(`Error: ${errorData.error || 'Error al crear factura'}\n${errorData.details ? JSON.stringify(errorData.details) : ''}`);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error al crear factura: ' + (error instanceof Error ? error.message : 'Error desconocido'));
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Punto de Venta</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/invoices')}
          >
            Volver a Facturas
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Área de productos - 60% */}
        <div className="w-[60%] flex flex-col border-r border-gray-200 bg-white">
          {/* Búsqueda */}
          <div className="p-4 border-b border-gray-200">
            <Input
              type="text"
              placeholder="Buscar producto por nombre, código o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Grid de productos */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  type="button"
                  className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer ${
                    product.stock <= 0
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                      : 'bg-white border-gray-200 hover:border-emerald-500'
                  }`}
                >
                  <div className="text-left">
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
          {/* Selector de cliente */}
          <div className="p-4 bg-white border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente
            </label>
            <select
              value={selectedContact}
              onChange={(e) => setSelectedContact(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
            >
              <option value="">Seleccionar cliente...</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} {contact.nif ? `(${contact.nif})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Calculadora numérica */}
          <div className="p-4 bg-white border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad
            </label>
            <input
              type="text"
              value={quantityInput}
              readOnly
              className="w-full px-4 py-3 text-2xl text-center font-bold border-2 border-gray-300 rounded-lg bg-gray-50 mb-3 text-gray-900"
            />
            <div className="grid grid-cols-4 gap-2">
              {['7', '8', '9', '←'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleNumberPadClick(btn)}
                  className="py-3 text-lg font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors text-gray-900"
                >
                  {btn}
                </button>
              ))}
              {['4', '5', '6', 'C'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleNumberPadClick(btn)}
                  className="py-3 text-lg font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors text-gray-900"
                >
                  {btn}
                </button>
              ))}
              {['1', '2', '3', '.'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleNumberPadClick(btn)}
                  className="py-3 text-lg font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors text-gray-900"
                >
                  {btn}
                </button>
              ))}
              <button
                onClick={() => handleNumberPadClick('0')}
                className="col-span-4 py-3 text-lg font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors text-gray-900"
              >
                0
              </button>
            </div>
          </div>

          {/* Carrito */}
          <div className="flex-1 overflow-y-auto p-4 bg-white">
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
