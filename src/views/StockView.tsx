import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Trash2,
  X,
  PlusCircle,
} from 'lucide-react';
import {
  getStockProducts,
  saveStockProduct,
  addStockMovement,
  getStockMovements,
} from '../services/storage';
import { StockProduct, StockMovement } from '../types';
import { formatCurrency } from '../utils/formatters';

export const StockView: React.FC = () => {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');

  // Modals
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProductForMov, setSelectedProductForMov] = useState<StockProduct | null>(null);

  // Forms
  const [prodForm, setProdForm] = useState<Partial<StockProduct>>({
    code: '',
    name: '',
    category: 'Insumos',
    costPrice: 0,
    salePrice: 0,
    currentQuantity: 10,
    minimumQuantity: 5,
    unit: 'un',
    supplier: '',
  });

  const [movType, setMovType] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [movQty, setMovQty] = useState('1');
  const [movReason, setMovReason] = useState('Compra de Reposição');

  const loadData = () => {
    setProducts(getStockProducts());
    setMovements(getStockMovements());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name || !prodForm.code) return;

    saveStockProduct({
      code: prodForm.code,
      name: prodForm.name,
      category: prodForm.category || 'Peças',
      costPrice: Number(prodForm.costPrice) || 0,
      salePrice: Number(prodForm.salePrice) || 0,
      currentQuantity: Number(prodForm.currentQuantity) || 0,
      minimumQuantity: Number(prodForm.minimumQuantity) || 0,
      unit: prodForm.unit || 'un',
      supplier: prodForm.supplier || '',
    });

    loadData();
    setIsNewProductOpen(false);
    setProdForm({
      code: '',
      name: '',
      category: 'Insumos',
      costPrice: 0,
      salePrice: 0,
      currentQuantity: 10,
      minimumQuantity: 5,
      unit: 'un',
      supplier: '',
    });
  };

  const handleAddMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForMov) return;

    addStockMovement(
      selectedProductForMov.id,
      movType,
      Number(movQty) || 1,
      movReason
    );

    loadData();
    setIsMovementModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'todas' && p.category !== categoryFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term);
  });

  const lowStockCount = products.filter((p) => p.currentQuantity <= p.minimumQuantity).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-sky-600" />
            <span>Controle de Estoque & Peças ({products.length})</span>
          </h2>
          <p className="text-xs text-slate-500">Insumos de ar-condicionado, gás, compressores e alertas de baixa.</p>
        </div>

        <button
          onClick={() => setIsNewProductOpen(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Peça / Insumo</span>
        </button>
      </div>

      {/* Low Stock Banner Alert */}
      {lowStockCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-rose-950 text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <strong className="font-bold text-rose-900">Atenção! {lowStockCount} item(ns) com estoque baixo:</strong>
              <p className="text-rose-700 text-[11px] mt-0.5">
                {products
                  .filter((p) => p.currentQuantity <= p.minimumQuantity)
                  .map((p) => `${p.name} (${p.currentQuantity} ${p.unit})`)
                  .join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Categories Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome ou código da peça (ex: GAS-134, FILT-001)..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Products Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Código</th>
                <th className="p-3.5">Item / Insumo</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5 text-center">Qtd Atual</th>
                <th className="p-3.5 text-right">Preço Custo</th>
                <th className="p-3.5 text-right">Preço Venda</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isLow = p.currentQuantity <= p.minimumQuantity;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-800">{p.code}</td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {p.name}
                      {isLow && (
                        <span className="ml-2 text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                          Estoque Baixo
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600">{p.category}</td>
                    <td className="p-3.5 text-center font-bold">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                          isLow ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        {p.currentQuantity} {p.unit}
                      </span>
                    </td>
                    <td className="p-3.5 text-right text-slate-500">{formatCurrency(p.costPrice)}</td>
                    <td className="p-3.5 text-right font-bold text-sky-700">{formatCurrency(p.salePrice)}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => {
                          setSelectedProductForMov(p);
                          setIsMovementModalOpen(true);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer"
                      >
                        Ajustar / Entrada
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW PRODUCT MODAL */}
      {isNewProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Cadastrar Nova Peça no Estoque</h3>
              <button onClick={() => setIsNewProductOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código da Peça *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.code}
                    onChange={(e) => setProdForm({ ...prodForm, code: e.target.value.toUpperCase() })}
                    placeholder="Ex: GAS-R134A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  >
                    <option value="Gás Refrigerante">Gás Refrigerante</option>
                    <option value="Compressores">Compressores</option>
                    <option value="Filtros">Filtros de Cabine</option>
                    <option value="Evaporadores">Evaporadores / Condensadores</option>
                    <option value="Válvulas & O-rings">Válvulas & O-rings</option>
                    <option value="Óleo e Insumos">Óleo e Insumos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="Ex: Refil Gás Refrigerante R134a 13.6kg"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodForm.costPrice}
                    onChange={(e) => setProdForm({ ...prodForm, costPrice: Number(e.target.value) })}
                    placeholder="250.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodForm.salePrice}
                    onChange={(e) => setProdForm({ ...prodForm, salePrice: Number(e.target.value) })}
                    placeholder="450.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    value={prodForm.currentQuantity}
                    onChange={(e) => setProdForm({ ...prodForm, currentQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mínimo Alerta</label>
                  <input
                    type="number"
                    value={prodForm.minimumQuantity}
                    onChange={(e) => setProdForm({ ...prodForm, minimumQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidade</label>
                  <input
                    type="text"
                    value={prodForm.unit}
                    onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                    placeholder="un, kg, l"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewProductOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVEMENT MODAL */}
      {isMovementModalOpen && selectedProductForMov && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Movimentação de Estoque — {selectedProductForMov.name}
              </h3>
              <button onClick={() => setIsMovementModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMovementSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Movimento</label>
                <select
                  value={movType}
                  onChange={(e) => setMovType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="entrada">Entrada (+ Adicionar Estoque)</option>
                  <option value="saida">Saída (- Remover do Estoque)</option>
                  <option value="ajuste">Ajuste Manual de Inventário</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantidade *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={movQty}
                  onChange={(e) => setMovQty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo / Observação</label>
                <input
                  type="text"
                  value={movReason}
                  onChange={(e) => setMovReason(e.target.value)}
                  placeholder="Ex: Nota Fiscal 1042 Fornecedor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs"
                >
                  Confirmar Movimentação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
