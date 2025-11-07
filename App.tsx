import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ref, onValue, update, increment, push, serverTimestamp } from 'firebase/database';
import { db } from './firebase/config';
import { useAuth } from './hooks/useAuth';
import { Product, ProductCategory, UserRole } from './types';
import Sidebar from './components/Navbar';
import KpiCard from './components/KpiCard';
import SaleCard from './components/SaleCard';
import BarChart from './components/BarChart';
import Login from './components/Login';
import Spinner from './components/Spinner';
import ProductManagementDashboard from './components/ProductManagementDashboard';
import StockManagement from './components/StockManagement';
import SalesLog from './components/SalesLog';
import ConfirmationModal from './components/ConfirmationModal';
import { BoxIcon, SavoryIcon, SweetIcon, CookieIcon } from './components/Icons';
import UserManagement from './components/UserManagement';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

type ActiveView = 'products' | 'dashboard' | 'products_management' | 'stock_management' | 'user_management';

const AppContent: React.FC<{ role: UserRole }> = ({ role }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ActiveView>('products');
  const [productToUnsell, setProductToUnsell] = useState<Product | null>(null);

  useEffect(() => {
    const productsRef = ref(db, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      const productsData = snapshot.val();
      if (productsData) {
        const productsArray = Object.keys(productsData).map(key => ({
          ...productsData[key],
          id: key,
        } as Product));
        setProducts(productsArray);
      } else {
        setProducts([]);
      }
      setIsLoadingProducts(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setIsLoadingProducts(false);
    });

    const categoriesRef = ref(db, 'categories');
    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            setCategories(Object.keys(data).sort((a, b) => a.localeCompare(b)));
        } else {
            setCategories([]);
        }
    });

    return () => {
        unsubscribeProducts();
        unsubscribeCategories();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return products
      .filter(p => p.name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [products, searchQuery]);
  
  const groupedProducts = useMemo(() => {
    return filteredProducts.reduce((acc, product) => {
      const category = product.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as Record<ProductCategory, Product[]>);
  }, [filteredProducts]);

  const totals = useMemo(() => {
    const initialTotals = {
      count: products.length,
      sold: 0,
      revenue: 0,
      categories: categories.reduce((acc, cat) => {
        acc[cat] = { sold: 0, revenue: 0 };
        return acc;
      }, {} as Record<ProductCategory, { sold: number, revenue: number }>)
    };

    return products.reduce((acc, p) => {
      const soldCount = p.sold || 0;
      const productRevenue = soldCount * (p.price || 0);
      acc.sold += soldCount;
      acc.revenue += productRevenue;
      if (acc.categories[p.category]) {
        acc.categories[p.category].sold += soldCount;
        acc.categories[p.category].revenue += productRevenue;
      }
      return acc;
    }, initialTotals);
  }, [products, categories]);

  const handleSell = useCallback(async (product: Product) => {
    const productRef = ref(db, `products/${product.id}`);
    const salesLogRef = ref(db, 'sales_log');
    try {
      // Update product counts
      await update(productRef, {
        stock: increment(-1),
        sold: increment(1)
      });
      // Create log entry
      await push(salesLogRef, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error processing sale:", error);
    }
  }, []);

  const handleRequestUnsell = (product: Product) => {
    setProductToUnsell(product);
  };

  const handleUnsell = useCallback(async (productId: string) => {
    const productRef = ref(db, `products/${productId}`);
    try {
      await update(productRef, {
        stock: increment(1),
        sold: increment(-1)
      });
    } catch (error) {
      console.error("Error updating product:", error);
    }
  }, []);
  
  const categoryIcons: Record<ProductCategory, React.ReactNode> = {
    Salgados: <SavoryIcon />,
    Doces: <SweetIcon />,
    Biscoitos: <CookieIcon />,
  };

  const EmptyState = () => (
    <div className="col-span-1 lg:col-span-3 text-center border border-dashed border-slate-700 rounded-2xl p-9 bg-[#3a475b] text-slate-400 mt-6">
       {searchQuery ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."}
    </div>
  );
  
  const isAdmin = role === 'admin';
  const viewTitles: Record<ActiveView, string> = {
    products: 'Produtos',
    dashboard: 'Dashboard de Faturamento',
    products_management: 'Gerenciar Itens',
    stock_management: 'Controle de Estoque',
    user_management: 'Gerenciamento de Usuários'
  };

  return (
    <div className="flex min-h-screen bg-[#2d3748] text-white">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isAdmin={isAdmin}
      />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <main className="flex-1 p-4 sm:p-6">
            <div className="max-w-[min(98vw,1400px)] mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-white/90">{viewTitles[activeView]}</h1>
                </header>

                {activeView === 'products' && (
                  <>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-5">
                      <input
                        id="search"
                        type="text"
                        placeholder="Buscar produto..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="appearance-none border border-slate-600 bg-[#3a475b] rounded-xl py-2.5 px-3 shadow-sm focus:outline-none focus:ring-4 focus:ring-orange-500/25 text-white placeholder-slate-400"
                      />
                      <span className="text-sm text-slate-400">{filteredProducts.length} itens</span>
                    </div>
                    
                    {isLoadingProducts ? <Spinner /> : (
                      filteredProducts.length > 0 ? (
                        <div className="space-y-8">
                          {categories.map(category => (
                            groupedProducts[category] && groupedProducts[category].length > 0 && (
                              <section key={category}>
                                <h2 className="text-2xl font-bold mb-4 text-white/90 border-b-2 border-[#FD7F08]/50 pb-2">{category}</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                  {groupedProducts[category].map(product => (
                                    <SaleCard
                                      key={product.id}
                                      product={product}
                                      onSell={handleSell}
                                      onRequestUnsell={handleRequestUnsell}
                                    />
                                  ))}
                                </div>
                              </section>
                            )
                          ))}
                        </div>
                      ) : (
                        <EmptyState />
                      )
                    )}
                  </>
                )}

                {isAdmin && activeView === 'dashboard' && (
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                    <section className="space-y-8 xl:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {categories.map(category => {
                                const data = totals.categories[category];
                                if (!data) return null;
                                return (
                                    <KpiCard
                                        key={category}
                                        variant="secondary"
                                        title={`Faturamento ${category}`}
                                        value={BRL.format(data.revenue)}
                                        subtitle={`${data.sold} vendidos`}
                                        icon={categoryIcons[category] || <BoxIcon />}
                                    />
                                );
                            })}
                        </div>
                      <BarChart data={totals.categories} categories={categories} />
                    </section>
                    <section className="xl:col-span-1">
                      <SalesLog />
                    </section>
                  </div>
                )}

                {isAdmin && activeView === 'products_management' && (
                  <ProductManagementDashboard />
                )}

                {isAdmin && activeView === 'stock_management' && (
                  <StockManagement />
                )}

                {isAdmin && activeView === 'user_management' && (
                  <UserManagement />
                )}
            </div>
        </main>
      </div>

      {productToUnsell && (
        <ConfirmationModal
          isOpen={!!productToUnsell}
          onClose={() => setProductToUnsell(null)}
          onConfirm={() => {
            if (productToUnsell) {
              handleUnsell(productToUnsell.id);
            }
            setProductToUnsell(null);
          }}
          title="Confirmar Estorno de Venda"
          message={
            <>
              <p className="mb-2">Tem certeza que deseja estornar a venda do item <strong>"{productToUnsell.name}"</strong>?</p>
              <p>Esta ação irá adicionar <strong>1 unidade</strong> de volta ao estoque e subtrair <strong>{BRL.format(productToUnsell.price)}</strong> do faturamento total.</p>
            </>
          }
          confirmText="Sim, Estornar Venda"
          cancelText="Cancelar"
          confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner fullScreen />;
  }
  
  if (!user) {
    return <Login />;
  }

  return <AppContent role={user.role} />;
};

export default App;