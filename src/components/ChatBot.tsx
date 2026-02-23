import { useEffect, useRef, useState } from 'react';
import BotMessage from './BotMessage';
import UserMessage from './UserMessage';
import { useChatbot } from '@contexts/ChatbotContext';
import { useChatbotInput } from '@hooks/useChatbotInput';
import { CHATBOT_CONSTANTS } from '@constants/chatbot.constants';
import styles from './ChatBot.module.css';

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  bottomPosition?: string;
}

const ChatBot = ({ isOpen, onClose, bottomPosition = 'bottom-6' }: ChatBotProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // Use chatbot context for messages
  const { messages, isLoading } = useChatbot();

  // Use custom hook for input handling
  const { inputValue, handleInputChange, handleSendMessage, handleKeyPress, canSend } = useChatbotInput();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when loading state changes
  useEffect(() => {
    if (isLoading) {
      scrollToBottom();
    }
  }, [isLoading]);

  // Use MutationObserver to detect content changes during streaming and auto-scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const hasStreamingMessage = messages.some((msg) => msg.isStreaming);

    if (hasStreamingMessage) {
      // Create observer to watch for DOM changes during streaming
      const observer = new MutationObserver(() => {
        // Scroll to bottom whenever content changes
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      });

      // Observe the messages container for any changes
      observer.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return () => {
        observer.disconnect();
      };
    }
  }, [messages]);

  // Scroll to bottom when chatbot is opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom();
      }, CHATBOT_CONSTANTS.SCROLL_DELAY_MS);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed ${bottomPosition} z-50 flex flex-col bg-white shadow-2xl transition-all duration-300 ${isMaximized ? 'h-[65vh] w-[35vw]' : 'h-[550px] w-96'} ${styles.chatbotContainer}`}
      >
        {/* Triangular Arrow Pointer */}
        <div className={`absolute ${styles.arrowPointer}`} />

        {/* Header */}
        <div
          className={`relative flex items-center justify-between bg-white py-2 pl-2 pr-2 text-black ${styles.header}`}
        >
          <div className="absolute left-1/2 top-1 -translate-x-1/2">
            <svg className="h-1.5 w-6" viewBox="0 0 24 6" fill="none" xmlns="http://www.w3.org/2000/svg"></svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-black">Ask Vecto</span>
          </div>
          <div className="flex items-center gap-0">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="relative top-0.5 rounded-full p-1 text-black transition-all hover:bg-gray-100"
              aria-label={isMaximized ? 'Restore chatbot size' : 'Maximize chatbot'}
            >
              {isMaximized ? (
                <img src="assets/restore.svg" alt="restore"></img>
              ) : (
                <img src="assets/maximize.svg" alt="maximize"></img>
              )}
            </button>
            <button
              onClick={onClose}
              className="relative top-0.5 rounded-full p-1 text-black transition-all hover:bg-gray-100"
              aria-label="Minimize chatbot"
            >
              <img src="assets/minimize.svg" alt="minimize"></img>
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div ref={messagesContainerRef} className="flex-1 space-y-3 overflow-y-auto bg-white px-4 py-3">
          {messages.map((message, index) => (
            <div key={message.id} className="relative">
              {message.sender === 'bot' && (
                <>
                  <BotMessage text={message.text} timestamp={message.timestamp} isStreaming={message.isStreaming} />
                  {index === messages.length - 1 && !message.isStreaming && (
                    <p className="absolute left-0 mt-1 text-xs text-gray-400">
                      {message.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  )}
                </>
              )}
              {message.sender === 'user' && (
                <>
                  <UserMessage text={message.text} timestamp={message.timestamp} />
                  {index === messages.length - 1 && (
                    <p className="absolute right-0 mt-1 text-xs text-gray-400">
                      {message.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-lg bg-gray-100 px-3 py-2">
                <div className="flex gap-1">
                  <span className={styles.loadingDot}></span>
                  <span className={styles.loadingDot}></span>
                  <span className={styles.loadingDot}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white px-4 py-3">
          <div className={`flex items-center overflow-hidden ${styles.inputContainer}`}>
            <svg
              width="100%"
              height="48"
              viewBox="0 0 100 48"
              preserveAspectRatio="none"
              className={styles.inputUnderline}
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect y="47" width="100%" height="1" fill="black" />
            </svg>
            <div className={`flex-1 ${styles.inputWrapper}`}>
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your query..."
                className={`w-full bg-transparent px-3 py-2 text-sm focus:outline-none ${styles.input}`}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!canSend}
              className={`flex items-center justify-center transition-all hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 ${styles.sendButton}`}
              aria-label="Send message"
            >
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" fill={CHATBOT_CONSTANTS.INPUT_BG_COLOR} />
                <path
                  d="M25.7213 31.9822L21.7474 26.3058L16 22.8572L32 16L25.7213 31.9822ZM22.7465 25.9888L25.4717 29.8821L29.7546 18.9807L22.7465 25.9888ZM18.1917 23.0059L22.0187 25.3021L28.9074 18.4134L18.1917 23.0059Z"
                  fill={canSend ? 'black' : CHATBOT_CONSTANTS.SEND_ICON_DISABLED_COLOR}
                />
                <rect y="47" width="48" height="1" fill="black" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBot;
