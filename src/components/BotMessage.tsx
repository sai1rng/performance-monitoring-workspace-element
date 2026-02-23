import { useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import styles from './BotMessage.module.css';
import { CHATBOT_CONSTANTS } from '@constants/chatbot.constants';

interface BotMessageProps {
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const BotMessage = ({ text, isStreaming = false }: BotMessageProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setCurrentIndex(0);
    setHasAnimated(false);
  }, [text]);

  useEffect(() => {
    // If not streaming or already animated, show full text immediately
    if (!isStreaming || hasAnimated) {
      setDisplayedText(text);
      return;
    }

    // Streaming effect: show text character by character
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, CHATBOT_CONSTANTS.MS_PER_CHARACTER);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && isStreaming) {
      // Animation complete, mark as animated
      setHasAnimated(true);
    }
  }, [currentIndex, text, isStreaming, hasAnimated]);

  // Memoize markdown components to prevent recreating on every render
  const markdownComponents = useMemo(
    () => ({
      // Custom styling for markdown elements
      a: ({ node, ...props }: any) => (
        <a {...props} className={styles.link} target="_blank" rel="noopener noreferrer" />
      ),
      code: ({ node, className, children, ...props }: any) => {
        const isInline = !className?.includes('language-');
        return isInline ? (
          <code {...props} className={styles.inlineCode}>
            {children}
          </code>
        ) : (
          <code {...props} className={`${styles.codeBlock} ${className || ''}`}>
            {children}
          </code>
        );
      },
      pre: ({ node, ...props }: any) => <pre {...props} className={styles.pre} />,
    }),
    []
  );

  return (
    <div className="flex justify-start">
      <div className={styles.bubble}>
        <div className={styles.markdownContent}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
            {displayedText}
          </ReactMarkdown>
          {isStreaming && currentIndex < text.length && <span className={styles.cursor} />}
        </div>
      </div>
    </div>
  );
};

export default BotMessage;
