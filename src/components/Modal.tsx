import React, { useEffect } from 'react';
import useModalStore from '@hooks/useModalStore';
import { overlayManager } from '@utils/overlayManager';

interface ModalProps {
  modalName: string;
}

const Modal = ({ modalName }: ModalProps) => {
  const modals = useModalStore((state) => state.modals);
  const closeModal = useModalStore((state) => state.closeModal);
  const isOpen = Boolean(modals[modalName]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal(modalName);
    }
  };

  useEffect(() => {
    if (isOpen) {
      overlayManager.addOverlay(`modal-${modalName}`);
      return () => {
        overlayManager.removeOverlay(`modal-${modalName}`);
      };
    }
  }, [isOpen, modalName]);

  if (!modals[modalName]) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/10"
      onClick={handleBackdropClick}
      role="button"
      tabIndex={0}
      aria-label="Close modal"
    >
      <div className="max-h-[90vh] max-w-[90vw] cursor-default overflow-auto bg-white shadow-xl">
        {React.isValidElement(modals[modalName]) && modals[modalName]}
      </div>
    </div>
  );
};
export default Modal;
