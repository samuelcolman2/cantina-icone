
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
import { BoxIcon, SavoryIcon, SweetIcon, CookieIcon, LogoutIcon, SunIcon, MoonIcon } from './components/Icons';
import UserManagement from './components/UserManagement';
import ProductRanking from './components/ProductRanking';
import { useTheme } from './contexts/ThemeContext';
import CategoryDetailsModal from './components/CategoryDetailsModal';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

type ActiveView = 'products' | 'dashboard' | 'products_management' | 'stock_management' | 'user_management';

// Helper to get today's key in YYYY-MM-DD format based on local time
const getTodayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = () => {
    return new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const AppContent: React.FC<{ role: UserRole }> = ({ role }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [dailySales, setDailySales] = useState<Record<string, number>>({});
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ActiveView>('products');
  const [productToUnsell, setProductToUnsell] = useState<Product | null>(null);
  const [selectedCategoryForDetails, setSelectedCategoryForDetails] = useState<ProductCategory | null>(null);
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // 1. Listen to Products (Base data)
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

    // 2. Listen to Categories
    const categoriesRef = ref(db, 'categories');
    const unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            setCategories(Object.keys(data).sort((a, b) => a.localeCompare(b)));
        } else {
            setCategories([]);
        }
    });

    // 3. Listen to Daily Sales for TODAY
    const todayKey = getTodayKey();
    const dailySalesRef = ref(db, `daily_sales/${todayKey}`);
    const unsubscribeDaily = onValue(dailySalesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            setDailySales(data);
        } else {
            setDailySales({});
        }
    });

    return () => {
        unsubscribeProducts();
        unsubscribeCategories();
        unsubscribeDaily();
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

  // Totals for Dashboard (Uses ALL-TIME sold from product object)
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
    const todayKey = getTodayKey();
    
    // Multi-path update to ensure consistency
    const updates: any = {};
    
    // 1. Update Product Stock and Total Sold
    updates[`products/${product.id}/stock`] = increment(-1);
    updates[`products/${product.id}/sold`] = increment(1);
    
    // 2. Update Daily Sales Counter
    updates[`daily_sales/${todayKey}/${product.id}`] = increment(1);

    try {
      await update(ref(db), updates);
      
      // 3. Add to Sales Log (Separate push, as it generates a new ID)
      const salesLogRef = ref(db, 'sales_log');
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
    const todayKey = getTodayKey();
    const updates: any = {};

    // 1. Revert Product Stock and Total Sold
    updates[`products/${productId}/stock`] = increment(1);
    updates[`products/${productId}/sold`] = increment(-1);
    
    // 2. Revert Daily Sales Counter
    // Note: Logic check to ensure we don't go below zero is handled by UI button disable,
    // but Firebase increment(-1) would technically allow negatives if not careful.
    // However, since we only allow Unsell if daily > 0, this is safe.
    updates[`daily_sales/${todayKey}/${productId}`] = increment(-1);

    try {
      await update(ref(db), updates);
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
    <div className="col-span-1 lg:col-span-3 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-9 bg-gray-200/50 dark:bg-[#3a475b] text-slate-500 dark:text-slate-400 mt-6">
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
    <div className="flex min-h-screen bg-gray-100 dark:bg-[#2d3748] text-slate-800 dark:text-white">
      {isAdmin && (
        <Sidebar
            activeView={activeView}
            setActiveView={setActiveView}
            isAdmin={isAdmin}
        />
      )}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {!isAdmin && (
            <header className="bg-white dark:bg-[#222b39] border-b border-slate-200 dark:border-white/10 px-4 py-3 flex justify-between items-center sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <img
                        src="https://iconecolegioecurso.com.br/wp-content/uploads/2022/08/xlogo_icone_site.png.pagespeed.ic_.QgXP3GszLC.webp"
                        alt="Logo Ícone Colégio e Curso"
                        className="h-12 w-auto object-contain"
                    />
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                     <button
                        onClick={toggleTheme}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                        title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                     >
                        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                     </button>
                     <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                     <button
                        onClick={logout}
                        className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors"
                        title="Sair"
                     >
                        <LogoutIcon />
                        <span className="hidden sm:inline">Sair</span>
                     </button>
                </div>
            </header>
        )}
        <main className="flex-1 p-4 sm:p-6">
            <div className="max-w-[min(98vw,1400px)] mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white/90">{viewTitles[activeView]}</h1>
                    {activeView === 'products' && (
                        <p className="text-orange-600 dark:text-[#FD7F08] font-medium mt-1 capitalize">
                            Vendas no dia {formatDisplayDate()}
                        </p>
                    )}
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
                        className="appearance-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-[#3a475b] rounded-xl py-2.5 px-3 shadow-sm focus:outline-none focus:ring-4 focus:ring-orange-500/25 text-slate-800 dark:text-white placeholder-slate-400"
                      />
                      <span className="text-sm text-slate-500 dark:text-slate-400">{filteredProducts.length} itens</span>
                    </div>
                    
                    {isLoadingProducts ? <Spinner /> : (
                      filteredProducts.length > 0 ? (
                        <div className="space-y-8">
                          {categories.map(category => (
                            groupedProducts[category] && groupedProducts[category].length > 0 && (
                              <section key={category}>
                                <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white/90 border-b-2 border-orange-500/50 dark:border-[#FD7F08]/50 pb-2">{category.toUpperCase()}</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                  {groupedProducts[category].map(product => (
                                    <SaleCard
                                      key={product.id}
                                      product={product}
                                      dailySold={dailySales[product.id] || 0}
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
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                      <section className="space-y-8 xl:col-span-2">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {categories.map(category => {
                                  const data = totals.categories[category];
                                  if (!data) return null;
                                  return (
                                      <KpiCard
                                          key={category.toUpperCase()}
                                          title={`Faturamento ${category.toUpperCase()}`}
                                          value={BRL.format(data.revenue)}
                                          subtitle={`${data.sold} vendidos`}
                                          icon={categoryIcons[category] || <BoxIcon />}
                                          onClick={() => setSelectedCategoryForDetails(category)}
                                      />
                                  );
                              })}
                          </div>
                        <BarChart 
                            data={totals.categories} 
                            categories={categories} 
                            onCategoryClick={(cat) => setSelectedCategoryForDetails(cat)}
                        />
                      </section>
                      <section className="xl:col-span-1">
                        <SalesLog />
                      </section>
                    </div>
                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white/90 border-b-2 border-orange-500/50 dark:border-[#FD7F08]/50 pb-2">Ranking de Produtos</h2>
                        <div className="pt-4">
                          <ProductRanking 
                            products={products} 
                            categories={categories} 
                            onCategoryClick={(cat) => setSelectedCategoryForDetails(cat)}
                          />
                        </div>
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

      {selectedCategoryForDetails && (
        <CategoryDetailsModal
          isOpen={!!selectedCategoryForDetails}
          onClose={() => setSelectedCategoryForDetails(null)}
          category={selectedCategoryForDetails}
          products={products}
        />
      )}

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
              <p className="mb-2">Tem certeza que deseja estornar a venda do item <strong>"{productToUnsell.name.toUpperCase()}"</strong>?</p>
              <p>Esta ação irá adicionar <strong>1 unidade</strong> de volta ao estoque.</p>
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
