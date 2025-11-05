import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase/config';
import { ProductCategory } from '../types';
import CategoryModal from './CategoryModal';
import ProductModal from './ProductModal';
import KpiCard from './KpiCard';
import { PlusCircleIcon, FolderPlusIcon } from './Icons';

const ProductManagement: React.FC = () => {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  useEffect(() => {
    const categoriesRef = ref(db, 'categories');
    const unsubscribe = onValue(categoriesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const categoryList = Object.keys(data).sort();
            setCategories(categoryList);
        } else {
            setCategories([]);
        }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <section className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 text-slate-800">
        <h2 className="text-2xl font-bold text-slate-800 border-b-2 border-slate-200 pb-2">Gerenciar Produtos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <div onClick={() => setIsCategoryModalOpen(true)} className="cursor-pointer">
                <KpiCard
                    variant="secondary"
                    title="Cadastrar Categoria"
                    value="Nova"
                    subtitle="Adicione um novo grupo de produtos"
                    icon={<FolderPlusIcon />}
                />
            </div>
            <div onClick={() => setIsProductModalOpen(true)} className="cursor-pointer">
                 <KpiCard
                    variant="secondary"
                    title="Cadastrar Produto"
                    value="Novo"
                    subtitle="Adicione um novo item de venda"
                    icon={<PlusCircleIcon />}
                />
            </div>
        </div>
      </section>

      <CategoryModal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)} 
      />
      
      <ProductModal 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        categories={categories}
      />
    </>
  );
};

export default ProductManagement;