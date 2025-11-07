import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { UserProfile } from '../types';
import Spinner from './Spinner';
import { UserIcon } from './Icons';

const UserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const usersRef = ref(db, 'users');
        const unsubscribe = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            const usersArray: UserProfile[] = data ? Object.keys(data).map(key => ({ ...data[key], uid: key })) : [];
            setUsers(usersArray.sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '')));
            setIsLoading(false);
        }, (error) => {
            console.error(error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleRoleChange = async (uid: string, currentRole: 'admin' | 'seller') => {
        if (currentUser?.uid === uid) {
            alert("Você não pode alterar sua própria permissão.");
            return;
        }
        const newRole = currentRole === 'admin' ? 'seller' : 'admin';
        try {
            const userRef = ref(db, `users/${uid}`);
            await update(userRef, { role: newRole });
        } catch (error) {
            console.error("Erro ao atualizar a permissão:", error);
            alert("Ocorreu um erro ao tentar alterar a permissão do usuário.");
        }
    };
    
    return (
        <div className="bg-white text-slate-800 rounded-2xl shadow-lg border border-slate-200/50 p-6 sm:p-8">
            <p className="text-slate-500 max-w-md mb-6">
                Gerencie as permissões de acesso dos usuários. Promova vendedores a administradores ou reverta o acesso conforme necessário.
            </p>
            {isLoading ? <Spinner /> : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="max-h-[65vh] overflow-y-auto relative">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">
                                        Usuário
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-slate-900">
                                        Permissão
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {users.map(user => (
                                    <tr key={user.uid}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    {user.photoURL ? (
                                                      <img className="h-10 w-10 rounded-full object-cover" src={user.photoURL} alt="" />
                                                    ) : (
                                                      <UserIcon className="h-10 w-10 text-slate-300 bg-slate-100 rounded-full p-2"/>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="font-medium text-slate-900">{user.displayName || 'Nome não definido'}</div>
                                                    <div className="text-slate-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                                            <label htmlFor={`role-${user.uid}`} className="flex items-center justify-center cursor-pointer">
                                                <span className={`mr-3 font-medium ${user.role === 'seller' ? 'text-slate-500' : 'text-slate-900'}`}>Vendedor</span>
                                                <div className="relative">
                                                    <input 
                                                        type="checkbox" 
                                                        id={`role-${user.uid}`} 
                                                        className="sr-only" 
                                                        checked={user.role === 'admin'}
                                                        onChange={() => handleRoleChange(user.uid, user.role)}
                                                        disabled={currentUser?.uid === user.uid}
                                                    />
                                                    <div className={`block w-14 h-8 rounded-full transition ${user.role === 'admin' ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
                                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${user.role === 'admin' ? 'transform translate-x-6' : ''}`}></div>
                                                </div>
                                                <span className={`ml-3 font-medium ${user.role === 'admin' ? 'text-slate-900' : 'text-slate-500'}`}>Admin</span>
                                            </label>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && (
                            <div className="text-center text-slate-500 p-8">
                                Nenhum usuário encontrado.
                            </div>
                        )}
                    </div>
                </div>
            )}
             <style>{`
                input:checked ~ .dot {
                  transform: translateX(1.5rem);
                }
             `}</style>
        </div>
    );
};

export default UserManagement;
