import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { ComponentType } from 'react';

export function withAdminAuth<P extends object>(WrappedComponent: ComponentType<P>) {
    return function WithAdminAuthComponent(props: P) {
        const router = useRouter();
        const [isAuthorized, setIsAuthorized] = useState(false);

        useEffect(() => {
            const token = localStorage.getItem('adminToken');

            if (!token) {
                router.replace('/admin/login');
                return;
            }

            // Verificar se o token é válido
            const verifyToken = async () => {
                try {
                    const response = await fetch('/api/auth/verify', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Token inválido');
                    }

                    setIsAuthorized(true);
                } catch (error) {
                    localStorage.removeItem('adminToken');
                    router.replace('/admin/login');
                }
            };

            verifyToken();
        }, [router]);

        if (!isAuthorized) {
            return null; // ou um componente de loading
        }

        return <WrappedComponent {...props} />;
    };
} 