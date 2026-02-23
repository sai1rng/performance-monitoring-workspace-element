import { ReactNode } from 'react';
import styles from '../pages/LicenseManagement.module.css';

type CardProps = {
  header?: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
  className?: string;
  onClick?: () => void;
};

const Card = ({ header, body, footer, className = '', onClick }: CardProps) => {
  return (
    <div className={`${styles.card} ${className} cursor-pointer`} onClick={onClick}>
      {header && <div className={styles.cardHeader}>{header}</div>}
      {body && <div className={styles.cardContent}>{body}</div>}
      {footer && <div>{footer}</div>}
    </div>
  );
};

export default Card;
