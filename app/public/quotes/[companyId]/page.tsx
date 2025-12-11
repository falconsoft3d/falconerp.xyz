'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  tax: number;
  stock: number | null;
  image: string | null;
}

interface Company {
  id: string;
  name: string;
  logo: string | null;
  currency: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function PublicQuotePage() {
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchCompanyAndProducts();
  }, []);

  const fetchCompanyAndProducts = async () => {
    try {
      // Obtener información de la empresa
      const companyRes = await fetch(`/api/public/companies/${params.companyId}`);
      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompany(companyData);
      }

      // Obtener productos
      const productsRes = await fetch(`/api/public/products?companyId=${params.companyId}`);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const subtotal = item.product.price * item.quantity;
      const tax = subtotal * (item.product.tax / 100);
      return total + subtotal + tax;
    }, 0);
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      EUR: '€',
      USD: '$',
      GBP: '£',
      CHF: 'Fr',
      MXN: '$',
    };
    return symbols[currency] || currency;
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      alert('Por favor, agrega al menos un producto a la cesta');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: params.companyId,
          contact: contactData,
          items: cart.map(item => ({
            productId: item.product.id,
            description: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            tax: item.product.tax,
          })),
          currency: company?.currency || 'EUR',
        }),
      });

      if (res.ok) {
        const quote = await res.json();
        alert(`¡Cotización creada exitosamente! Número: ${quote.number}\n\nRecibirás una confirmación por email.`);
        // Limpiar formulario
        setCart([]);
        setContactData({ name: '', email: '', phone: '', address: '' });
        setShowCheckout(false);
      } else {
        const error = await res.json();
        alert(error.error || 'Error al crear la cotización');
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('Error al enviar la cotización');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Empresa no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {company.logo && (
                <img src={company.logo} alt={company.name} className="h-12 w-12 object-contain" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                <p className="text-sm text-gray-600">Solicita tu cotización</p>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowCheckout(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                🛒 Cesta ({cart.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Products Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Catálogo de Productos</h2>
          
          {products.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No hay productos disponibles en este momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id}>
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <div className="p-4">
                    <div className="text-sm text-gray-500 mb-1">{product.code}</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-2xl font-bold text-teal-600">
                          {product.price.toFixed(2)} {getCurrencySymbol(company.currency)}
                        </div>
                        <div className="text-xs text-gray-500">IVA {product.tax}%</div>
                      </div>
                      <Button onClick={() => addToCart(product)} size="sm">
                        Agregar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Tu Cesta</h2>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">La cesta está vacía</p>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex gap-4 border-b border-gray-200 pb-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                          <p className="text-sm text-gray-600">{item.product.code}</p>
                          <p className="text-sm font-semibold text-teal-600">
                            {item.product.price.toFixed(2)} {getCurrencySymbol(company.currency)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-teal-600">
                        {getCartTotal().toFixed(2)} {getCurrencySymbol(company.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Contact Form */}
                  <form onSubmit={handleSubmitQuote} className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Tus Datos de Contacto</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={contactData.name}
                        onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={contactData.email}
                        onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={contactData.phone}
                        onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección (Opcional)
                      </label>
                      <textarea
                        value={contactData.address}
                        onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowCheckout(false)}
                        className="flex-1"
                      >
                        Continuar Comprando
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="flex-1"
                      >
                        {submitting ? 'Enviando...' : 'Solicitar Cotización'}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
