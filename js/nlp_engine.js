/**
 * OmniSupport NLP Engine Module
 * Implements Tokenization, Porter Stemmer, Stopwords Filtering,
 * TF-IDF Vectorization, Cosine & Jaccard Similarity, NER, and Sentiment Analysis.
 */

class NLPEngine {
  constructor(knowledgeBase = DEFAULT_KNOWLEDGE_BASE) {
    this.knowledgeBase = knowledgeBase;
    this.confidenceThreshold = 0.35; // default 35%
  }

  setKnowledgeBase(kb) {
    this.knowledgeBase = kb;
  }

  setConfidenceThreshold(val) {
    this.confidenceThreshold = parseFloat(val);
  }

  /**
   * Porter Stemmer Algorithm (Simplified JS Implementation)
   */
  stemWord(word) {
    if (!word || word.length <= 2) return word;
    let w = word.toLowerCase();

    // Step 1a
    if (w.endsWith("sses")) w = w.slice(0, -2);
    else if (w.endsWith("ies")) w = w.slice(0, -2);
    else if (w.endsWith("ss")) w = w;
    else if (w.endsWith("s") && !w.endsWith("us") && !w.endsWith("is")) w = w.slice(0, -1);

    // Step 1b: -ing, -ed
    if (w.endsWith("eed")) {
      if (w.length > 4) w = w.slice(0, -1);
    } else if ((w.endsWith("ed") && w.length > 3) || (w.endsWith("ing") && w.length > 4)) {
      if (w.endsWith("ed")) w = w.slice(0, -2);
      else if (w.endsWith("ing")) w = w.slice(0, -3);

      if (w.endsWith("at") || w.endsWith("bl") || w.endsWith("iz")) {
        w += "e";
      } else if (w.length >= 2 && w[w.length - 1] === w[w.length - 2] && !["l", "s", "z"].includes(w[w.length - 1])) {
        w = w.slice(0, -1);
      }
    }

    // Step 2 & 3: common suffixes
    const suffixes = [
      ["ational", "ate"], ["tional", "tion"], ["enci", "ence"], ["anci", "ance"],
      ["izer", "ize"], ["bli", "ble"], ["alli", "al"], ["entli", "ent"],
      ["eli", "e"], ["ousli", "ous"], ["ization", "ize"], ["ation", "ate"],
      ["ator", "ate"], ["alism", "al"], ["iveness", "ive"], ["fulness", "ful"],
      ["ousness", "ous"], ["aliti", "al"], ["iviti", "ive"], ["biliti", "ble"],
      ["ment", ""], ["ness", ""]
    ];

    for (const [sfx, repl] of suffixes) {
      if (w.endsWith(sfx) && w.length - sfx.length > 2) {
        w = w.slice(0, -sfx.length) + repl;
        break;
      }
    }

    return w;
  }

  /**
   * Complete Preprocessing Pipeline: Normalize -> Tokenize -> Stopwords -> Stem
   */
  preprocess(text) {
    if (!text || typeof text !== "string") {
      return { raw: "", tokens: [], cleanTokens: [], stemmedTokens: [] };
    }

    // 1. Raw Text
    const raw = text.trim();

    // 2. Normalize & Tokenize (strip punctuation except alphanumeric and dashes)
    const normalized = raw.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
    const tokens = normalized.split(/\s+/).filter(t => t.length > 0);

    // 3. Remove Stopwords
    const cleanTokens = tokens.filter(t => !ENGLISH_STOPWORDS.has(t));

    // 4. Stem tokens
    const stemmedTokens = (cleanTokens.length > 0 ? cleanTokens : tokens).map(t => this.stemWord(t));

    return {
      raw,
      tokens,
      cleanTokens,
      stemmedTokens
    };
  }

  /**
   * Named Entity Recognition (NER) Extractor
   */
  extractEntities(text) {
    const entities = {
      orderId: null,
      email: null,
      date: null,
      amount: null,
      phone: null
    };

    if (!text) return entities;

    // Order ID (e.g. ORD-98234, #98234, ORD98234)
    const orderMatch = text.match(/\b(ORD-?\d{4,8}|#\d{4,8})\b/i);
    if (orderMatch) {
      entities.orderId = orderMatch[0].toUpperCase().replace("#", "ORD-");
    }

    // Email
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      entities.email = emailMatch[0].toLowerCase();
    }

    // Date / Timeline
    const dateMatch = text.match(/\b(today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2}\/\d{2,4})\b/i);
    if (dateMatch) {
      entities.date = dateMatch[0].toLowerCase();
    }

    // Dollar Amount
    const amountMatch = text.match(/\$\d+(\.\d{2})?/);
    if (amountMatch) {
      entities.amount = amountMatch[0];
    }

    // Phone Number
    const phoneMatch = text.match(/\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/);
    if (phoneMatch) {
      entities.phone = phoneMatch[0];
    }

    return entities;
  }

  /**
   * Sentiment Analysis (Lexicon Based)
   */
  analyzeSentiment(text) {
    const { cleanTokens } = this.preprocess(text);
    let score = 0;
    let posCount = 0;
    let negCount = 0;

    cleanTokens.forEach(token => {
      const stem = this.stemWord(token);
      if (SENTIMENT_LEXICON.positive.some(p => p.startsWith(stem) || stem.startsWith(p))) {
        posCount++;
        score += 1.0;
      }
      if (SENTIMENT_LEXICON.negative.some(n => n.startsWith(stem) || stem.startsWith(n))) {
        negCount++;
        score -= 1.2; // weighted heavier for frustration detection
      }
    });

    let tag = "Neutral";
    let cssClass = "neutral";
    let icon = "fa-meh";

    if (score >= 0.8) {
      tag = "Positive";
      cssClass = "positive";
      icon = "fa-smile";
    } else if (score <= -0.8) {
      tag = "Frustrated / Negative";
      cssClass = "negative";
      icon = "fa-frown";
    }

    return {
      score: parseFloat(score.toFixed(2)),
      posCount,
      negCount,
      tag,
      cssClass,
      icon
    };
  }

  /**
   * Calculate Cosine Similarity between two term frequency maps
   */
  calculateCosineSimilarity(vectorA, vectorB) {
    const allTerms = new Set([...Object.keys(vectorA), ...Object.keys(vectorB)]);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    allTerms.forEach(term => {
      const valA = vectorA[term] || 0;
      const valB = vectorB[term] || 0;

      dotProduct += valA * valB;
      normA += valA * valA;
      normB += valB * valB;
    });

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calculate Jaccard Similarity Index between two token arrays
   */
  calculateJaccardIndex(tokensA, tokensB) {
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    if (setA.size === 0 && setB.size === 0) return 0;

    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    return intersection.size / union.size;
  }

  /**
   * Build TF-IDF Term Weighting Map for an Intent
   */
  getIntentStemmedTokens(intent) {
    const allText = [
      intent.name,
      ...intent.phrases,
      ...(intent.keywords || [])
    ].join(" ");
    
    return this.preprocess(allText).stemmedTokens;
  }

  /**
   * Predict Intent & Match Scores across Knowledge Base
   */
  predictIntent(userQuery, mode = "hybrid") {
    const preprocessed = this.preprocess(userQuery);
    const entities = this.extractEntities(userQuery);
    const sentiment = this.analyzeSentiment(userQuery);
    const queryStems = preprocessed.stemmedTokens;

    // Count term frequencies for query
    const queryTF = {};
    queryStems.forEach(term => {
      queryTF[term] = (queryTF[term] || 0) + 1;
    });

    const intentScores = [];

    this.knowledgeBase.forEach(intent => {
      let score = 0;
      let matchedByRule = false;

      // 1. Check Regex / Keywords Rules
      if (mode === "rules" || mode === "hybrid") {
        if (intent.regexPatterns && intent.regexPatterns.some(regex => regex.test(userQuery))) {
          score += 0.65;
          matchedByRule = true;
        }

        // Keyword overlap boost
        if (intent.keywords && intent.keywords.length > 0) {
          const matchedKw = intent.keywords.filter(kw => {
            const kwStem = this.stemWord(kw);
            return queryStems.includes(kwStem) || userQuery.toLowerCase().includes(kw.toLowerCase());
          });
          if (matchedKw.length > 0) {
            score += 0.25 * (matchedKw.length / intent.keywords.length);
          }
        }
      }

      // 2. TF-IDF & Vector Cosine Similarity
      if (mode === "tfidf" || mode === "hybrid") {
        const intentStems = this.getIntentStemmedTokens(intent);
        const intentTF = {};
        intentStems.forEach(term => {
          intentTF[term] = (intentTF[term] || 0) + 1;
        });

        const cosineSim = this.calculateCosineSimilarity(queryTF, intentTF);
        const jaccardSim = this.calculateJaccardIndex(queryStems, intentStems);

        if (mode === "tfidf") {
          score = cosineSim * 0.8 + jaccardSim * 0.2;
        } else { // hybrid ensemble
          score = Math.max(score, cosineSim * 0.7 + jaccardSim * 0.2 + (matchedByRule ? 0.25 : 0));
        }
      }

      // Cap at 0.99 for display
      const confidence = Math.min(0.99, parseFloat(score.toFixed(2)));

      intentScores.push({
        intentId: intent.id,
        intentName: intent.name,
        category: intent.category,
        confidence: confidence,
        confidencePct: Math.round(confidence * 100),
        matchedByRule,
        intentObj: intent
      });
    });

    // Sort by confidence descending
    intentScores.sort((a, b) => b.confidence - a.confidence);

    const topMatch = intentScores[0];
    const isAboveThreshold = topMatch && topMatch.confidence >= this.confidenceThreshold;

    return {
      preprocessed,
      entities,
      sentiment,
      intentScores,
      topMatch: isAboveThreshold ? topMatch : null,
      rawTopMatch: topMatch,
      isFallback: !isAboveThreshold
    };
  }
}
