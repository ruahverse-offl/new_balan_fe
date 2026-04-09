import React, { useState, useRef, useEffect } from 'react';
import { X, Send, ShoppingCart, MapPin, ArrowRight } from 'lucide-react';
import { processMessage, getOrderStatus } from '../../services/chatbotApi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import './Chatbot.css';

const ChatWindow = ({ isOpen, onClose }) => {
    const { addItem, cart, setIsCartOpen } = useCart();
    const { user, isAuthenticated } = useAuth();

    // Get user's first name for personalization
    const userName = user?.name?.split(' ')[0] || '';

    const getWelcomeMessage = () => {
        if (isAuthenticated && userName) {
            return `Hello ${userName}! 👋 Welcome back to New Balan Medical & Clinic!\n\nI'm your virtual assistant. How can I help you today?\n\n🛒 You have ${cart.length} item(s) in your cart.`;
        }
        return "Hello! 👋 Welcome to New Balan Medical & Clinic!\n\nI'm your virtual assistant. How can I help you today?";
    };

    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            content: {
                type: 'text',
                message: getWelcomeMessage()
            },
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [awaitingOrderId, setAwaitingOrderId] = useState(false);
    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    let messageIdCounter = 0;

    const addMessage = (type, content) => {
        const newMessage = {
            id: ++messageIdCounter,
            type,
            content,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage = inputValue.trim();
        setInputValue('');

        // Add user message
        addMessage('user', { type: 'text', message: userMessage });

        setIsTyping(true);

        try {
            // Check if we're waiting for order ID
            if (awaitingOrderId) {
                const orderResult = await getOrderStatus(userMessage);
                setAwaitingOrderId(false);
                addMessage('bot', {
                    type: 'order_status',
                    order: orderResult.order
                });
            } else {
                const response = await processMessage(userMessage);

                if (response.type === 'order_query') {
                    setAwaitingOrderId(true);
                }

                addMessage('bot', response);
            }
        } catch {
            addMessage('bot', {
                type: 'text',
                message: "Sorry, I encountered an error. Please try again."
            });
        }

        setIsTyping(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleAddToCart = (product) => {
        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });

        addMessage('bot', {
            type: 'text',
            message: `✅ **${product.name}** has been added to your cart!\n\nWould you like to:\n• Continue shopping\n• View your cart\n• Proceed to checkout`
        });
    };

    const handleQuickAction = async (action) => {
        setInputValue('');
        addMessage('user', { type: 'text', message: action });

        setIsTyping(true);
        const response = await processMessage(action);
        addMessage('bot', response);
        setIsTyping(false);
    };

    const renderMessageContent = (content) => {
        switch (content.type) {
            case 'text':
            case 'file':
                return (
                    <div className="message-text">
                        {content.message.split('\n').map((line, i) => (
                            <p key={i}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                        ))}
                    </div>
                );

            case 'products':
                return (
                    <div className="message-products">
                        <p className="products-intro">{content.message}</p>
                        <div className="product-cards">
                            {(content.products || []).map(product => (
                                <div key={product.id} className="product-card">
                                    <div className="product-info">
                                        <span className="product-name">{product.name}</span>
                                        <span className="product-price">₹{product.price}</span>
                                    </div>
                                    <button
                                        className="add-to-cart-btn"
                                        onClick={() => handleAddToCart(product)}
                                    >
                                        <ShoppingCart size={14} />
                                        Add
                                    </button>
                                </div>
                            ))}
                        </div>
                        {content.disclaimer && (
                            <p className="product-disclaimer">{content.disclaimer}</p>
                        )}
                    </div>
                );

            case 'branches':
                return (
                    <div className="message-branches">
                        <p className="branches-intro">{content.message?.split('\n')[0]}</p>
                        <div className="branch-cards">
                            {(content.branches || []).map(branch => (
                                <div key={branch.id} className="branch-card">
                                    <MapPin size={16} className="branch-icon" />
                                    <div className="branch-info">
                                        <span className="branch-name">{branch.name}</span>
                                        <span className="branch-address">{branch.address}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'order_status':
                return (
                    <div className="message-order">
                        <div className="order-card">
                            <div className="order-header">
                                <span className="order-id">Order #{content.order.id}</span>
                                <span className={`order-status status-${(content.order?.status || 'pending').toLowerCase().replace(' ', '-')}`}>
                                    {content.order?.status || 'Pending'}
                                </span>
                            </div>
                            <div className="order-details">
                                <p>📦 Items: {content.order.items}</p>
                                <p>💰 Total: ₹{content.order.total}</p>
                                <p>🕐 Estimated: {content.order.estimatedDelivery}</p>
                            </div>
                        </div>
                    </div>
                );

            default:
                return <p>{JSON.stringify(content)}</p>;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="chat-window">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-header-info">
                    <div className="chat-logo">
                        <span className="logo-icon">💊</span>
                    </div>
                    <div className="chat-title">
                        <h4>New Balan Assistant</h4>
                        <span className="chat-status">Online</span>
                    </div>
                </div>
                <button className="chat-close" onClick={onClose} aria-label="Close chat">
                    <X size={20} />
                </button>
            </div>

            {/* Medical Disclaimer Banner */}
            <div className="medical-disclaimer">
                ⚠️ I cannot diagnose or prescribe. Please consult a doctor.
            </div>

            {/* Messages */}
            <div className="chat-messages">
                {messages.map(msg => (
                    <div key={msg.id} className={`message ${msg.type}`}>
                        {msg.type === 'bot' && (
                            <div className="bot-avatar">🤖</div>
                        )}
                        <div className="message-bubble">
                            {renderMessageContent(msg.content)}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="message bot">
                        <div className="bot-avatar">🤖</div>
                        <div className="message-bubble typing">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <button onClick={() => handleQuickAction('fever medicines')}>
                    🤒 Fever
                </button>
                <button onClick={() => handleQuickAction('cold medicines')}>
                    🤧 Cold
                </button>
                <button onClick={() => handleQuickAction('shop timings')}>
                    🕐 Timings
                </button>
                <button onClick={() => handleQuickAction('prescription upload')}>
                    📋 Prescription
                </button>
                <button onClick={() => { onClose(); setIsCartOpen(true); }} className="cart-action">
                    🛒 View Cart {cart.length > 0 && `(${cart.length})`}
                </button>
            </div>

            {/* Input Area */}
            <div className="chat-input-area">
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    aria-label="Send message"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;
