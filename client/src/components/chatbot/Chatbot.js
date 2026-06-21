import React, { useState } from 'react';
import ChatbotButton from './ChatbotButton';
import ChatbotWindow from './ChatbotWindow';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <ChatbotButton onClick={toggleChat} isOpen={isOpen} />
      <ChatbotWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default Chatbot;
