import styles from './UserMessage.module.css';

interface UserMessageProps {
  text: string;
  timestamp: Date;
}

const UserMessage = ({ text }: UserMessageProps) => {
  return (
    <div className="flex w-full justify-end">
      <div className={styles.bubble}>
        <p className={styles.text}>{text}</p>
      </div>
    </div>
  );
};

export default UserMessage;
