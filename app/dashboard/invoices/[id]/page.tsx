'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface Contact {
  id: string;
  name: string;
  nif?: string;
  email?: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  tax: number;
}

interface InvoiceItem {
  productId?: string;
  description: string;
  quantity: number;
  price: number;
  tax: number;
  subtotal: number;
  taxAmount: number;
  total: number;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string | null;
  currency: string;
  status: string;
  paymentStatus: string;
  notes: string | null;
  contactId: string;
  company?: {
    name: string;
    nif?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  contact?: {
    name: string;
    nif?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    id: string;
    productId: string | null;
    description: string;
    quantity: number;
    price: number;
    tax: number;
  }>;
}

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [clients, setClients] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  const getDefaultDueDate = () => {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    number: '',
    contactId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: getDefaultDueDate(),
    currency: 'EUR',
    status: 'DRAFT' as 'DRAFT' | 'VALIDATED',
    paymentStatus: 'UNPAID' as 'UNPAID' | 'PAID',
    notes: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      productId: '',
      description: '',
      quantity: 1,
      price: 0,
      tax: 21,
      subtotal: 0,
      taxAmount: 0,
      total: 0,
    },
  ]);

  // Estados para adjuntos y comentarios
  const [attachments, setAttachments] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialize = async () => {
      await fetchActiveCompany();
    };
    initialize();
  }, []);

  useEffect(() => {
    if (activeCompany && invoiceId) {
      Promise.all([
        fetchClients(activeCompany.id),
        fetchProducts(activeCompany.id),
        fetchInvoice(),
        fetchAttachments(),
        fetchComments(),
      ]);
    }
  }, [activeCompany, invoiceId]);

  // Scroll al final de los comentarios cuando cambien
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const fetchActiveCompany = async () => {
    try {
      const res = await fetch('/api/companies?active=true');
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setActiveCompany(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching active company:', error);
    }
  };

  const fetchClients = async (companyId: string) => {
    try {
      const res = await fetch(`/api/contacts?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProducts = async (companyId: string) => {
    try {
      const res = await fetch(`/api/products?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (res.ok) {
        const data: Invoice = await res.json();
        setInvoice(data);

        // Pre-poblar el formulario
        setFormData({
          number: data.number,
          contactId: data.contactId,
          date: new Date(data.date).toISOString().split('T')[0],
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '',
          currency: data.currency,
          status: data.status as 'DRAFT' | 'VALIDATED',
          paymentStatus: data.paymentStatus as 'UNPAID' | 'PAID',
          notes: data.notes || '',
        });

        // Pre-poblar los items
        if (data.items && data.items.length > 0) {
          const loadedItems = data.items.map(item => {
            const quantity = item.quantity;
            const price = item.price;
            const tax = item.tax;
            const subtotal = quantity * price;
            const taxAmount = subtotal * (tax / 100);
            const total = subtotal + taxAmount;

            return {
              productId: item.productId || '',
              description: item.description,
              quantity,
              price,
              tax,
              subtotal,
              taxAmount,
              total,
            };
          });
          setItems(loadedItems);
        }
      } else {
        setError('No se pudo cargar la factura');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError('Error al cargar la factura');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async () => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/comments`);
      if (res.ok) {
        const data = await res.json();
        console.log('Comentarios cargados:', data);
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/invoices/${invoiceId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchAttachments();
        e.target.value = '';
      } else {
        const data = await res.json();
        alert(data.error || 'Error al subir archivo');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('¿Estás seguro de eliminar este adjunto?')) return;

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/attachments?attachmentId=${attachmentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchAttachments();
      } else {
        alert('Error al eliminar adjunto');
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Error al eliminar adjunto');
    }
  };

  const handleAddComment = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment }),
      });

      if (res.ok) {
        const newCommentData = await res.json();
        console.log('Comentario creado:', newCommentData);
        setNewComment('');
        await fetchComments();
      } else {
        const errorData = await res.json();
        console.error('Error al agregar comentario:', errorData);
        alert('Error al agregar comentario');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error al agregar comentario');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('¿Estás seguro de eliminar este comentario?')) return;

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchComments();
      } else {
        alert('Error al eliminar comentario');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Error al eliminar comentario');
    }
  };

  const calculateItemTotals = (item: Partial<InvoiceItem>): InvoiceItem => {
    const quantity = item.quantity || 0;
    const price = item.price || 0;
    const tax = item.tax || 0;
    const subtotal = quantity * price;
    const taxAmount = subtotal * (tax / 100);
    const total = subtotal + taxAmount;

    return {
      productId: item.productId,
      description: item.description || '',
      quantity,
      price,
      tax,
      subtotal,
      taxAmount,
      total,
    };
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    // Si se selecciona un producto, rellenar datos
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].description = product.name;
        newItems[index].price = product.price;
        newItems[index].tax = product.tax;
      }
    }

    // Recalcular totales
    newItems[index] = calculateItemTotals(newItems[index]);
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        description: '',
        quantity: 1,
        price: 0,
        tax: 21,
        subtotal: 0,
        taxAmount: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const getTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = items.reduce((sum, item) => sum + item.total, 0);
    return { subtotal, taxAmount, total };
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      EUR: '€',
      USD: '$',
      GBP: '£',
      CHF: 'Fr',
      JPY: '¥',
      CNY: '¥',
      MXN: '$',
      ARS: '$',
      COP: '$',
      CLP: '$',
    };
    return symbols[currency] || currency;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Validaciones
    if (!formData.contactId) {
      setError('Debes seleccionar un cliente');
      setSaving(false);
      return;
    }

    if (items.length === 0 || items.every(item => !item.description)) {
      setError('Debes agregar al menos un item');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: formData.number,
          contactId: formData.contactId,
          date: formData.date,
          dueDate: formData.dueDate || null,
          currency: formData.currency,
          status: formData.status,
          paymentStatus: formData.paymentStatus,
          notes: formData.notes,
          items: items.map(item => ({
            productId: item.productId || undefined,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            tax: item.tax,
          })),
        }),
      });

      if (res.ok) {
        router.push('/dashboard/invoices');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al actualizar factura');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      setError('Error al actualizar factura');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando factura...</p>
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          No tienes una empresa activa. Por favor, crea o activa una empresa primero.
        </p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">No se pudo cargar la factura.</p>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  const totals = getTotals();
  const isValidated = formData.status === 'VALIDATED';

  const handlePrint = async () => {
    try {
      // Importar dinámicamente las librerías
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Obtener los datos de la factura completa
      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (!response.ok) {
        throw new Error('Error al cargar datos de la factura');
      }
      const invoiceData = await response.json();

      // Crear un contenedor temporal fuera de la vista
      const printContainer = document.createElement('div');
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '0';
      printContainer.style.width = '210mm'; // A4 width
      printContainer.style.background = 'white';
      printContainer.style.padding = '20mm';
      document.body.appendChild(printContainer);

      // Generar el contenido HTML de la factura
      const getCurrencySymbol = (currency: string) => {
        switch (currency) {
          case 'EUR': return '€';
          case 'USD': return '$';
          case 'GBP': return '£';
          default: return currency;
        }
      };

      printContainer.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; border-bottom: 3px solid #0f766e; padding-bottom: 20px;">
            <div style="flex: 1;">
              ${invoiceData.company?.logo ? `<img src="${invoiceData.company.logo}" alt="Logo" style="max-width: 120px; height: auto; margin-bottom: 10px;">` : ''}
              <div style="font-size: 24px; font-weight: bold; color: #0f766e; margin-bottom: 5px;">${invoiceData.company?.name || 'N/A'}</div>
              ${invoiceData.company?.nif ? `<div style="font-size: 12px; color: #666;">NIF: ${invoiceData.company.nif}</div>` : ''}
            </div>
            <div style="text-align: right;">
              <div style="font-size: 32px; font-weight: bold; color: #0f766e; margin-bottom: 10px;">FACTURA</div>
              <div style="font-size: 18px; color: #333;">#${invoiceData.number}</div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div style="flex: 1;">
              <div style="font-size: 11px; color: #666; margin-bottom: 5px;">DATOS DE LA EMPRESA</div>
              ${invoiceData.company?.address ? `<div style="font-size: 12px;">${invoiceData.company.address}</div>` : ''}
              <div style="font-size: 12px;">${invoiceData.company?.city || ''} ${invoiceData.company?.postalCode || ''}</div>
              ${invoiceData.company?.country ? `<div style="font-size: 12px;">${invoiceData.company.country}</div>` : ''}
              ${invoiceData.company?.phone ? `<div style="font-size: 12px; margin-top: 5px;">Tel: ${invoiceData.company.phone}</div>` : ''}
              ${invoiceData.company?.email ? `<div style="font-size: 12px;">Email: ${invoiceData.company.email}</div>` : ''}
            </div>
            <div style="flex: 1; text-align: right;">
              <div style="font-size: 11px; color: #666; margin-bottom: 5px;">INFORMACIÓN DE FACTURA</div>
              <div style="font-size: 12px; margin-bottom: 3px;"><strong>Fecha Emisión:</strong> ${new Date(invoiceData.date).toLocaleDateString('es-ES')}</div>
              ${invoiceData.dueDate ? `<div style="font-size: 12px; margin-bottom: 3px;"><strong>Fecha Vencimiento:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString('es-ES')}</div>` : ''}
              <div style="font-size: 12px; margin-bottom: 3px;"><strong>Estado:</strong> ${invoiceData.status === 'VALIDATED' ? 'Validada' : 'Borrador'}</div>
              <div style="font-size: 12px;"><strong>Pago:</strong> ${invoiceData.paymentStatus === 'PAID' ? 'Pagada' : 'Pendiente'}</div>
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
            <div style="font-size: 11px; color: #666; margin-bottom: 8px; font-weight: bold;">CLIENTE</div>
            <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">${invoiceData.contact?.name || 'N/A'}</div>
            ${invoiceData.contact?.nif ? `<div style="font-size: 12px; color: #666; margin-bottom: 3px;">NIF: ${invoiceData.contact.nif}</div>` : ''}
            ${invoiceData.contact?.address ? `<div style="font-size: 12px;">${invoiceData.contact.address}</div>` : ''}
            <div style="font-size: 12px;">${invoiceData.contact?.city || ''} ${invoiceData.contact?.postalCode || ''}</div>
            ${invoiceData.contact?.country ? `<div style="font-size: 12px;">${invoiceData.contact.country}</div>` : ''}
            ${invoiceData.contact?.phone ? `<div style="font-size: 12px; margin-top: 5px;">Tel: ${invoiceData.contact.phone}</div>` : ''}
            ${invoiceData.contact?.email ? `<div style="font-size: 12px;">Email: ${invoiceData.contact.email}</div>` : ''}
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #0f766e; color: white;">
                <th style="padding: 12px; text-align: left; font-size: 12px; border: 1px solid #0f766e;">DESCRIPCIÓN</th>
                <th style="padding: 12px; text-align: center; font-size: 12px; width: 80px; border: 1px solid #0f766e;">CANT.</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; width: 100px; border: 1px solid #0f766e;">P. UNIT.</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; width: 80px; border: 1px solid #0f766e;">IVA %</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; width: 120px; border: 1px solid #0f766e;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items.map((item: any, index: number) => `
                <tr style="${index % 2 === 0 ? 'background: #f8f9fa;' : 'background: white;'}">
                  <td style="padding: 10px; border: 1px solid #e5e7eb; font-size: 12px;">${item.description}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb; font-size: 12px;">${item.quantity}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-size: 12px;">${item.price.toFixed(2)} ${getCurrencySymbol(invoiceData.currency)}</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-size: 12px;">${item.tax}%</td>
                  <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb; font-size: 12px; font-weight: bold;">${(item.quantity * item.price * (1 + item.tax / 100)).toFixed(2)} ${getCurrencySymbol(invoiceData.currency)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
            <div style="width: 350px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 15px; border-bottom: 1px solid #e5e7eb;">
                <span style="font-size: 13px;">Subtotal:</span>
                <span style="font-size: 13px; font-weight: 600;">${invoiceData.subtotal.toFixed(2)} ${getCurrencySymbol(invoiceData.currency)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 15px; border-bottom: 1px solid #e5e7eb;">
                <span style="font-size: 13px;">IVA:</span>
                <span style="font-size: 13px; font-weight: 600;">${invoiceData.taxAmount.toFixed(2)} ${getCurrencySymbol(invoiceData.currency)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 12px 15px; background: #0f766e; color: white; border-radius: 8px; margin-top: 5px;">
                <span style="font-size: 16px; font-weight: bold;">TOTAL:</span>
                <span style="font-size: 18px; font-weight: bold;">${invoiceData.total.toFixed(2)} ${getCurrencySymbol(invoiceData.currency)}</span>
              </div>
            </div>
          </div>

          ${invoiceData.notes ? `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #0f766e;">
              <div style="font-size: 11px; color: #666; margin-bottom: 8px; font-weight: bold;">OBSERVACIONES</div>
              <div style="font-size: 12px; white-space: pre-wrap;">${invoiceData.notes}</div>
            </div>
          ` : ''}
        </div>
      `;

      // Generar el canvas
      const canvas = await html2canvas(printContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Eliminar el contenedor temporal
      document.body.removeChild(printContainer);

      // Crear el PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Descargar el PDF
      pdf.save(`factura-${invoiceData.number}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/dashboard/invoices');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al eliminar factura');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      setError('Error al eliminar factura');
    }
  };

  const handleDuplicate = async () => {
    if (!confirm('¿Deseas duplicar esta factura? Se creará una nueva factura borrador con los mismos datos.')) {
      return;
    }

    try {
      setSaving(true);
      // Crear nueva factura con los datos actuales
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: activeCompany.id,
          contactId: formData.contactId,
          date: new Date().toISOString().split('T')[0],
          dueDate: getDefaultDueDate(),
          currency: formData.currency,
          status: 'DRAFT',
          paymentStatus: 'UNPAID',
          notes: formData.notes,
          items: items.map(item => ({
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            tax: item.tax,
          })),
        }),
      });

      if (res.ok) {
        const newInvoice = await res.json();
        router.push(`/dashboard/invoices/${newInvoice.id}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al duplicar factura');
      }
    } catch (error) {
      console.error('Error duplicating invoice:', error);
      setError('Error al duplicar factura');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-start no-print">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Editar Factura</h2>
          <p className="text-gray-600 mt-1">Factura #{invoice.number}</p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/invoices/new')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear Nuevo
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDuplicate}
            disabled={saving}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Duplicar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </Button>
        </div>
      </div>

      {isValidated && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4 no-print">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-orange-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-orange-800 font-medium">
                Esta factura está validada
              </p>
              <p className="text-orange-700 text-sm mt-1">
                Para modificar los datos, debes cambiarla primero a estado &quot;Borrador&quot; en el campo Estado de Validación.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 no-print">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Información General</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-2">
                Número de Factura *
              </label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                required
                disabled={isValidated}
                placeholder="Ej: FAC-2025-001"
              />
            </div>

            <div>
              <label htmlFor="contactId" className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                id="contactId"
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                required
                disabled={isValidated}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Selecciona un cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.nif && `- ${client.nif}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Moneda
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                disabled={isValidated}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="EUR">EUR (€) - Euro</option>
                <option value="USD">USD ($) - Dólar estadounidense</option>
                <option value="GBP">GBP (£) - Libra esterlina</option>
                <option value="CHF">CHF (Fr) - Franco suizo</option>
                <option value="JPY">JPY (¥) - Yen japonés</option>
                <option value="CNY">CNY (¥) - Yuan chino</option>
                <option value="MXN">MXN ($) - Peso mexicano</option>
                <option value="ARS">ARS ($) - Peso argentino</option>
                <option value="COP">COP ($) - Peso colombiano</option>
                <option value="CLP">CLP ($) - Peso chileno</option>
              </select>
            </div>

            <Input
              label="Fecha de Emisión"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              disabled={isValidated}
            />

            <Input
              label="Fecha de Vencimiento"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              disabled={isValidated}
            />

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Validación
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="DRAFT">Borrador</option>
                <option value="VALIDATED">Validada</option>
              </select>
            </div>

            <div>
              <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Pago
              </label>
              <select
                id="paymentStatus"
                value={formData.paymentStatus || 'UNPAID'}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="UNPAID">Sin pagar</option>
                <option value="PAID">Pagada</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Líneas de Factura</h3>
            <Button 
              type="button" 
              variant="outline" 
              onClick={addItem}
              disabled={isValidated}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Línea
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Producto
                    </label>
                    <select
                      value={item.productId || ''}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      disabled={isValidated}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Seleccionar...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.code} - {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                      disabled={isValidated}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cant.
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      required
                      disabled={isValidated}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio
                    </label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      required
                      disabled={isValidated}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IVA%
                    </label>
                    <input
                      type="number"
                      value={item.tax}
                      onChange={(e) => handleItemChange(index, 'tax', parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      step="0.01"
                      required
                      disabled={isValidated}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <div className="px-2 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded text-gray-900">
                        {getCurrencySymbol(formData.currency)}{item.total.toFixed(2)}
                      </div>
                    </div>
                    {items.length > 1 && !isValidated && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="ml-2 p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    {getCurrencySymbol(formData.currency)}{totals.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA:</span>
                  <span className="font-medium text-gray-900">
                    {getCurrencySymbol(formData.currency)}{totals.taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-teal-600">
                    {getCurrencySymbol(formData.currency)}{totals.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Notas</h3>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            disabled={isValidated}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Notas adicionales..."
          />
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Adjuntos</h3>
          
          <div className="mb-4">
            <label className="block">
              <div className="flex items-center justify-center w-full px-4 py-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    {uploading ? 'Subiendo...' : 'Click para subir archivo'}
                  </p>
                  <p className="text-xs text-gray-500">PDF, PNG, JPG, etc. (Máximo 10MB)</p>
                </div>
              </div>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
              />
            </label>
          </div>

          {attachments.length > 0 ? (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {(attachment.fileSize / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-teal-600 hover:bg-teal-50 rounded"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No hay adjuntos</p>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Comentarios</h3>
          
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment(e);
                  }
                }}
                placeholder="Agregar un comentario..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
              />
              <Button 
                type="button" 
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </Button>
            </div>
          </div>

          {comments.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{comment.userName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.comment}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No hay comentarios</p>
          )}
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
