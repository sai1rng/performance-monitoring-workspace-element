import { Icon } from '@bosch/react-frok';
import { PROVISIONING_DIALOG_TYPES } from '@constants/workspace.constants';
import { useEffect, useRef, useState } from 'react';
import styles from './VariantActionMenu.module.css';

export interface MenuAction {
  label: string;
  value: string;
  action: string;
}

interface ActionMenuProps {
  actions: MenuAction[];
  onAction?: (action: string) => void;
  disabled?: boolean;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ actions, onAction = () => {}, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>(actions[0]?.label || '');

  const handleActionClick = (action: string, label: string) => {
    onAction(action);
    setSelectedLabel(label);
    setIsOpen(false);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className={`relative inline-block w-full ${styles.noPaddingParent}`}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex h-12 w-full cursor-pointer items-center justify-between bg-bosch-gray-90 px-4 text-left hover:bg-bosch-gray-80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>{selectedLabel}</span>
        <Icon iconName="arrow-up-down" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-0 z-10 border-x border-b border-gray-300 bg-white shadow-lg">
          {actions.map((action) => {
            const isDeprovisionAction = action.action === PROVISIONING_DIALOG_TYPES.TERMINATE;
            return (
              <button
                key={action.value}
                onClick={() => handleActionClick(action.action, action.label)}
                className={`h-12 w-full px-4 text-left hover:bg-bosch-gray-90 ${isDeprovisionAction ? 'text-bosch-red' : ''}`}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
