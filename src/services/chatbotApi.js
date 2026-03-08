// Chatbot API functions
// Handles chatbot intent detection, product search, and backend API integrations
// Order status and prescription upload use real backend APIs

import { apiGet, getAuthToken } from '../utils/apiClient';
import { buildApiUrl } from '../config/api';

// Shop information - UPDATED with actual contact info
const SHOP_INFO = {
    name: "New Balan Medical & Clinic",
    phone: "+91 9894880598",
    whatsapp: "+91 9894880598",
    branches: [
        { id: 1, name: "Main Branch - Anna Nagar", address: "123 Anna Nagar Main Road, Chennai - 600040", phone: "+91 9894880598" },
    ],
    orderTimings: "9:00 AM to 6:00 PM",
    shopTimings: "Monday to Saturday: 8:00 AM - 10:00 PM\nSunday: 9:00 AM - 6:00 PM",
    services: ["Pharmacy", "Clinic", "Lab Tests", "Insurance", "Home Delivery"]
};

// Get products from backend API
const getWebsiteProducts = async () => {
    try {
        const response = await apiGet('/medicines', {
            limit: 100,
            sort_by: 'name',
            sort_order: 'asc',
            is_active: true
        });
        return (response.items || []).map(med => ({
            id: med.id,
            name: med.name,
            category: med.schedule_type || 'OTC',
            price: med.min_price || 0,
            discount: 0,
            description: med.description || '',
            requiresPrescription: med.is_prescription_required || false,
            stock: med.is_active !== false,
        }));
    } catch (error) {
        console.warn('Failed to fetch products for chatbot:', error);
        return [];
    }
};

// Categorize products from website
const categorizeProducts = async () => {
    const products = await getWebsiteProducts();
    const categories = {
        otc: products.filter(p => p.category === 'OTC'),
        prescription: products.filter(p => p.category === 'Prescription'),
        wellness: products.filter(p => p.category === 'Wellness'),
        dailyCare: products.filter(p => p.category === 'Daily Care'),
    };
    return categories;
};

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Search products from the website data
 */
export const searchProducts = async (searchTerm) => {
    const products = await getWebsiteProducts();
    const lowerSearch = searchTerm.toLowerCase();

    return products.filter(p =>
        p.name.toLowerCase().includes(lowerSearch) ||
        p.category.toLowerCase().includes(lowerSearch) ||
        p.description.toLowerCase().includes(lowerSearch)
    );
};

/**
 * Get product availability 
 */
export const getProductAvailability = async (productName) => {
    await delay(500);

    const products = await getWebsiteProducts();
    const found = products.filter(p =>
        p.name.toLowerCase().includes(productName.toLowerCase())
    );

    if (found.length > 0) {
        return {
            success: true,
            products: found.map(p => ({
                ...p,
                availability: p.stock ? "In Stock ✅" : "Out of Stock ❌"
            }))
        };
    }

    return {
        success: false,
        message: `Sorry, we couldn't find "${productName}". Please visit our pharmacy page to see available products.`
    };
};

/**
 * Upload prescription image to real backend API
 */
export const uploadPrescription = async (file) => {
    const token = getAuthToken();

    if (!token) {
        return {
            success: false,
            message: `Please log in to upload a prescription.\n\n📞 Or send it via WhatsApp: ${SHOP_INFO.phone}`
        };
    }

    try {
        const formData = new FormData();
        formData.append('file', file);

        // Use fetch directly instead of apiRequest so the browser can set
        // the correct Content-Type with the multipart boundary automatically.
        // apiRequest forces Content-Type: application/json which breaks FormData.
        const url = buildApiUrl('/prescriptions/upload');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
            throw new Error(errorData.detail || errorData.message || 'Upload failed');
        }

        const data = await response.json();

        const prescriptionId = data.id || data.prescription_id || 'N/A';
        const status = data.status || 'Pending Review';

        return {
            success: true,
            referenceId: prescriptionId,
            message: `Prescription uploaded successfully! 📋\n\n` +
                `**Prescription ID**: ${prescriptionId}\n` +
                `**Status**: ${status}\n\n` +
                `Our pharmacist will review it and contact you.\n\n` +
                `📞 For queries, call/WhatsApp: ${SHOP_INFO.phone}\n` +
                `⏰ Order Timings: ${SHOP_INFO.orderTimings}`
        };
    } catch (error) {
        console.warn('Failed to upload prescription:', error);

        return {
            success: false,
            message: `Sorry, we couldn't upload your prescription. ${error.message || 'Please try again.'}\n\n📞 You can also send it via WhatsApp: ${SHOP_INFO.phone}\n⏰ Order Timings: ${SHOP_INFO.orderTimings}`
        };
    }
};

/**
 * Login/OTP support
 */
export const loginSupport = async (query) => {
    await delay(500);

    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('otp') && lowerQuery.includes('not')) {
        return {
            type: 'otp_issue',
            message: `If you're not receiving OTP:\n\n1. Check if your phone number is correct\n2. Wait 30 seconds before requesting again\n3. Check your SMS spam folder\n4. Ensure your phone has network signal\n\n📞 Need help? Call/WhatsApp: ${SHOP_INFO.phone}`
        };
    }

    if (lowerQuery.includes('forgot') || lowerQuery.includes('reset')) {
        return {
            type: 'password_reset',
            message: `To reset your password:\n\n1. Click 'Forgot Password' on the login page\n2. Enter your registered phone number\n3. Enter the OTP received\n4. Create a new password\n\n📞 Need help? Call/WhatsApp: ${SHOP_INFO.phone}`
        };
    }

    return {
        type: 'general',
        message: `For login assistance, please try:\n\n1. Use your registered phone number\n2. Request a new OTP\n3. Clear your browser cache\n\n📞 If issues persist, call/WhatsApp: ${SHOP_INFO.phone}`
    };
};

/**
 * Get order status from real backend API
 */
export const getOrderStatus = async (orderId) => {
    const token = getAuthToken();

    if (!token) {
        return {
            success: false,
            message: `Please log in to check your order status.\n\n📞 Or contact us directly:\nCall/WhatsApp: ${SHOP_INFO.phone}\n\n⏰ Order Timings: ${SHOP_INFO.orderTimings}`
        };
    }

    try {
        const order = await apiGet(`/orders/${orderId}`);

        const status = order.status || 'Unknown';
        const date = order.created_at
            ? new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'N/A';
        const amount = order.total_amount != null ? `₹${Number(order.total_amount).toFixed(2)}` : 'N/A';

        return {
            success: true,
            message: `📦 **Order #${orderId}**\n\n` +
                `**Status**: ${status}\n` +
                `**Date**: ${date}\n` +
                `**Amount**: ${amount}\n\n` +
                `📞 For queries, call/WhatsApp: ${SHOP_INFO.phone}\n` +
                `⏰ Order Timings: ${SHOP_INFO.orderTimings}`
        };
    } catch (error) {
        console.warn('Failed to fetch order status:', error);

        const errorMsg = error.message || '';
        if (errorMsg.includes('Session expired') || errorMsg.includes('401')) {
            return {
                success: false,
                message: `Your session has expired. Please log in again to check your order status.\n\n📞 Or contact us: ${SHOP_INFO.phone}`
            };
        }

        return {
            success: false,
            message: `Sorry, we couldn't find order #${orderId}. Please verify the Order ID and try again.\n\n📞 For help, call/WhatsApp: ${SHOP_INFO.phone}\n⏰ Order Timings: ${SHOP_INFO.orderTimings}`
        };
    }
};

/**
 * Intent patterns with scoring weights
 */
const INTENT_PATTERNS = {
    // Greetings
    greeting: {
        patterns: [
            /^hi\b/i, /^hello\b/i, /^hey\b/i, /^hii+/i,
            /^good\s*(morning|evening|afternoon|night)/i,
            /^namaskar/i, /^namaste/i, /^vanakkam/i
        ],
        priority: 100
    },

    // Thanks
    thanks: {
        patterns: [
            /\b(thank\s*you|thanks|thx|thanku)\b/i,
            /\b(appreciate|grateful)\b/i
        ],
        priority: 95
    },

    // Timings
    timings: {
        patterns: [
            /\b(timing|timings)\b/i,
            /\b(open|opening)\s*(time|hour)/i,
            /\b(close|closing)\s*(time|hour)/i,
            /\bwhat\s*time\b/i,
            /\bwhen\s*(do\s*you|are\s*you)\s*(open|close)/i,
            /\b(working|business)\s*hours?\b/i,
            /\bshop\s*hours?\b/i
        ],
        priority: 80
    },

    // Contact/Phone
    contact: {
        patterns: [
            /\b(contact|phone|call|number)\b/i,
            /\bwhatsapp\b/i,
            /\bhow\s*to\s*(contact|reach|call)/i,
            /\b(your|shop)\s*number\b/i
        ],
        priority: 85
    },

    // Address/Location
    address: {
        patterns: [
            /\b(address|location)\b/i,
            /\bwhere\s*(are\s*you|is\s*(the|your)\s*(shop|store|clinic))/i,
            /\b(branch|branches)\b/i,
            /\bhow\s*to\s*(reach|find|get\s*to)/i,
            /\b(directions?|navigate)\b/i,
            /\bnear\s*me\b/i
        ],
        priority: 80
    },

    // Prescription workflow
    prescription: {
        patterns: [
            /\bprescription\b/i,
            /\bupload\s*(prescription|rx|medicine\s*list)/i,
            /\bdoctor'?s?\s*(note|prescription)/i,
            /\bi\s*have\s*(a\s*)?prescription/i,
            /\bsubmit\s*(prescription|rx)/i
        ],
        priority: 85
    },

    // Products available / What do you have
    products_list: {
        patterns: [
            /\bwhat\s*(products?|medicines?|tablets?)\s*(do\s*you\s*)?(have|sell|available)/i,
            /\b(show|list|tell)\s*(me\s*)?(products?|medicines?|tablets?)/i,
            /\bavailable\s*(products?|medicines?|tablets?)/i,
            /\bproducts?\s*(list|available)/i,
            /\bwhat\s*all\s*(do\s*you\s*)?(have|sell)/i,
            /\bwhat\s*(is|are)\s*available/i
        ],
        priority: 85
    },

    // Fever
    fever: {
        patterns: [
            /\bfever\b/i,
            /\b(high\s*)?temperature\b/i,
            /\bparacetamol\b/i,
            /\bfever\s*(medicine|tablet|med)/i
        ],
        priority: 75
    },

    // Cold & Cough
    cold: {
        patterns: [
            /\bcold\b/i,
            /\b(cough|coughing)\b/i,
            /\bflu\b/i,
            /\bsneezing?\b/i,
            /\brunny\s*nose\b/i,
            /\bsore\s*throat\b/i,
            /\bcold\s*(medicine|tablet|syrup)/i
        ],
        priority: 75
    },

    // Pain/Headache
    pain: {
        patterns: [
            /\bheadache\b/i,
            /\b(body|muscle|joint|back|knee)\s*pain\b/i,
            /\bpain\s*relief\b/i,
            /\bibuprofen\b/i,
            /\bmigraine\b/i
        ],
        priority: 75
    },

    // Allergy
    allergy: {
        patterns: [
            /\ballergy\b/i,
            /\ballergic\b/i,
            /\bcetirizine\b/i,
            /\bitching\b/i,
            /\brash\b/i
        ],
        priority: 75
    },

    // Stomach/Acidity
    stomach: {
        patterns: [
            /\bstomach\s*(pain|ache|problem)/i,
            /\bacidity\b/i,
            /\bindigestion\b/i,
            /\bgas\s*(problem|relief)/i,
            /\bantacid\b/i,
            /\bheartburn\b/i
        ],
        priority: 75
    },

    // Wellness/Vitamins
    wellness: {
        patterns: [
            /\bvitamin\b/i,
            /\bcalcium\b/i,
            /\bsupplement\b/i,
            /\bimmunity\b/i,
            /\bwellness\b/i
        ],
        priority: 75
    },

    // Order inquiry
    order: {
        patterns: [
            /\border\s*(medicine|tablet|product)/i,
            /\bhow\s*to\s*(order|buy|purchase)/i,
            /\bplace\s*order/i,
            /\bcan\s*i\s*(order|buy)/i,
            /\bbuy\s*(online|medicine)/i
        ],
        priority: 80
    },

    // Order tracking
    track_order: {
        patterns: [
            /\b(track|tracking)\s*(my\s*)?(order|package)/i,
            /\border\s*status\b/i,
            /\bwhere\s*is\s*my\s*(order|package)/i
        ],
        priority: 80
    },

    // Delivery
    delivery: {
        patterns: [
            /\b(home\s*)?deliver(y|ies)?\b/i,
            /\bshipping\b/i,
            /\bdo\s*you\s*deliver\b/i,
            /\bdelivery\s*(charge|fee|time)/i
        ],
        priority: 70
    },

    // Payment
    payment: {
        patterns: [
            /\bpay(ment)?s?\b/i,
            /\b(credit|debit)\s*card\b/i,
            /\bupi\b/i,
            /\bcash\s*on\s*delivery\b/i,
            /\bcod\b/i
        ],
        priority: 70
    },

    // Login/Account
    login: {
        patterns: [
            /\blogin\s*(problem|issue|help)/i,
            /\bsign\s*in\b/i,
            /\botp\s*(not|issue|problem)/i,
            /\bforgot\s*password\b/i,
            /\breset\s*password\b/i,
            /\bcan'?t?\s*(login|sign\s*in)/i
        ],
        priority: 70
    },

    // Services
    services: {
        patterns: [
            /\bwhat\s*(do\s*you|services?)\s*(do|offer|provide)/i,
            /\b(your\s*)?services?\b/i,
            /\bwhat\s*can\s*you\s*(help|do)/i
        ],
        priority: 60
    },
    // --- WHO APPROVED HEALTH TOPICS ---
    health_diet: {
        patterns: [/\b(diet|nutrition|healthy\s*eating|food|salt|sugar)\b/i, /\bwhat\s*should\s*i\s*eat\b/i],
        priority: 70
    },
    health_exercise: {
        patterns: [/\b(exercise|physical\s*activity|walking|running|workout|fitness)\b/i, /\bhow\s*much\s*exercise\b/i],
        priority: 70
    },
    health_mental: {
        patterns: [/\b(mental\s*health|stress|anxiety|depression|sleep|insomnia)\b/i, /\bhow\s*to\s*reduce\s*stress\b/i],
        priority: 70
    },
    health_diabetes: {
        patterns: [/\b(diabetes|blood\s*sugar|insulin|diabetic)\b/i, /\bprevent\s*diabetes\b/i],
        priority: 70
    },
    health_heart: {
        patterns: [/\b(heart|blood\s*pressure|hypertension|cholesterol)\b/i, /\bheart\s*health\b/i],
        priority: 70
    },
    health_tobacco: {
        patterns: [/\b(smoking|tobacco|cigarettes?|quit\s*smoking|nicotine)\b/i],
        priority: 70
    },
    health_first_aid: {
        patterns: [/\b(first\s*aid|burn|cut|wound|injury|emergency|cpr)\b/i],
        priority: 70
    }
};

/**
 * Detect intent from message with priority scoring
 */
const detectIntent = (message) => {
    const lowerMessage = message.toLowerCase().trim();
    let bestMatch = null;
    let highestPriority = 0;

    for (const [intentName, intentData] of Object.entries(INTENT_PATTERNS)) {
        for (const pattern of intentData.patterns) {
            if (pattern.test(lowerMessage)) {
                if (intentData.priority > highestPriority) {
                    highestPriority = intentData.priority;
                    bestMatch = intentName;
                }
                break;
            }
        }
    }

    return bestMatch;
};

/**
 * Format products list for display (information only, no ordering)
 */
const formatProductsList = (products, title) => {
    if (!products || products.length === 0) {
        return {
            type: 'text',
            message: `Sorry, no products found in this category.\n\n📞 For specific medicines, please call/WhatsApp: ${SHOP_INFO.phone}\n⏰ Order Timings: ${SHOP_INFO.orderTimings}`
        };
    }

    let message = `${title}\n\n`;

    products.forEach(p => {
        const stockStatus = p.stock ? "✅ In Stock" : "❌ Out of Stock";
        const prescRequired = p.requiresPrescription ? "📋 Prescription Required" : "";
        const price = p.discount > 0
            ? `₹${p.price} (${p.discount}% off)`
            : `₹${p.price}`;

        message += `• **${p.name}** - ${price}\n  ${stockStatus} ${prescRequired}\n  ${p.description}\n\n`;
    });

    message += `───────────────────────\n`;
    message += `📞 **To Order**: Call/WhatsApp: ${SHOP_INFO.phone}\n`;
    message += `⏰ **Order Timings**: ${SHOP_INFO.orderTimings}\n\n`;
    message += `💡 Visit our [Pharmacy Page](/pharmacy) to browse all products!`;

    return {
        type: 'text',
        message
    };
};

/**
 * Generate response based on detected intent
 */
const generateResponse = async (intent, message) => {
    const categories = await categorizeProducts();
    const allProducts = await getWebsiteProducts();

    switch (intent) {
        case 'greeting':
            return {
                type: 'text',
                message: `Hello! 👋 Welcome to New Balan Medical & Clinic!\n\nI'm your virtual assistant. I can help you with:\n\n• 💊 Information about medicines available\n• 📋 Prescription upload\n• 📍 Store location & timings\n• 📞 Contact information\n\n📞 **Call/WhatsApp**: ${SHOP_INFO.phone}\n⏰ **Order Timings**: ${SHOP_INFO.orderTimings}\n\nHow can I help you today?`
            };

        case 'thanks':
            return {
                type: 'text',
                message: `You're welcome! 😊\n\nNeed anything else? Feel free to ask!\n\n📞 Call/WhatsApp: ${SHOP_INFO.phone}`
            };

        case 'contact':
            return {
                type: 'text',
                message: `📞 **Contact Us:**\n\n📱 **Phone/WhatsApp**: ${SHOP_INFO.phone}\n\nYou can call or WhatsApp us for:\n• Medicine enquiries\n• Order placement\n• Prescription upload\n• Order tracking\n\n⏰ **Order Timings**: ${SHOP_INFO.orderTimings}`
            };

        case 'timings':
            return {
                type: 'text',
                message: `🕐 **Shop Timings:**\n\n${SHOP_INFO.shopTimings}\n\n⏰ **Order Timings**: ${SHOP_INFO.orderTimings}\n\n📞 Call/WhatsApp: ${SHOP_INFO.phone}`
            };

        case 'address':
            return {
                type: 'text',
                message: `📍 **Our Location:**\n\n${SHOP_INFO.branches.map(b => `**${b.name}**\n${b.address}`).join('\n\n')}\n\n📞 Call/WhatsApp: ${SHOP_INFO.phone}\n⏰ Order Timings: ${SHOP_INFO.orderTimings}`
            };

        case 'prescription':
            return {
                type: 'prescription',
                message: `📋 **Prescription Upload**\n\nPlease upload a clear photo of your prescription using the upload button below.\n\nOur pharmacist will review it and contact you to confirm the order.\n\n📞 **Call/WhatsApp**: ${SHOP_INFO.phone}\n⏰ **Order Timings**: ${SHOP_INFO.orderTimings}\n\n⚠️ **Note**: I cannot diagnose or prescribe. Please consult a doctor.`,
                action: 'upload_prescription'
            };

        case 'products_list':
            return formatProductsList(allProducts, `💊 **Products Available at New Balan Medical:**`);

        case 'fever': {
            const feverProducts = allProducts.filter(p =>
                p.name.toLowerCase().includes('paracetamol') ||
                p.description.toLowerCase().includes('fever')
            );
            return formatProductsList(
                feverProducts.length > 0 ? feverProducts : categories.otc,
                `🤒 **Medicines for Fever:**`
            );
        }

        case 'cold': {
            const coldProducts = allProducts.filter(p =>
                p.name.toLowerCase().includes('cough') ||
                p.description.toLowerCase().includes('cough')
            );
            return formatProductsList(
                coldProducts.length > 0 ? coldProducts : categories.dailyCare,
                `🤧 **Medicines for Cold & Cough:**`
            );
        }

        case 'pain': {
            const painProducts = allProducts.filter(p =>
                p.name.toLowerCase().includes('ibuprofen') ||
                p.description.toLowerCase().includes('pain')
            );
            return formatProductsList(
                painProducts.length > 0 ? painProducts : categories.otc,
                `💆 **Pain Relief Medicines:**`
            );
        }

        case 'allergy': {
            const allergyProducts = allProducts.filter(p =>
                p.name.toLowerCase().includes('cetirizine') ||
                p.description.toLowerCase().includes('allergy')
            );
            return formatProductsList(
                allergyProducts.length > 0 ? allergyProducts : categories.otc,
                `🤧 **Allergy Relief Medicines:**`
            );
        }

        case 'stomach': {
            const stomachProducts = allProducts.filter(p =>
                p.name.toLowerCase().includes('antacid') ||
                p.description.toLowerCase().includes('acidity') ||
                p.description.toLowerCase().includes('gas')
            );
            return formatProductsList(
                stomachProducts.length > 0 ? stomachProducts : categories.dailyCare,
                `🩺 **Stomach & Digestion Products:**`
            );
        }

        case 'wellness':
            return formatProductsList(categories.wellness, `💪 **Wellness & Supplements:**`);

        case 'order':
            return {
                type: 'text',
                message: `📦 **How to Order:**\n\nTo place an order, please:\n\n1️⃣ **Call or WhatsApp**: ${SHOP_INFO.phone}\n2️⃣ Tell us your medicine requirements\n3️⃣ Share prescription if required\n4️⃣ Confirm delivery address\n\n⏰ **Order Timings**: ${SHOP_INFO.orderTimings}\n\n💡 You can also browse products on our [Pharmacy Page](/pharmacy) and then call us to order!`
            };

        case 'track_order':
            return {
                type: 'text',
                message: `📦 **Track Your Order:**\n\nTo track your order, please contact us:\n\n📞 **Call/WhatsApp**: ${SHOP_INFO.phone}\n\nHave your Order ID ready for faster assistance!\n\n⏰ Order Timings: ${SHOP_INFO.orderTimings}`
            };

        case 'delivery':
            return {
                type: 'text',
                message: `🚚 **Home Delivery:**\n\nYes, we offer home delivery!\n\n✅ Free delivery for orders above ₹500\n✅ ₹40 charge for smaller orders\n✅ Delivery within 2-4 hours in Chennai\n\n📞 **To Order**: Call/WhatsApp: ${SHOP_INFO.phone}\n⏰ **Order Timings**: ${SHOP_INFO.orderTimings}`
            };

        case 'payment':
            return {
                type: 'text',
                message: `💳 **Payment Options (Razorpay):**\n\n• 📱 UPI\n• 💳 Credit/Debit Cards\n• 🏦 Net Banking\n\n📞 Contact: ${SHOP_INFO.phone}\n⏰ Order Timings: ${SHOP_INFO.orderTimings}`
            };

        case 'login': {
            const loginHelp = await loginSupport(message);
            return {
                type: 'text',
                message: `🔐 **Login Help:**\n\n${loginHelp.message}`
            };
        }

        case 'services':
            return {
                type: 'text',
                message: `🏥 **Our Services:**\n\n${SHOP_INFO.services.map(s => `✅ ${s}`).join('\n')}\n\n📞 **Contact**: ${SHOP_INFO.phone}\n⏰ **Order Timings**: ${SHOP_INFO.orderTimings}\n\nHow can I help you today?`
            };

        // --- WHO APPROVED HEALTH TOPICS ---
        case 'health_diet':
            return {
                type: 'text',
                message: `🥗 **Healthy Diet (WHO Guidelines):**\n\n• **Eat a variety of foods**: Include fruits, vegetables, legumes, nuts, and whole grains.\n• **Reduce Salt**: Keep intake below 5g per day (about one teaspoon).\n• **Limit Sugar**: Reduce intake of free sugars throughout the life course.\n• **Reduce Fat**: Replace saturated fats with unsaturated fats where possible.\n\n⚠️ *This is general information. Consult our clinic for personalized nutrition advice.*`
            };

        case 'health_exercise':
            return {
                type: 'text',
                message: `🏃 **Physical Activity (WHO Guidelines):**\n\n• **Adults (18-64)**: Should do at least 150–300 minutes of moderate-intensity aerobic physical activity throughout the week.\n• **Strength**: Muscle-strengthening activities should be done 2 or more days a week.\n• **Limit Sedentary Time**: Replace sitting time with physical activity of any intensity.\n\n✨ *Every move counts for your health!*`
            };

        case 'health_mental':
            return {
                type: 'text',
                message: `🧠 **Mental Well-being:**\n\n• **Stay Connected**: Maintain relationships with family and friends.\n• **Manage Stress**: Practice mindfulness, deep breathing, or talk to someone you trust.\n• **Prioritize Sleep**: Aim for 7-9 hours of quality sleep daily.\n• **Limit News/Media**: If it causes you distress, take breaks.\n\n📞 *If you are feeling overwhelmed, please reach out to a mental health professional.*`
            };

        case 'health_diabetes':
            return {
                type: 'text',
                message: `🧪 **Diabetes Prevention & Care:**\n\n• **Maintain Weight**: Achieving and maintaining a healthy body weight is key.\n• **Be Active**: Regular exercise helps control blood sugar.\n• **Healthy Diet**: Avoid sugar and saturated fats.\n• **Avoid Tobacco**: Smoking increases the risk of diabetes and cardiovascular disease.\n\n🔬 *Visit our lab for a blood sugar screening (HbA1c).*`
            };

        case 'health_heart':
            return {
                type: 'text',
                message: `❤️ **Heart Health & Hypertension:**\n\n• **Monitor BP**: Get your blood pressure checked regularly.\n• **Eat Less Salt**: Reducing salt is the most effective way to lower BP.\n• **Fruit & Veg**: Eat at least 5 portions of fruit and veg daily.\n• **Limit Alcohol**: Reducing alcohol intake can improve heart health.\n\n💓 *We offer BP monitoring and ECG services at our clinic.*`
            };

        case 'health_tobacco':
            return {
                type: 'text',
                message: `🚭 **Quitting Tobacco:**\n\n• **Immediate Benefits**: Within 20 minutes, your heart rate drops.\n• **Long-term**: Quitting reduces risk of cancer, heart disease, and lung disease.\n• **Support Available**: Talk to our pharmacist about nicotine replacement therapies.\n\n💪 *It's never too late to quit!*`
            };

        case 'health_first_aid':
            return {
                type: 'text',
                message: `🩹 **Basic First Aid Tips:**\n\n• **Minor Cuts**: Clean with soap and water, apply pressure if bleeding, and use an antiseptic.\n• **Minor Burns**: Run cool (not cold) water over the area for 10-20 mins.\n• **Choking**: Encourage coughing. If blocked, seek emergency help immediately.\n\n🚨 **Emergencies**: For severe injuries, please visit the nearest hospital or call 108 immediately.`
            };

        default:
            return null;
    }
};

/**
 * Main message processor - detects intent and returns appropriate response
 */
export const processMessage = async (message) => {
    await delay(500);

    // Detect intent
    const intent = detectIntent(message);

    // Generate response based on intent
    if (intent) {
        const response = await generateResponse(intent, message);
        if (response) {
            return response;
        }
    }

    // Try to find products by name
    const foundProducts = await searchProducts(message);

    if (foundProducts.length > 0) {
        return formatProductsList(foundProducts, `🔍 **Products matching "${message}":**`);
    }

    // Default response with suggestions
    return {
        type: 'text',
        message: `I'm sorry, I didn't quite understand that. 🤔\n\nHere's what I can help you with:\n\n• 💊 **Medicines**: "what products do you have"\n• 🤒 **Fever**: "fever medicine"\n• 🤧 **Cold/Cough**: "cough syrup"\n• 📋 **Prescription**: "upload prescription"\n• 📍 **Location**: "where are you located"\n• 🕐 **Timings**: "shop timings"\n• 📦 **Order**: "how to order"\n\n📞 **Direct Contact**: ${SHOP_INFO.phone}\n⏰ **Order Timings**: ${SHOP_INFO.orderTimings}`
    };
};

/**
 * Get product recommendations by category
 */
export const getProductRecommendations = async (category) => {
    await delay(500);

    const products = await searchProducts(category);

    if (products.length > 0) {
        return { success: true, products };
    }

    return {
        success: false,
        message: `No products found for "${category}". Contact us: ${SHOP_INFO.phone}`
    };
};

export { SHOP_INFO };
