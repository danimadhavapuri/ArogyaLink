import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Languages, 
  MessageSquare, 
  Flag, 
  Send, 
  ShieldCheck, 
  Check, 
  HelpCircle, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function AiSummaryCard({ order }) {
  const [selectedLang, setSelectedLang] = useState('te'); // Default to Telugu for Coastal AP
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [allLanguages, setAllLanguages] = useState([]);

  // Regional Translation State
  const [translatedText, setTranslatedText] = useState(null);
  const [translating, setTranslating] = useState(false);

  // In-App Doubt Chat State
  const [question, setQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState(null);
  const [asking, setAsking] = useState(false);

  // Flagging Modal State
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('Unclear medical explanation');
  const [flagComment, setFlagComment] = useState('');
  const [flagSubmitted, setFlagSubmitted] = useState(false);

  // Fetch summary and languages on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
                // Fetch core summary
        const oid = order?.orderId || order?.id;
        const sumRes = await fetch(`/api/reports/${oid}/summary`);
        const sumJson = await sumRes.json();
        if (sumJson.success) {
          // Accept both sumJson.data and sumJson.summary
          const payload = sumJson.data || sumJson;
          setSummaryData(payload);
        }

        // Fetch 26+ languages list
        const langRes = await fetch('/api/languages');
        const langJson = await langRes.json();
        if (langJson.success) {
          setAllLanguages(langJson.languages);
        }
      } catch (err) {
        console.error('Failed to load summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [order?.orderId, order?.id]);

  // Handle language switch
  const handleLanguageChange = async (langCode) => {
    setSelectedLang(langCode);
    setTranslatedText(null);

    // If it's outside core en/te/hi, call translation API
    if (langCode !== 'en' && langCode !== 'te' && langCode !== 'hi') {
      setTranslating(true);
      try {
        const oid = order?.orderId || order?.id;
        const res = await fetch(`/api/reports/${oid}/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetLanguage: langCode })
        });
        const json = await res.json();
        if (json.success) {
          setTranslatedText(json.data.translatedText);
        }
      } catch (err) {
        console.error('Translation failed:', err);
      } finally {
        setTranslating(false);
      }
    }
  };

  // Handle patient asking a question
  const handleAskDoubt = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setAsking(true);
    try {
      const oid = order?.orderId || order?.id;
      const res = await fetch(`/api/reports/${oid}/ask-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          language: selectedLang
        })
      });
      const json = await res.json();
      if (json.success) {
        setChatAnswer(json.data.answer);
      }
    } catch (err) {
      console.error('Doubt request failed:', err);
    } finally {
      setAsking(false);
    }
  };

  // Handle patient flagging summary
  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    try {
      const oid = order?.orderId || order?.id;
      const res = await fetch(`/api/reports/${oid}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: flagReason,
          patientComment: flagComment
        })
      });
      const json = await res.json();
      if (json.success) {
        setFlagSubmitted(true);
        setTimeout(() => {
          setShowFlagModal(false);
          setFlagSubmitted(false);
        }, 2500);
      }
    } catch (err) {
      console.error('Flag submission failed:', err);
    }
  };

  // If Critical (Farzana Begum Potassium 6.8), AI summary is suppressed
  if (order.isCritical || (summaryData && summaryData.isCritical)) {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-center text-xs text-slate-500 no-print">
        <ShieldCheck className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
        <span>Plain-language AI summary is <strong>suppressed by clinical rule</strong> for critical panic results. Please refer to your physician.</span>
      </div>
    );
  }

    // Get current active explanation text
  let currentSummaryText = '';
  if (translatedText) {
    currentSummaryText = translatedText;
  } else if (summaryData) {
    const sumObj = summaryData.summary || summaryData;
    currentSummaryText = sumObj[selectedLang] || sumObj.en || sumObj.te;
  }

  return (
    <div className="bg-white/95 backdrop-blur-md border border-teal-200/90 shadow-md rounded-2xl p-5 sm:p-7 space-y-6 no-print glow-teal">
      {/* Header with Bilingual Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-100/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
              ArogyaLink Plain-Language Assistant
              <span className="text-[11px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-medium">
                AI + Clinical Rules
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Simple explanations in Coastal AP languages for patients and families
            </p>
          </div>
        </div>

        {/* Quick Language Toggle Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => handleLanguageChange('te')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedLang === 'te'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            తెలుగు (Telugu)
          </button>
          <button
            onClick={() => handleLanguageChange('tenglish')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedLang === 'tenglish'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tenglish
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedLang === 'en'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            English
          </button>
          <button
            onClick={() => handleLanguageChange('hi')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              selectedLang === 'hi'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>

      {/* 26+ Indian Languages Dropdown */}
      <div className="flex items-center justify-between text-xs bg-white/80 p-2.5 rounded-xl border border-teal-100">
        <span className="text-slate-600 font-medium flex items-center gap-1.5">
          <Languages className="w-4 h-4 text-teal-600" />
          More Regional Languages & Dialects:
        </span>
        <select
          value={selectedLang}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1 font-medium outline-none focus:border-teal-500 cursor-pointer"
        >
          {allLanguages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name} {l.type === 'Bilingual Mix' ? '• (Mix)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* The Active Summary Card */}
      <div className="bg-white rounded-xl border border-teal-100 p-5 shadow-xs">
        {loading || translating ? (
          <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <RefreshCw className="w-4 h-4 text-teal-600 animate-spin" />
            <span>Adapting explanation in your requested language...</span>
          </div>
        ) : (
          <div>
            <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
              {currentSummaryText || 'Summary is being validated.'}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                Verified Clinical Guidance • Disclaimers Apply
              </span>
              <button
                onClick={() => setShowFlagModal(true)}
                className="text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Flag className="w-3 h-3" />
                <span>Flag this summary if unclear</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* In-App Patient Doubt Chat */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
          <MessageSquare className="w-4 h-4 text-teal-600" />
          <span>Have a question about this report? Ask our Clinical Assistant</span>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Ask in English, Telugu, or Tenglish (e.g. <em>"What food should I eat?"</em> or <em>"Is this dangerous?"</em>)
        </p>

        <form onSubmit={handleAskDoubt} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:border-teal-500 outline-none"
          />
          <button
            type="submit"
            disabled={asking || !question.trim()}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {asking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Ask</span>
          </button>
        </form>

        {/* Instant In-App Answer Box */}
        {chatAnswer && (
          <div className="mt-3.5 bg-teal-50/70 border border-teal-200 rounded-xl p-3.5 text-xs text-slate-800 space-y-1">
            <span className="font-bold text-teal-800 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-teal-600" />
              Assistant Response:
            </span>
            <p className="leading-relaxed">{chatAnswer}</p>
          </div>
        )}
      </div>

      {/* Patient Flagging Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Flag className="w-4 h-4 text-rose-600" />
              Flag Summary for Pathologist Review
            </h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Our Chief Pathologist audits 50 summaries every week. Tell us what was confusing or incorrect.
            </p>

            {flagSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-center text-xs space-y-1">
                <Check className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="font-bold">Flag Logged Successfully!</p>
                <p className="text-slate-600">This record has been submitted to the Pathologist Weekly Review Queue.</p>
              </div>
            ) : (
              <form onSubmit={handleFlagSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Flagging</label>
                  <select
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none"
                  >
                    <option value="Unclear medical explanation">Explanation is too complicated</option>
                    <option value="Translation inaccurate">Telugu/Regional translation is inaccurate</option>
                    <option value="Contradicts doctor advice">Contradicts advice given by my doctor</option>
                    <option value="Other">Other feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Comments</label>
                  <textarea
                    rows={3}
                    value={flagComment}
                    onChange={(e) => setFlagComment(e.target.value)}
                    placeholder="Provide any additional details..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFlagModal(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Submit Flag
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}