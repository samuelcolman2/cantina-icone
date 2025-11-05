
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ref, onValue, update, increment } from 'firebase/database';
import { db } from './firebase/config';
import { useAuth } from './hooks/useAuth';
import { Product, ProductCategory, UserRole } from './types';
import Navbar from './components/Navbar';
import KpiCard from './components/KpiCard';
import SaleCard from './components/SaleCard';
import BarChart from './components/BarChart';
import Login from './components/Login';
import Spinner from './components/Spinner';
import ProductManagement from './components/UserManagement';
import { BoxIcon, ShoppingBagIcon, CurrencyDollarIcon, SavoryIcon, SweetIcon, CookieIcon } from './components/Icons';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

type ActiveView = 'products' | 'dashboard' | 'products_management';

const AppContent: React.FC<{ role: UserRole }> = ({ role }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ActiveView>('products');

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
            // Sort to maintain a consistent order, e.g., alphabetically
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

  const handleSell = useCallback(async (productId: string) => {
    const productRef = ref(db, `products/${productId}`);
    try {
      await update(productRef, {
        stock: increment(-1),
        sold: increment(1)
      });
    } catch (error) {
      console.error("Error updating product:", error);
    }
  }, []);

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
    <div className="col-span-1 lg:col-span-3 text-center border border-dashed border-slate-300 rounded-2xl p-9 bg-white text-slate-500 mt-6">
       {searchQuery ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."}
    </div>
  );
  
  const isAdmin = role === 'admin';

  return (
    <div className="bg-[#2d3748] min-h-screen text-[#FD7F08]">
      <Navbar />
      <main className="max-w-[min(98vw,1400px)] mx-auto px-3 py-3">
        <section className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 my-4`}>
          <KpiCard
            title="Produtos"
            value={totals.count.toString()}
            subtitle="cadastrados"
            icon={<BoxIcon />}
            onClick={() => setActiveView('products')}
            isActive={activeView === 'products'}
          />
          <KpiCard
            title="Itens vendidos"
            value={totals.sold.toString()}
            subtitle="no período"
            icon={<ShoppingBagIcon />}
            isActive={false} // This card is not clickable
          />
          <KpiCard
            title="Faturamento"
            value={BRL.format(totals.revenue)}
            subtitle="estimado"
            icon={<CurrencyDollarIcon />}
            onClick={isAdmin ? () => setActiveView('dashboard') : undefined}
            isActive={activeView === 'dashboard'}
          />
          {isAdmin && (
            <KpiCard
              title="Produtos"
              value="Gerenciar"
              subtitle="categorias e itens"
              icon={<BoxIcon />}
              onClick={() => setActiveView('products_management')}
              isActive={activeView === 'products_management'}
            />
          )}
        </section>
        
        {isAdmin && activeView === 'dashboard' && (
          <section className="my-8 space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 text-white/90 border-b-2 border-[#FD7F08]/50 pb-2">Dashboard por Categoria</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
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
            </div>
            <BarChart data={totals.categories} categories={categories} />
          </section>
        )}

        {activeView === 'products' && (
          <>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 my-3 md:my-5">
              <input
                id="search"
                type="text"
                placeholder="Buscar produto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="appearance-none border border-slate-300 bg-white rounded-xl py-2.5 px-3 shadow-sm focus:outline-none focus:ring-4 focus:ring-orange-500/25 text-slate-800 placeholder-slate-400"
              />
              <span className="text-sm text-slate-400">{filteredProducts.length} itens</span>
            </div>
            
            {isLoadingProducts ? <Spinner /> : (
              filteredProducts.length > 0 ? (
                <div className="space-y-8 mt-6">
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
                              onUnsell={handleUnsell}
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

        {isAdmin && activeView === 'products_management' && (
          <ProductManagement />
        )}
      </main>
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
