
import React, { useState } from 'react';
import { FolderPlusIcon, PlusCircleIcon } from './Icons';
import CategoryManagementModal from './CategoryManagementModal';
import ProductManagementModal from './ProductManagementModal';

const ActionCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="bg-white text-slate-800 rounded-2xl shadow-lg border border-slate-200/50 p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
        <div className="bg-orange-100 text-orange-600 rounded-full p-4 mb-4">
            {icon}
        </div>
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-slate-500 text-sm">{description}</p>
    </button>
);

const ProductManagement: React.FC = () => {
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    return (
        <>
            <p className="text-center text-slate-400 mb-6 -mt-2">Selecione uma opção para começar a gerenciar.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                <ActionCard
                    icon={<FolderPlusIcon className="w-8 h-8" />}
                    title="Gerenciar Categorias"
                    description="Crie, renomeie ou remova grupos de produtos."
                    onClick={() => setIsCategoryModalOpen(true)}
                />
                <ActionCard
                    icon={<PlusCircleIcon className="w-8 h-8" />}
                    title="Gerenciar Produtos"
                    description="Adicione, edite ou remova itens para venda."
                    onClick={() => setIsProductModalOpen(true)}
                />
            </div>
            {isCategoryModalOpen && <CategoryManagementModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
            />}
            {isProductModalOpen && <ProductManagementModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
            />}
        </>
    );
};

export default ProductManagement;
