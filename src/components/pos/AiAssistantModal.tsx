import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { GEMINI_TEXT_MODEL } from '../../constants';
import { useRestaurantData } from '../../hooks/useRestaurantData';
import { ChatMessage } from '../../types';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { FiSend } from 'react-icons/fi';

interface AiAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
    const { menuItems, foodMenuCategories } = useRestaurantData();
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        if (isOpen && !chat) {
            setIsLoading(true);
            const simplifiedMenu = menuItems.map(item => ({
                name: item.name,
                description: item.description,
                category: item.category,
                variations: item.variations.map(v => ({ name: v.name, price: v.price })),
                isVeg: item.isVeg,
            }));
            
            const systemInstruction = `You are a helpful AI assistant for a restaurant cashier named RestoBot. Your goal is to answer questions based ONLY on the provided menu data. If a question cannot be answered from the menu, say that you don't have that information. Be friendly, concise, and helpful. You can suggest items, describe dishes, and answer questions about ingredients if mentioned in the description. Here is the menu data in JSON format: ${JSON.stringify({ categories: foodMenuCategories.map(c => c.name), menu: simplifiedMenu })}`;
            
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const newChat = ai.chats.create({
                    model: GEMINI_TEXT_MODEL,
                    config: { systemInstruction }
                });
                setChat(newChat);
                setMessages([{ role: 'model', text: 'Hello! I am RestoBot. How can I help you with the menu today?' }]);
            } catch (error) {
                console.error("AI Assistant initialization failed:", error);
                setMessages([{ role: 'model', text: 'Sorry, the AI Assistant could not be started. Please check the API key and configuration.' }]);
            } finally {
                setIsLoading(false);
            }
        }
    }, [isOpen, chat, menuItems, foodMenuCategories]);

    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading || !chat) return;

        const newUserMessage: ChatMessage = { role: 'user', text: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const result = await chat.sendMessageStream({ message: userInput });
            
            let currentResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);
            
            for await (const chunk of result) {
                currentResponse += chunk.text;
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage.role === 'model') {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = { ...lastMessage, text: currentResponse };
                        return newMessages;
                    }
                    return prev; 
                });
            }

        } catch (error) {
            console.error("Error sending message to AI:", error);
            setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Assistant" size="lg">
            <div className="flex flex-col h-[60vh]">
                <div className="flex-grow overflow-y-auto custom-scrollbar p-4 bg-gray-50 rounded-lg space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-sky-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                         <div className="flex justify-start">
                            <div className="max-w-md p-3 rounded-2xl bg-white border">
                                <Spinner size="sm" color="text-sky-600" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="flex-shrink-0 pt-4">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex space-x-2">
                        <Input
                            containerClassName="flex-grow mb-0"
                            placeholder="Ask about menu items, pairings, etc..."
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            disabled={isLoading}
                        />
                        <Button type="submit" isLoading={isLoading} disabled={isLoading || !userInput.trim()}>
                            <FiSend/>
                        </Button>
                    </form>
                </div>
            </div>
        </Modal>
    );
};

export default AiAssistantModal;