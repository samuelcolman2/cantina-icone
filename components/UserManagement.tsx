import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { collection, getDocs } from 'firebase/firestore';
import { db, firestore } from '../firebase/config';
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

        const unsubscribe = onValue(usersRef, async (snapshot) => {
            try {
                const rtdbData = snapshot.val();
                const usersFromRtdb: Omit<UserProfile, 'photoURL'>[] = rtdbData 
                    ? Object.keys(rtdbData).map(key => ({ ...rtdbData[key], uid: key })) 
                    : [];

                if (usersFromRtdb.length > 0) {
                    // Fetch photos from Firestore
                    const photoProfilesRef = collection(firestore, 'user_profiles');
                    const photoSnapshot = await getDocs(photoProfilesRef);
                    const photoMap = new Map<string, string>();
                    photoSnapshot.forEach(doc => {
                        photoMap.set(doc.id, doc.data().photoBase64);
                    });

                    // Merge photo data into users
                    const usersWithPhotos: UserProfile[] = usersFromRtdb.map(user => ({
                        ...user,
                        photoURL: photoMap.get(user.uid) || null,
                    }));
                    
                    setUsers(usersWithPhotos.sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '')));
                } else {
                    setUsers([]);
                }

            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setIsLoading(false);
            }
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
        <div className="bg-white dark:bg-[#3a475b] text-slate-800 dark:text-slate-100 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700 p-6 sm:p-8">
            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                Gerencie as permissões de acesso dos usuários. Promova vendedores a administradores ou reverta o acesso conforme necessário.
            </p>
            {isLoading ? <Spinner /> : (
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <div className="max-h-[65vh] overflow-y-auto relative">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100 sm:pl-6">
                                        Usuário
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Permissão
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-[#3a475b]">
                                {users.map(user => (
                                    <tr key={user.uid}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    {user.photoURL ? (
                                                      <img className="h-10 w-10 rounded-full object-cover" src={user.photoURL} alt={`Foto de ${user.displayName || user.email}`} />
                                                    ) : (
                                                      <UserIcon className="h-10 w-10 text-slate-300 bg-slate-100 dark:bg-slate-600 rounded-full p-2"/>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">{user.displayName || 'Nome não definido'}</div>
                                                    <div className="text-slate-500 dark:text-slate-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                                            <label htmlFor={`role-${user.uid}`} className="flex items-center justify-center cursor-pointer">
                                                <span className={`mr-3 font-medium ${user.role === 'seller' ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>Vendedor</span>
                                                <div className="relative">
                                                    <input 
                                                        type="checkbox" 
                                                        id={`role-${user.uid}`} 
                                                        className="sr-only" 
                                                        checked={user.role === 'admin'}
                                                        onChange={() => handleRoleChange(user.uid, user.role)}
                                                        disabled={currentUser?.uid === user.uid}
                                                    />
                                                    <div className={`block w-14 h-8 rounded-full transition ${user.role === 'admin' ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${user.role === 'admin' ? 'transform translate-x-6' : ''}`}></div>
                                                </div>
                                                <span className={`ml-3 font-medium ${user.role === 'admin' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>Admin</span>
                                            </label>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && (
                            <div className="text-center text-slate-500 dark:text-slate-400 p-8">
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