/**
 * OmniSupport Knowledge Base Dataset
 * Contains intents, categories, training phrases, regex patterns, entity templates, and dynamic response generators.
 */

const DEFAULT_KNOWLEDGE_BASE = [
  {
    id: "greeting",
    name: "Greeting & Small Talk",
    category: "General",
    phrases: [
      "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
      "greetings", "hey there", "howdy", "hi customer service", "is anyone there"
    ],
    keywords: ["hi", "hello", "hey", "greetings"],
    regexPatterns: [/\b(hi|hello|hey|greetings|howdy)\b/i],
    response: "Hello! 👋 Welcome to OmniSupport Customer Service. How can I assist you today? Feel free to ask about order status, refunds, password resets, or store policies!",
    quickReplies: ["Where is my order?", "How to get a refund?", "Store working hours", "Reset password"]
  },
  {
    id: "order_tracking",
    name: "Order Tracking & Status",
    category: "Shipping",
    phrases: [
      "where is my order", "track my package", "order status", "when will my order arrive",
      "shipping status", "where is my package", "check order status", "track package",
      "delivery timeline", "has my order shipped yet", "track shipment", "where is order ORD-98234"
    ],
    keywords: ["order", "track", "package", "status", "shipment", "delivery", "shipped", "arrived", "where"],
    regexPatterns: [
      /\b(where|track|status|when|check|shipment)\b.*?\b(order|package|delivery|item|parcel)\b/i,
      /\bORD-\d{5,8}\b/i
    ],
    response: (entities) => {
      if (entities.orderId) {
        return `📦 **Order Tracking Details for #${entities.orderId}**:\n\n- **Status**: In Transit 🚚\n- **Carrier**: Express Courier (TRK-8849201)\n- **Estimated Delivery**: Tomorrow by 5:00 PM\n- **Current Location**: Regional Distribution Hub\n\nWould you like me to send live SMS updates to your mobile number?`;
      }
      return "📦 I can certainly help you track your order! Please enter your **Order ID** (e.g. `ORD-98234` or `ORD-55102`) or provide your registered email address.";
    },
    contextRequired: false,
    setContext: "awaiting_order_id",
    quickReplies: ["Check ORD-98234", "Check ORD-55102", "I don't have my Order ID"]
  },
  {
    id: "refund_policy",
    name: "Refund & Cancellation Policy",
    category: "Billing",
    phrases: [
      "how to get a refund", "refund policy", "i want a refund", "money back guarantee",
      "cancel my order and refund", "request refund", "how long do refunds take",
      "return money", "credited back to my account", "cancel transaction"
    ],
    keywords: ["refund", "money", "cancel", "cancellation", "reimbursement", "credit", "return"],
    regexPatterns: [/\b(refund|money back|cancel order|reimburse)\b/i],
    response: "💳 **Refund Policy & Process**:\n\n1. **Full Refunds**: Eligible within 30 days of purchase for unused items in original packaging.\n2. **Processing Time**: Once approved, refunds are processed back to your original payment method within **3-5 business days**.\n3. **Cancellations**: Orders can be canceled before shipment directly under *My Account > Orders*.\n\nWould you like to initiate a refund request for a specific order now?",
    quickReplies: ["Start Refund Request", "Check Refund Status", "Cancel an Active Order"]
  },
  {
    id: "password_reset",
    name: "Account Security & Password Reset",
    category: "Account",
    phrases: [
      "i forgot my password", "reset password", "cannot login to my account",
      "account locked", "change password", "trouble logging in", "forgot passcode",
      "unlock account", "update login details", "password link not working"
    ],
    keywords: ["password", "reset", "login", "account", "forgot", "locked", "passcode", "signin"],
    regexPatterns: [/\b(forgot|reset|change|unlock|login)\b.*?\b(password|account|passcode|credentials)\b/i],
    response: "🔐 **Account Security & Password Reset Steps**:\n\n1. Go to the [Login Page](#) and click **'Forgot Password?'**.\n2. Enter your registered email address.\n3. Check your inbox for a secure 6-digit reset link (expires in 15 mins).\n4. If your account is locked due to multiple attempts, it automatically unlocks after **30 minutes**.\n\nWould you like me to send a password reset link to your email now?",
    quickReplies: ["Send Password Reset Link", "Update Account Email", "Talk to Security Team"]
  },
  {
    id: "shipping_address_change",
    name: "Change Shipping Address",
    category: "Shipping",
    phrases: [
      "change shipping address", "update delivery location", "wrong address on order",
      "deliver to a different address", "modify destination", "wrong zip code",
      "update delivery address", "sent to wrong place"
    ],
    keywords: ["address", "shipping", "delivery", "location", "change", "update", "wrong", "destination"],
    regexPatterns: [/\b(change|update|wrong|modify)\b.*?\b(address|location|zip|street)\b/i],
    response: "🚚 **Updating Shipping Address**:\n\n- If your order **has NOT shipped yet**, we can immediately update your delivery address!\n- Please provide your **Order ID** and the **new shipping address** below.\n- *Note*: If the package is already with the courier, we will issue a reroute request.",
    quickReplies: ["Update Address for ORD-98234", "Check Shipping Status First"]
  },
  {
    id: "damaged_item",
    name: "Damaged or Defective Item",
    category: "Technical",
    phrases: [
      "my item arrived damaged", "broken product", "received wrong item",
      "defective product", "package was torn and broken", "faulty item",
      "missing items in order", "product doesn't work", "damaged package"
    ],
    keywords: ["damaged", "broken", "defective", "faulty", "wrong", "missing", "torn", "ruined"],
    regexPatterns: [/\b(damaged|broken|defective|faulty|wrong item|missing)\b/i],
    response: "⚠️ **We are so sorry to hear that!** We take product quality very seriously.\n\nWe will issue a **free instant replacement** or **100% full refund** immediately:\n1. Upload a quick photo of the damaged package/item.\n2. We will dispatch a new item with Priority Express shipping at zero cost to you.\n\nWould you prefer a **replacement** or a **full refund**?",
    quickReplies: ["Request Replacement", "Request Full Refund", "Upload Photo Evidence"]
  },
  {
    id: "business_hours",
    name: "Business Hours & Locations",
    category: "General",
    phrases: [
      "what are your business hours", "when are you open", "store opening hours",
      "customer support operating hours", "weekend support hours", "office locations",
      "are you open today", "support phone line hours"
    ],
    keywords: ["hours", "open", "timing", "weekend", "schedule", "operating", "locations", "close"],
    regexPatterns: [/\b(hours|open|opening|timing|operating|schedule)\b/i],
    response: "🕒 **Business Hours & Customer Care Schedule**:\n\n- **Online AI Support**: 24/7 (Always Available!)\n- **Live Agent Chat**: Monday – Friday (8:00 AM – 9:00 PM EST)\n- **Phone Support**: Saturday – Sunday (9:00 AM – 6:00 PM EST)\n- **Headquarters Location**: 500 Tech Plaza, New York, NY 10001",
    quickReplies: ["Call Customer Support", "Email Support Team"]
  },
  {
    id: "human_escalation",
    name: "Escalate to Human Agent",
    category: "General",
    phrases: [
      "talk to a human", "speak to representative", "human agent", "real person",
      "customer service agent", "manager", "connect to agent", "call customer service",
      "i want a human", "transfer me to support representative"
    ],
    keywords: ["human", "representative", "agent", "person", "manager", "support", "escalate", "speak", "talk", "call"],
    regexPatterns: [/\b(talk|speak|connect|transfer)\b.*?\b(human|agent|person|representative|manager)\b/i],
    response: "🎧 **Connecting you to a Live Human Representative...**\n\nI am transferring your conversation context, chat history, and account details to senior representative **Sarah M.**\n\n- **Estimated Wait Time**: < 1 minute ⚡\n- **Ticket Reference ID**: `#TK-99214`\n\nPlease stay on this chat window!",
    quickReplies: ["Cancel Escalation", "View Ticket Status"]
  },
  {
    id: "thanks_farewell",
    name: "Gratitude & Goodbye",
    category: "General",
    phrases: [
      "thank you", "thanks a lot", "thank you so much", "awesome thank you",
      "goodbye", "bye", "see you later", "that helped a lot", "great service"
    ],
    keywords: ["thank", "thanks", "goodbye", "bye", "awesome", "great", "helpful"],
    regexPatterns: [/\b(thank|thanks|goodbye|bye|great|awesome)\b/i],
    response: "😊 You're very welcome! It was a pleasure helping you. If you ever have more questions, I'm always right here 24/7. Have a wonderful day!",
    quickReplies: ["Rate Response ⭐⭐⭐⭐⭐", "Ask another question"]
  }
];

// Stopwords list for NLP text normalization
const ENGLISH_STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can",
  "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
  "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having",
  "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how",
  "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself",
  "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once",
  "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
  "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the",
  "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll",
  "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
  "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's",
  "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
  "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
]);

// Frustration / Sentiment Lexicon
const SENTIMENT_LEXICON = {
  positive: ["thanks", "thank", "awesome", "great", "excellent", "love", "good", "helpful", "amazing", "wonderful", "perfect", "superb"],
  negative: ["terrible", "bad", "horrible", "worst", "angry", "frustrated", "scam", "broken", "unacceptable", "useless", "hate", "stolen", "late", "delayed", "fail", "furious"]
};
