import { useCallback } from 'react';
import { useRouter } from 'next/router';

export function useAuthenticatedFetch() {
    const router = useRouter();

    const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const token = localStorage.getItem('adminToken');

        if (!token) {
            router.replace('/admin/login');
            throw new Error('Token não encontrado');
        }

        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (response.status === 401) {
                localStorage.removeItem('adminToken');
                router.replace('/admin/login');
                throw new Error('Token inválido ou expirado');
            }

            return response;
        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    }, [router]);

    return authenticatedFetch;
} 