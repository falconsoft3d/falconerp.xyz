'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/contexts/ThemeContext';

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface Opportunity {
  id: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  probability: number;
  priority: string;
  stageId: string;
  scheduledDate?: Date | string;
  contact?: {
    name: string;
    email?: string;
  };
}

interface Pipeline {
  id: string;
  name: string;
  description?: string;
  stages: Stage[];
}

interface Contact {
  id: string;
  name: string;
}

export default function CRMPage() {
  const { primaryColor } = useTheme();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  // Estados para modales de pipeline y stage (no implementados aún)
  // const [showNewPipelineModal, setShowNewPipelineModal] = useState(false);
  // const [showNewStageModal, setShowNewStageModal] = useState(false);
  const [showNewOpportunityModal, setShowNewOpportunityModal] = useState(false);
  const [showEditOpportunityModal, setShowEditOpportunityModal] = useState(false);
  const [showPublicLinkModal, setShowPublicLinkModal] = useState(false);
  const [publicFormUrl, setPublicFormUrl] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'calendar'>('board');
  const [selectedStageForNew, setSelectedStageForNew] = useState<string>('');
  const [creatingOpportunity, setCreatingOpportunity] = useState(false);
  const [updatingOpportunity, setUpdatingOpportunity] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [newOpportunity, setNewOpportunity] = useState({
    title: '',
    description: '',
    value: 0,
    currency: 'EUR',
    probability: 50,
    priority: 'MEDIUM',
    contactId: '',
    expectedCloseDate: '',
    scheduledDate: '',
  });

  useEffect(() => {
    fetchPipelines();
    fetchContacts();
  }, []);

  useEffect(() => {
    if (selectedPipeline) {
      fetchOpportunities();
    }
  }, [selectedPipeline]);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchPipelines = async () => {
    try {
      const res = await fetch('/api/crm/pipelines');
      if (res.ok) {
        const data = await res.json();
        setPipelines(data);
        if (data.length > 0 && !selectedPipeline) {
          setSelectedPipeline(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching pipelines:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunities = async () => {
    if (!selectedPipeline) return;
    try {
      const res = await fetch(`/api/crm/opportunities?pipelineId=${selectedPipeline.id}`);
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    }
  };

  const createDefaultPipeline = async () => {
    try {
      const res = await fetch('/api/crm/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Pipeline de Ventas',
          description: 'Pipeline principal de ventas',
          isDefault: true,
        }),
      });

      if (res.ok) {
        const pipeline = await res.json();
        
        // Crear etapas por defecto
        const stageNames = [
          { name: 'Prospecto', color: '#3b82f6' },
          { name: 'Contacto Inicial', color: '#8b5cf6' },
          { name: 'Propuesta', color: '#f59e0b' },
          { name: 'Negociación', color: '#10b981' },
          { name: 'Cerrado Ganado', color: '#22c55e' },
          { name: 'Cerrado Perdido', color: '#ef4444' },
        ];

        for (const stage of stageNames) {
          await fetch('/api/crm/stages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pipelineId: pipeline.id,
              ...stage,
            }),
          });
        }

        await fetchPipelines();
      }
    } catch (error) {
      console.error('Error creating pipeline:', error);
    }
  };

  const getOpportunitiesByStage = (stageId: string) => {
    return opportunities.filter(opp => opp.stageId === stageId);
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      EUR: '€',
      USD: '$',
      GBP: '£',
    };
    return symbols[currency] || currency;
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return colors[priority] || colors.MEDIUM;
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPipeline || !newOpportunity.title) return;

    setCreatingOpportunity(true);
    try {
      const stageId = selectedStageForNew || selectedPipeline.stages[0]?.id;
      if (!stageId) {
        alert('No hay etapas disponibles');
        return;
      }

      const res = await fetch('/api/crm/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOpportunity,
          pipelineId: selectedPipeline.id,
          stageId,
          value: Number(newOpportunity.value),
          probability: Number(newOpportunity.probability),
          contactId: newOpportunity.contactId || undefined,
          expectedCloseDate: newOpportunity.expectedCloseDate || undefined,
          scheduledDate: newOpportunity.scheduledDate || undefined,
        }),
      });

      if (res.ok) {
        setShowNewOpportunityModal(false);
        setNewOpportunity({
          title: '',
          description: '',
          value: 0,
          currency: 'EUR',
          probability: 50,
          priority: 'MEDIUM',
          contactId: '',
          expectedCloseDate: '',
          scheduledDate: '',
        });
        setSelectedStageForNew('');
        await fetchOpportunities();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'No se pudo crear la oportunidad'}`);
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
      alert('Error al crear oportunidad');
    } finally {
      setCreatingOpportunity(false);
    }
  };

  const handleEditOpportunity = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setShowEditOpportunityModal(true);
  };

  const handleUpdateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpportunity) return;

    setUpdatingOpportunity(true);
    try {
      const res = await fetch(`/api/crm/opportunities/${editingOpportunity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingOpportunity.title,
          description: editingOpportunity.description,
          value: Number(editingOpportunity.value),
          currency: editingOpportunity.currency,
          probability: Number(editingOpportunity.probability),
          priority: editingOpportunity.priority,
          contactId: editingOpportunity.contact?.name ? undefined : null,
          stageId: editingOpportunity.stageId,
        }),
      });

      if (res.ok) {
        setShowEditOpportunityModal(false);
        setEditingOpportunity(null);
        await fetchOpportunities();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'No se pudo actualizar la oportunidad'}`);
      }
    } catch (error) {
      console.error('Error updating opportunity:', error);
      alert('Error al actualizar oportunidad');
    } finally {
      setUpdatingOpportunity(false);
    }
  };

  const handleGeneratePublicLink = async () => {
    if (!selectedPipeline) return;
    
    setGeneratingLink(true);
    try {
      const res = await fetch(`/api/crm/pipelines/${selectedPipeline.id}/public-form`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setPublicFormUrl(data.url);
        setShowPublicLinkModal(true);
      } else {
        alert('Error al generar el enlace público');
      }
    } catch (error) {
      console.error('Error generating public link:', error);
      alert('Error al generar el enlace público');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Enlace copiado al portapapeles');
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Si se suelta en la misma posición, no hacer nada
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Actualizar en el servidor
    try {
      const res = await fetch(`/api/crm/opportunities/${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: destination.droppableId,
        }),
      });

      if (res.ok) {
        await fetchOpportunities();
      } else {
        alert('Error al mover la oportunidad');
      }
    } catch (error) {
      console.error('Error moving opportunity:', error);
      alert('Error al mover la oportunidad');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (pipelines.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido al CRM</h2>
          <p className="text-gray-600 mb-6">
            Crea tu primer pipeline para comenzar a gestionar oportunidades de negocio
          </p>
          <button
            onClick={createDefaultPipeline}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            Crear Pipeline de Ventas
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">CRM</h1>
          <p className="text-gray-600 mt-1">Gestiona tus oportunidades de negocio</p>
        </div>
        <div className="flex gap-3">
          {/* Cambiar Vista */}
          <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('board')}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'board'
                  ? 'bg-teal-50 text-teal-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-teal-50 text-teal-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          
          {/* Enlace Público */}
          <button
            onClick={handleGeneratePublicLink}
            disabled={generatingLink || !selectedPipeline}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {generatingLink ? 'Generando...' : 'Enlace Público'}
          </button>

          <button
            onClick={() => setShowNewOpportunityModal(true)}
            className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            + Nueva Oportunidad
          </button>
        </div>
      </div>

      {/* Pipeline Selector */}
      {pipelines.length > 1 && (
        <div className="flex gap-2">
          {pipelines.map((pipeline) => (
            <button
              key={pipeline.id}
              onClick={() => setSelectedPipeline(pipeline)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPipeline?.id === pipeline.id
                  ? 'text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              style={{
                backgroundColor: selectedPipeline?.id === pipeline.id ? primaryColor : undefined,
              }}
            >
              {pipeline.name}
            </button>
          ))}
        </div>
      )}

      {/* Vista Board */}
      {viewMode === 'board' && (
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)]">
          {selectedPipeline?.stages.map((stage) => {
            const stageOpportunities = getOpportunitiesByStage(stage.id);
            const stageValue = stageOpportunities.reduce((sum, opp) => sum + opp.value, 0);

            return (
              <div key={stage.id} className="flex-shrink-0 w-80 h-full flex flex-col">
                <div className="bg-gray-100 rounded-lg p-3 flex flex-col h-full">
                  {/* Stage Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h3 className="font-semibold text-gray-800">{stage.name}</h3>
                      <span className="text-sm text-gray-600">({stageOpportunities.length})</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStageForNew(stage.id);
                        setShowNewOpportunityModal(true);
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>

                  {/* Stage Value */}
                  {stageValue > 0 && (
                    <div className="text-sm text-gray-600 mb-3">
                      Total: {getCurrencySymbol('EUR')}{stageValue.toFixed(2)}
                    </div>
                  )}

                  {/* Opportunities - Droppable */}
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 overflow-y-auto flex-1 ${
                          snapshot.isDraggingOver ? 'bg-blue-50 rounded' : ''
                        }`}
                      >
                        {stageOpportunities.map((opportunity, index) => (
                          <Draggable
                            key={opportunity.id}
                            draggableId={opportunity.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div {...provided.dragHandleProps} className="flex-1 cursor-grab active:cursor-grabbing">
                                    <h4 className="font-medium text-gray-800">{opportunity.title}</h4>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleEditOpportunity(opportunity)}
                                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                      title="Editar"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(opportunity.priority)}`}>
                                      {opportunity.priority}
                                    </span>
                                  </div>
                                </div>

                                {opportunity.description && (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                    {opportunity.description}
                                  </p>
                                )}

                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-semibold text-gray-800">
                                    {getCurrencySymbol(opportunity.currency)}{opportunity.value.toFixed(2)}
                                  </span>
                                  <span className="text-gray-600">{opportunity.probability}%</span>
                                </div>

                                {opportunity.contact && (
                                  <div className="mt-2 pt-2 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
                                        <span className="text-xs font-medium text-teal-600">
                                          {opportunity.contact.name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-600">{opportunity.contact.name}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {stageOpportunities.length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-sm">Sin oportunidades</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>
      )}

      {/* Vista Calendario */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-7 gap-4">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700 py-2">
                {day}
              </div>
            ))}
            {/* Calendar grid - simplified for now */}
            {Array.from({ length: 35 }).map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - date.getDay() + i);
              const dateStr = date.toISOString().split('T')[0];
              
              const dayOpportunities = opportunities.filter(opp => {
                if (!opp.scheduledDate) return false;
                const oppDate = new Date(opp.scheduledDate);
                return oppDate.toISOString().split('T')[0] === dateStr;
              });

              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={i}
                  className={`min-h-[120px] border rounded-lg p-2 ${
                    isToday ? 'bg-teal-50 border-teal-300' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`text-sm font-medium mb-2 ${isToday ? 'text-teal-600' : 'text-gray-600'}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayOpportunities.map((opp) => (
                      <div
                        key={opp.id}
                        onClick={() => handleEditOpportunity(opp)}
                        className="text-xs bg-white p-1 rounded border-l-2 cursor-pointer hover:shadow-md transition-shadow"
                        style={{ borderLeftColor: selectedPipeline?.stages.find(s => s.id === opp.stageId)?.color }}
                      >
                        <div className="font-medium truncate text-gray-900">{opp.title}</div>
                        <div className="text-gray-500">{getCurrencySymbol(opp.currency)}{opp.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Enlace Público */}
      {showPublicLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Enlace Público</h2>
              <button
                onClick={() => setShowPublicLinkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Comparte este enlace para que personas puedan enviar consultas directamente a tu CRM:
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={publicFormUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-gray-50"
              />
              <button
                onClick={() => copyToClipboard(publicFormUrl)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Copiar
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">💡 Consejo:</p>
              <p>Este enlace creará nuevas oportunidades en la primera etapa de tu pipeline automáticamente.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Oportunidad */}
      {showNewOpportunityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Nueva Oportunidad</h2>
                <button
                  onClick={() => {
                    setShowNewOpportunityModal(false);
                    setSelectedStageForNew('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateOpportunity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={newOpportunity.title}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={newOpportunity.description}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Valor
                    </label>
                    <input
                      type="number"
                      value={newOpportunity.value}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, value: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Moneda
                    </label>
                    <select
                      value={newOpportunity.currency}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Probabilidad (%)
                    </label>
                    <input
                      type="number"
                      value={newOpportunity.probability}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, probability: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Prioridad
                    </label>
                    <select
                      value={newOpportunity.priority}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    >
                      <option value="LOW">Baja</option>
                      <option value="MEDIUM">Media</option>
                      <option value="HIGH">Alta</option>
                      <option value="URGENT">Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Etapa
                  </label>
                  <select
                    value={selectedStageForNew}
                    onChange={(e) => setSelectedStageForNew(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  >
                    {!selectedStageForNew && <option value="">Primera etapa</option>}
                    {selectedPipeline?.stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Contacto
                  </label>
                  <select
                    value={newOpportunity.contactId}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, contactId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Sin contacto</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Fecha estimada de cierre
                    </label>
                    <input
                      type="date"
                      value={newOpportunity.expectedCloseDate}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, expectedCloseDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Fecha programada
                    </label>
                    <input
                      type="date"
                      value={newOpportunity.scheduledDate}
                      onChange={(e) => setNewOpportunity({ ...newOpportunity, scheduledDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewOpportunityModal(false);
                      setSelectedStageForNew('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingOpportunity || !newOpportunity.title}
                    className="flex-1 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {creatingOpportunity ? 'Creando...' : 'Crear Oportunidad'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Oportunidad */}
      {showEditOpportunityModal && editingOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Editar Oportunidad</h2>
                <button
                  onClick={() => {
                    setShowEditOpportunityModal(false);
                    setEditingOpportunity(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateOpportunity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={editingOpportunity.title}
                    onChange={(e) => setEditingOpportunity({ ...editingOpportunity, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={editingOpportunity.description || ''}
                    onChange={(e) => setEditingOpportunity({ ...editingOpportunity, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Valor
                    </label>
                    <input
                      type="number"
                      value={editingOpportunity.value}
                      onChange={(e) => setEditingOpportunity({ ...editingOpportunity, value: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Moneda
                    </label>
                    <select
                      value={editingOpportunity.currency}
                      onChange={(e) => setEditingOpportunity({ ...editingOpportunity, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Probabilidad (%)
                    </label>
                    <input
                      type="number"
                      value={editingOpportunity.probability}
                      onChange={(e) => setEditingOpportunity({ ...editingOpportunity, probability: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Prioridad
                    </label>
                    <select
                      value={editingOpportunity.priority}
                      onChange={(e) => setEditingOpportunity({ ...editingOpportunity, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    >
                      <option value="LOW">Baja</option>
                      <option value="MEDIUM">Media</option>
                      <option value="HIGH">Alta</option>
                      <option value="URGENT">Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Etapa
                  </label>
                  <select
                    value={editingOpportunity.stageId}
                    onChange={(e) => setEditingOpportunity({ ...editingOpportunity, stageId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  >
                    {selectedPipeline?.stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditOpportunityModal(false);
                      setEditingOpportunity(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updatingOpportunity || !editingOpportunity.title}
                    className="flex-1 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {updatingOpportunity ? 'Actualizando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
