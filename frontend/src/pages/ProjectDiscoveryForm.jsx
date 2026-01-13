import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Check, User, Briefcase, Zap, Type, Send, ChevronUp, ChevronDown } from 'lucide-react';

// --- Configuration Data ---
const questions = [
  {
    id: 'welcome',
    type: 'statement',
    title: "Project Discovery",
    text: "Hello! We're excited to hear about your new project. This quick guide will help us gather the essential requirements in just a few minutes.",
    buttonText: "Let's Start"
  },
  {
    id: 'name',
    type: 'text',
    question: "First things first, what's your first name?",
    placeholder: "Type your answer here...",
    required: true
  },
  {
    id: 'projectType',
    type: 'choice',
    question: "Hi {name}! What type of project are you building?",
    options: [
      { key: 'A', label: 'Web Application (SaaS)' },
      { key: 'B', label: 'E-Commerce Store' },
      { key: 'C', label: 'Marketing / Portfolio Site' },
      { key: 'D', label: 'Mobile App' },
      { key: 'E', label: 'Other' }
    ],
    required: true
  },
  {
    id: 'budget',
    type: 'choice',
    question: "Do you have a rough budget range in mind?",
    subtext: "This helps us recommend the right tech stack.",
    options: [
      { key: 'A', label: '< $5k (MVP)' },
      { key: 'B', label: '$5k - $20k' },
      { key: 'C', label: '$20k - $50k' },
      { key: 'D', label: '$50k+' }
    ],
    required: true
  },
  {
    id: 'priority',
    type: 'rating',
    question: "On a scale of 1-10, how critical is 'Speed to Market' vs. 'Feature Completeness'?",
    subtext: "1 = Just ship it fast!, 10 = It must be perfect before launch.",
    min: 1,
    max: 10,
    required: true
  },
  {
    id: 'description',
    type: 'long-text',
    question: "In a few sentences, what is the primary problem this project solves for your users?",
    placeholder: "Describe the core value...",
    required: true
  },
  {
    id: 'email',
    type: 'email',
    question: "Last one. Where should we send the proposal?",
    placeholder: "name@example.com",
    required: true
  },
  {
    id: 'thank-you',
    type: 'statement',
    title: "All set!",
    text: "Thanks {name}. We've received your requirements and will be in touch shortly.",
    buttonText: "Restart Demo",
    isEnd: true
  }
];

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [direction, setDirection] = useState('forward');
  const [inputError, setInputError] = useState(false);
  
  // Refs for auto-focusing
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Helper to get processed question text (replacing variables like {name})
  const getProcessedText = (text) => {
    if (!text) return '';
    return text.replace(/{(\w+)}/g, (_, key) => answers[key] || 'there');
  };

  const currentQ = questions[currentStep];
  const progress = ((currentStep) / (questions.length - 1)) * 100;

  // --- Handlers ---

  const handleNext = () => {
    // Validation
    if (currentQ.required && !currentQ.isEnd) {
      const val = answers[currentQ.id];
      if (!val && val !== 0) {
        setInputError(true);
        // Shake animation reset
        setTimeout(() => setInputError(false), 500);
        return;
      }
    }

    if (currentQ.isEnd) {
      // Reset logic for demo purposes
      setAnswers({});
      setCurrentStep(0);
      return;
    }

    setDirection('forward');
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection('backward');
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleAnswer = (value) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }));
    // Auto-advance for choice questions (optional UX choice)
    if (currentQ.type === 'choice') {
      setTimeout(() => {
        setDirection('forward');
        setCurrentStep(prev => prev + 1);
      }, 350); // Small delay for visual feedback
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && currentQ.type !== 'long-text') {
      // Prevent default to avoid newline in inputs
      e.preventDefault(); 
      handleNext();
    }
    // Allow Shift+Enter for long text to just add a new line
    if (e.key === 'Enter' && currentQ.type === 'long-text' && (e.metaKey || e.ctrlKey)) {
        handleNext();
    }
  };

  // Auto-focus input on step change
  useEffect(() => {
    if (inputRef.current) {
      // Small timeout to allow transition to settle
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [currentStep]);

  // --- Render Components ---

  const renderInput = () => {
    switch (currentQ.type) {
      case 'statement':
        return (
          <button 
            onClick={handleNext}
            className="group mt-8 px-8 py-3 bg-blue-600 text-white text-xl font-medium rounded-lg hover:bg-blue-700 transition-all flex items-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            {currentQ.buttonText}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        );

      case 'text':
      case 'email':
        return (
          <div className="mt-8 w-full max-w-2xl">
            <input
              ref={inputRef}
              type={currentQ.type}
              className="w-full bg-transparent border-b-2 border-blue-200 text-4xl text-blue-900 pb-2 focus:outline-none focus:border-blue-600 transition-colors placeholder-blue-200/50 font-light"
              placeholder={currentQ.placeholder}
              value={answers[currentQ.id] || ''}
              onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
              onKeyDown={handleKeyDown}
            />
            <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm font-medium animate-pulse">
              <span>Press <span className="font-bold">Enter ↵</span></span>
            </div>
          </div>
        );

      case 'long-text':
        return (
          <div className="mt-8 w-full max-w-2xl">
            <textarea
              ref={inputRef}
              className="w-full bg-blue-50/50 p-4 border-2 border-transparent focus:border-blue-200 rounded-xl text-2xl text-blue-900 focus:outline-none transition-all resize-none placeholder-blue-200/50 font-light min-h-[160px]"
              placeholder={currentQ.placeholder}
              value={answers[currentQ.id] || ''}
              onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
              onKeyDown={handleKeyDown}
            />
            <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm font-medium">
              <span>Press <span className="font-bold">Cmd + Enter ⌘↵</span> to submit</span>
            </div>
          </div>
        );

      case 'choice':
        return (
          <div className="mt-8 flex flex-col gap-3 w-full max-w-xl">
            {currentQ.options.map((opt, idx) => {
              const isSelected = answers[currentQ.id] === opt.label;
              return (
                <div 
                  key={opt.key}
                  onClick={() => handleAnswer(opt.label)}
                  className={`
                    group flex items-center gap-4 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                    ${isSelected 
                      ? 'bg-blue-50 border-blue-500 shadow-md' 
                      : 'border-blue-100 bg-white/50 hover:border-blue-300 hover:bg-blue-50/50'
                    }
                  `}
                >
                  <div className={`
                    w-8 h-8 flex items-center justify-center rounded border text-sm font-bold transition-colors
                    ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-blue-200 text-blue-400 group-hover:border-blue-400'}
                  `}>
                    {opt.key}
                  </div>
                  <span className={`text-xl ${isSelected ? 'text-blue-900 font-medium' : 'text-slate-600'}`}>
                    {opt.label}
                  </span>
                  {isSelected && <Check className="ml-auto text-blue-600 w-5 h-5" />}
                </div>
              );
            })}
          </div>
        );

      case 'rating':
        return (
            <div className="mt-10 flex flex-wrap gap-2 w-full max-w-3xl">
                {[...Array(currentQ.max)].map((_, i) => {
                    const val = i + 1;
                    const isSelected = answers[currentQ.id] === val;
                    return (
                        <button
                            key={val}
                            onClick={() => {
                                setAnswers(prev => ({ ...prev, [currentQ.id]: val }));
                                // Small delay before auto-advance
                                setTimeout(() => handleNext(), 400); 
                            }}
                            className={`
                                w-12 h-14 flex items-center justify-center rounded text-xl font-bold transition-all transform duration-200
                                ${isSelected 
                                    ? 'bg-blue-600 text-white scale-110 shadow-lg' 
                                    : 'bg-white border-2 border-blue-100 text-blue-300 hover:border-blue-400 hover:text-blue-500 hover:-translate-y-1'
                                }
                            `}
                        >
                            {val}
                        </button>
                    )
                })}
                <div className="w-full flex justify-between mt-2 text-sm text-blue-400 font-medium uppercase tracking-wide">
                    <span>Speed</span>
                    <span>Perfection</span>
                </div>
            </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative h-screen w-full bg-[#fcfdff] text-slate-800 font-sans overflow-hidden flex flex-col">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 z-50"></div>
      
      {/* Header / Brand */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-40">
        <div className="flex items-center gap-2 text-blue-900 font-bold text-lg tracking-tight">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Zap size={18} fill="currentColor" />
          </div>
          ReqGather
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center w-full max-w-5xl mx-auto px-6 relative z-10">
        
        {/* Question Container */}
        <div 
          key={currentStep} // Key change triggers re-render for simple animation
          className={`w-full transition-all duration-500 ease-out transform
            ${direction === 'forward' ? 'animate-in fade-in slide-in-from-bottom-8' : 'animate-in fade-in slide-in-from-top-8'}
          `}
        >
            {/* Question Index (Small) */}
            {!currentQ.isEnd && currentQ.type !== 'statement' && (
                <div className="flex items-center gap-2 text-blue-600 mb-6 font-medium text-sm uppercase tracking-wider">
                    <span>Question {currentStep} <span className="text-blue-200">/</span> {questions.length - 2}</span>
                </div>
            )}

            {/* Question Title */}
            <h1 className={`
                font-bold text-slate-900 leading-tight
                ${currentQ.type === 'statement' ? 'text-5xl md:text-6xl mb-6' : 'text-3xl md:text-4xl'}
            `}>
                {currentQ.type === 'statement' ? currentQ.title : getProcessedText(currentQ.question)}
            </h1>

            {/* Subtext */}
            {(currentQ.subtext || (currentQ.type === 'statement' && currentQ.text)) && (
                <p className="mt-4 text-xl md:text-2xl text-slate-500 font-light max-w-3xl leading-relaxed">
                    {currentQ.type === 'statement' ? getProcessedText(currentQ.text) : currentQ.subtext}
                </p>
            )}

            {/* Error Message */}
            {inputError && (
                 <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium animate-bounce">
                    Please fill this out to continue
                 </div>
            )}

            {/* Input Area */}
            {renderInput()}

        </div>

      </main>

      {/* Footer Navigation */}
      {!currentQ.isEnd && (
          <footer className="w-full p-6 flex items-center justify-between z-40">
            {/* Progress Bar */}
            <div className="hidden md:block w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2 ml-auto">
                <button 
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="p-3 rounded-md bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-0 disabled:pointer-events-none transition-all"
                    aria-label="Previous question"
                >
                    <ChevronUp size={24} />
                </button>
                <button 
                    onClick={handleNext}
                    className="p-3 rounded-md bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-1 transition-all"
                    aria-label="Next question"
                >
                    <ChevronDown size={24} />
                </button>
            </div>
          </footer>
      )}

      {/* Global Styles for simple CSS animations if Tailwind config doesn't have them */}
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
            animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>

    </div>
  );
}