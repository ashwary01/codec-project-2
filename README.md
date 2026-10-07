# 🤖 OmniSupport AI — Customer Service NLP Chatbot & Studio

> An interactive, rule-based and TF-IDF vector-space NLP customer service chatbot featuring real-time intent visualizer, entity extraction, sentiment detection, knowledge base editor, and interactive NLP lab.

---

## 🌟 Key Features

### 1. 🧠 Dual Engine NLP Architecture
- **Hybrid Engine**: Combines keyword pattern matching with Term Frequency-Inverse Document Frequency (TF-IDF) vector space similarity.
- **TF-IDF Cosine Similarity Engine**: Preprocesses user queries and computes Cosine Similarity against intent training vectors:
  $$\text{Cosine Similarity} = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|}$$
- **Rule-Based Pattern Matcher**: RegEx rules + keyword synonym lists for instant pattern matching.

### 2. 🔬 Real-Time NLP Inspector & Diagnostics
- **Preprocessing Pipeline**: Live step-by-step breakdown:
  $$\text{Raw Input} \xrightarrow{} \text{Normalized Tokens} \xrightarrow{} \text{Stopwords Stripped} \xrightarrow{} \text{Porter Stemmer Roots}$$
- **Named Entity Recognition (NER)**: Auto-extracts Order IDs (e.g., `ORD-98234`), Email addresses, Dates, Dollar amounts, and Phone numbers.
- **Sentiment Analysis**: Tracks customer emotion (Positive, Neutral, Frustrated/Negative) and automatically triggers agent escalation if frustration is high.
- **Intent Confidence Matrix**: Live ranked matrix displaying match percentages across all Knowledge Base intents.

### 3. 💬 Interactive Messaging & Voice Support
- **Voice Input (Speech-to-Text)**: Integration with Web Speech Recognition API.
- **Voice Response (Text-to-Speech)**: Synthesizes bot responses into spoken audio using Speech Synthesis API.
- **Multi-Turn Context State**: Remembers dialogue slots across turns (e.g. prompting for missing Order ID and fulfilling tracking details upon entry).
- **Smooth Auto-Scroll**: Fixed layout grid container with smooth scrolling message display.

### 4. 🛠️ Knowledge Base Studio (CRUD Editor)
- **Custom Intents**: Add, edit, or delete intent definitions, category tags, sample phrases, and automated responses.
- **Confidence Threshold Slider**: Adjust minimum match threshold (default 35%) to trigger fallbacks.
- **Import / Export**: Save and export full Knowledge Base datasets as JSON.

### 5. 🧪 Interactive NLP Sandbox & Analytics
- **Sentence Similarity Calculator**: Compare any two sentences and observe real-time Cosine Similarity and Jaccard Index scores.
- **Porter Stemmer Tester**: Test word stemming rules (e.g. *shipping* $\rightarrow$ *ship*, *refunded* $\rightarrow$ *refund*).
- **Session Analytics**: Visual bar charts and doughnut charts tracking accuracy rates, query volume, sentiment trends, and intent distributions.
- **Embed Widget Generator**: Customize and copy zero-dependency HTML/JS widget code snippet for website deployment.

---

## 📁 Repository Structure

```
codec-project-2/
├── index.html            # Main HTML layout, visualizer, chat view, studio drawer & modals
├── styles.css            # Dark/light theme design system, glassmorphism, responsive grid layout
├── README.md             # Project documentation & usage guide
├── .gitignore            # Git ignore configuration
└── js/
    ├── app.js            # UI Controller, speech engines, real-time inspector sync & auto-scroll
    ├── nlp_engine.js     # Porter Stemmer, Tokenizer, Stopwords, TF-IDF, Cosine/Jaccard, NER & Sentiment
    └── knowledge_base.js # Preloaded FAQ & intent dataset across Shipping, Billing, Security, etc.
```

---

## 🚀 Quick Start / How to Run Locally

Since OmniSupport AI is built with vanilla web standards, no complex build tools or dependencies are required.

### Method 1: Local HTTP Server (Python)
```bash
# Clone the repository
git clone https://github.com/ashwary01/codec-project-2.git
cd codec-project-2

# Start a local Python server
python -m http.server 8086
```
Open **`http://localhost:8086`** in any web browser.

### Method 2: Node / Serve / Live Server
```bash
npx serve .
```

---

## 🔬 How the NLP Pipeline Works

1. **Text Normalization**: Strips punctuation, numbers, and converts all characters to lowercase.
2. **Stopword Removal**: Filters out non-informative English stopwords (*"is"*, *"the"*, *"a"*, *"at"*).
3. **Porter Stemming**: Suffix removal rules reduce words to root stems (*"tracking"* $\rightarrow$ *"track"*, *"refunds"* $\rightarrow$ *"refund"*).
4. **Vector Model & Cosine Math**: Builds Term Frequency maps and calculates vector alignment against intent definitions.
5. **Entity & Sentiment Extraction**: Regex parsers capture structured data slots while sentiment terms compute customer sentiment scores.

---

## 📄 License

Distributed under the MIT License. Feel free to use and modify for personal or commercial projects.
