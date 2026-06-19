import { useState, useCallback } from 'react';

interface ConfirmModalState {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
}

export function useConfirm() {
    const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        variant: 'primary',
        onConfirm: () => {},
    });

    const requestConfirm = useCallback((config: Omit<ConfirmModalState, 'isOpen'>) => {
        setConfirmModal({
            isOpen: true,
            ...config
        });
    }, []);

    const closeConfirm = useCallback(() => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }, []);

    return {
        confirmModal,
        requestConfirm,
        closeConfirm
    };
}
