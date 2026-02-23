import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@bosch/react-frok';
import { useDrawerStore } from '@stores/drawerStore';
import { overlayManager } from '@utils/overlayManager';

interface DrawerProps {
  drawerName: string;
  title: string;
  width?: string;
  onClose?: () => void;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const Drawer: React.FC<DrawerProps> = ({
  drawerName,
  title,
  width,
  onClose,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  const { drawers, closeDrawer } = useDrawerStore();
  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const drawerContent = drawers[drawerName];
  const isOpen = Boolean(drawerContent);

  const handleClose = useCallback(() => {
    closeDrawer(drawerName);
    onClose?.();
  }, [closeDrawer, drawerName, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      handleClose();
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        handleClose();
      }
    },
    [closeOnEscape, handleClose]
  );

  useEffect(() => {
    if (drawerRef.current && isOpen && width) {
      drawerRef.current.style.minWidth = width;
    }
  }, [width, isOpen]);

  useEffect(() => {
    if (isOpen && closeOnEscape) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, closeOnEscape, handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      overlayManager.addOverlay(`drawer-${drawerName}`);
      return () => {
        overlayManager.removeOverlay(`drawer-${drawerName}`);
      };
    }
  }, [isOpen, drawerName]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/10 transition-opacity duration-300"
        onClick={handleOverlayClick}
        role="button"
        tabIndex={0}
        aria-label="Close drawer"
      />
      {/* Drawer */}
      <div
        ref={drawerRef}
        className="relative ml-auto flex h-full min-w-[620px] flex-col bg-white p-6 text-black shadow-xl transition-transform duration-300 ease-in-out"
      >
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold">{title}</p>
          <Button icon="close" onClick={handleClose} mode="integrated" />
        </div>

        <div className="flex-1 overflow-y-auto py-4">{drawerContent}</div>
      </div>
    </div>,
    document.body
  );
};

export default Drawer;
