import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { orchestratorAPI } from '@/services/api';
import { toast } from 'sonner';
import { ArrowRight, Check, Zap, Sparkles, X, Settings } from 'lucide-react';

// --- Configuration Data for Wizard Steps ---
const questions = [
  {
    id: 'welcome',
    type: 'statement',
    title: "AI Code Orchestrator",
    text: "Welcome to the LangGraph-powered project generator! This wizard uses a sophisticated multi-agent system to plan, generate, and build your project automatically.",
    buttonText: "Let's Begin",
    showSamples: true
  },
  {
    id: 'projectName',
    type: 'text',
    question: "First, what's the name of your project?",
    placeholder: "e.g., E-commerce Platform, Task Manager, Healthcare App...",
    required: true,
    suggestions: ['E-commerce Platform', 'Healthcare Appointment System', 'Project Management Tool', 'Social Media App', 'Task Manager']
  },
  {
    id: 'businessDomain',
    type: 'choice',
    question: "What industry or domain does your project belong to?",
    options: [
      { key: 'A', label: 'E-commerce / Retail' },
      { key: 'B', label: 'Healthcare / Medical' },
      { key: 'C', label: 'Finance / Banking' },
      { key: 'D', label: 'Education / E-learning' },
      { key: 'E', label: 'SaaS / Productivity' },
      { key: 'F', label: 'Social Media / Community' },
      { key: 'G', label: 'Other' }
    ],
    required: true
  },
  {
    id: 'businessObjective',
    type: 'long-text',
    question: "What's the main business objective or problem this project will solve?",
    placeholder: "Describe the core value proposition and who will benefit from it...",
    required: true
  },
  {
    id: 'actors',
    type: 'multi-text',
    question: "Who are the main users or actors in your system?",
    subtext: "List the different types of users (e.g., Customer, Admin, Vendor, Manager)",
    placeholder: "e.g., Customer",
    buttonText: "Add User Type",
    required: true,
    minItems: 1,
    suggestions: ['Customer', 'Admin', 'Manager', 'Vendor', 'Patient', 'Doctor']
  },
  {
    id: 'workflows',
    type: 'multi-text',
    question: "What are the key workflows or features?",
    subtext: "List the main actions or processes in your system",
    placeholder: "e.g., User registration, Order processing, Payment",
    buttonText: "Add Workflow",
    required: true,
    minItems: 1,
    suggestions: ['User registration', 'Login/Authentication', 'Product listing', 'Order processing']
  },
  {
    id: 'uiPages',
    type: 'multi-page',
    question: "What are the main pages or screens in your application?",
    subtext: "Define the UI structure of your application",
    placeholder: "e.g., Home, Dashboard, Product List",
    buttonText: "Add Page",
    required: true,
    minItems: 1,
    suggestions: ['Home', 'Dashboard', 'Login', 'Profile', 'Settings']
  },
  {
    id: 'backend',
    type: 'text',
    question: "Choose your backend framework",
    placeholder: "e.g., FastAPI, Django, Express, NestJS",
    required: true,
    suggestions: ['FastAPI', 'Django', 'Express', 'NestJS', 'Spring Boot']
  },
  {
    id: 'frontend',
    type: 'text',
    question: "Choose your frontend framework",
    placeholder: "e.g., React, Vue, Angular, Next.js",
    required: true,
    suggestions: ['React', 'Vue', 'Angular', 'Next.js', 'Svelte']
  },
  {
    id: 'database',
    type: 'text',
    question: "Choose your database",
    placeholder: "e.g., MongoDB, PostgreSQL, MySQL",
    required: true,
    suggestions: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis']
  },
  {
    id: 'complexity',
    type: 'choice',
    question: "What's the expected complexity of your project?",
    options: [
      { key: 'A', label: 'Small - MVP' },
      { key: 'B', label: 'Medium - Standard' },
      { key: 'C', label: 'Enterprise - Large-scale' }
    ],
    required: true
  },
  {
    id: 'integrations',
    type: 'multi-text',
    question: "List any third-party integrations you need (optional)",
    subtext: "e.g., Stripe, SendGrid, Twilio, AWS S3",
    placeholder: "e.g., Stripe",
    buttonText: "Add Integration",
    required: false,
    minItems: 0
  },
  {
    id: 'thank-you',
    type: 'statement',
    title: "Perfect! Ready to Orchestrate",
    text: "We have all the information we need. The AI orchestrator will now plan, generate, and build your complete project automatically.",
    buttonText: "Start Orchestration",
    isEnd: true
  }
];

const OrchestratorWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [direction, setDirection] = useState('forward');
  const [inputError, setInputError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listInput, setListInput] = useState('');
  const inputRef = useRef(null);

  // Sample projects data for quick start
  const sampleProjects = [
    {
      label: 'E-commerce Platform',
      data: {
        projectName: 'E-commerce Platform',
        businessDomain: 'E-commerce / Retail',
        businessObjective: 'Enable users to buy and sell products online with secure payments, shopping cart, and order tracking.',
        actors: ['Customer', 'Admin', 'Vendor'],
        workflows: ['User registration', 'Product listing', 'Shopping cart', 'Order processing', 'Payment'],
        uiPages: [
          { id: 'page-0', route: '/home', component_name: 'Home', title: 'Home' },
          { id: 'page-1', route: '/product-list', component_name: 'ProductList', title: 'Product List' },
          { id: 'page-2', route: '/product-detail', component_name: 'ProductDetail', title: 'Product Detail' },
          { id: 'page-3', route: '/cart', component_name: 'Cart', title: 'Cart' },
          { id: 'page-4', route: '/checkout', component_name: 'Checkout', title: 'Checkout' },
          { id: 'page-5', route: '/admin-dashboard', component_name: 'AdminDashboard', title: 'Admin Dashboard' },
        ],
        backend: 'FastAPI',
        frontend: 'React',
        database: 'MongoDB',
        complexity: 'Medium - Standard',
        integrations: ['Stripe', 'SendGrid'],
      }
    },
    {
      label: 'Healthcare Appointment System',
      data: {
        projectName: 'Healthcare Appointment System',
        businessDomain: 'Healthcare / Medical',
        businessObjective: 'Allow patients to book, manage, and track medical appointments with doctors, receive notifications, and manage health records.',
        actors: ['Patient', 'Doctor', 'Receptionist'],
        workflows: ['Appointment booking', 'Doctor scheduling', 'Patient notifications', 'Medical history'],
        uiPages: [
          { id: 'page-0', route: '/login', component_name: 'Login', title: 'Login' },
          { id: 'page-1', route: '/book-appointment', component_name: 'BookAppointment', title: 'Book Appointment' },
          { id: 'page-2', route: '/my-appointments', component_name: 'MyAppointments', title: 'My Appointments' },
          { id: 'page-3', route: '/doctor-dashboard', component_name: 'DoctorDashboard', title: 'Doctor Dashboard' },
        ],
        backend: 'FastAPI',
        frontend: 'React',
        database: 'PostgreSQL',
        complexity: 'Small - MVP',
        integrations: ['Twilio'],
      }
    },
    {
      label: 'Project Management Tool',
      data: {
        projectName: 'Project Management Tool',
        businessDomain: 'SaaS / Productivity',
        businessObjective: 'Help teams plan, track, and manage projects collaboratively with task assignment, progress tracking, and team communication.',
        actors: ['Manager', 'Team Member', 'Client'],
        workflows: ['Task creation', 'Task assignment', 'Progress tracking', 'Team collaboration'],
        uiPages: [
          { id: 'page-0', route: '/dashboard', component_name: 'Dashboard', title: 'Dashboard' },
          { id: 'page-1', route: '/projects', component_name: 'Projects', title: 'Projects' },
          { id: 'page-2', route: '/tasks', component_name: 'Tasks', title: 'Tasks' },
          { id: 'page-3', route: '/team', component_name: 'Team', title: 'Team' },
        ],
        backend: 'NestJS',
        frontend: 'React',
        database: 'PostgreSQL',
        complexity: 'Medium - Standard',
        integrations: ['SendGrid', 'AWS S3'],
      }
    }
  ];

  const currentQ = questions[currentStep];
  const progress = ((currentStep) / (questions.length - 1)) * 100;

  // --- Handlers ---

  const handleNext = () => {
    if (currentQ.required && !currentQ.isEnd) {
      const val = answers[currentQ.id];
      
      if (currentQ.type === 'multi-text' || currentQ.type === 'multi-page') {
        if (!val || val.length < (currentQ.minItems || 0)) {
          setInputError(true);
          setTimeout(() => setInputError(false), 500);
          return;
        }
      } else if (!val && val !== 0) {
        setInputError(true);
        setTimeout(() => setInputError(false), 500);
        return;
      }
    }

    if (currentQ.isEnd) {
      handleSubmit();
      return;
    }

    setDirection('forward');
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
      setListInput('');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection('backward');
      setCurrentStep(prev => prev - 1);
      setListInput('');
    }
  };

  const handleAnswer = (value) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }));
    if (currentQ.type === 'choice') {
      setTimeout(() => {
        setDirection('forward');
        setCurrentStep(prev => prev + 1);
        setListInput('');
      }, 350);
    }
  };

  const handleListAdd = () => {
    if (listInput.trim()) {
      const currentList = answers[currentQ.id] || [];
      
      if (currentQ.type === 'multi-page') {
        const pageObj = {
          id: `page-${currentList.length}`,
          route: `/${listInput.toLowerCase().replace(/\s+/g, '-')}`,
          component_name: listInput.trim().replace(/\s+/g, ''),
          title: listInput.trim()
        };
        setAnswers(prev => ({ ...prev, [currentQ.id]: [...currentList, pageObj] }));
      } else {
        setAnswers(prev => ({ ...prev, [currentQ.id]: [...currentList, listInput.trim()] }));
      }
      
      setListInput('');
    }
  };

  const handleListRemove = (index) => {
    const currentList = answers[currentQ.id] || [];
    setAnswers(prev => ({ 
      ...prev, 
      [currentQ.id]: currentList.filter((_, i) => i !== index) 
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && currentQ.type !== 'long-text') {
      e.preventDefault();
      if (currentQ.type === 'multi-text' || currentQ.type === 'multi-page') {
        handleListAdd();
      } else {
        handleNext();
      }
    }
    if (e.key === 'Enter' && currentQ.type === 'long-text' && (e.metaKey || e.ctrlKey)) {
      handleNext();
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [currentStep]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Map answers to orchestrator API format
      const requestData = {
        name: answers.projectName,
        requirements: {
          business_domain: answers.businessDomain,
          business_objective: answers.businessObjective,
          actors: answers.actors || [],
          workflows: answers.workflows || [],
          ui_pages: (answers.uiPages || []).map(page => ({
            id: page.id,
            route: page.route,
            component_name: page.component_name,
            title: page.title
          })),
          tech_stack: {
            backend: answers.backend || 'FastAPI',
            framework: answers.backend || 'FastAPI',
            frontend: answers.frontend || 'React',
            database: answers.database || 'MongoDB',
            auth: 'jwt'
          },
          complexity: answers.complexity?.toLowerCase().split(' ')[0] || 'medium',
          integrations: answers.integrations || []
        }
      };

      toast.info('Starting AI orchestration...');
      
      const response = await orchestratorAPI.orchestrate(requestData);
      
      if (response && response.data) {
        toast.success(`Project orchestration completed! Status: ${response.data.status}`);
        
        // Show logs in console
        if (response.data.logs && response.data.logs.length > 0) {
          console.log('Orchestration Logs:', response.data.logs);
        }
        
        // Navigate to projects dashboard
        setTimeout(() => navigate('/projects'), 2000);
      } else {
        toast.error('Orchestration completed but no response data received');
      }
      
    } catch (error) {
      console.error('Failed to orchestrate project:', error);
      toast.error(error.response?.data?.detail || error.message || 'Failed to orchestrate project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Render Components ---

  const renderInput = () => {
    switch (currentQ.type) {
      case 'statement':
        return (
          <div className="flex flex-col items-center">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-full border border-purple-200">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">
                  LangGraph Multi-Agent System
                </span>
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="w-full">
            <input
              ref={inputRef}
              type="text"
              value={answers[currentQ.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentQ.placeholder}
              className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                inputError ? 'border-red-500 animate-shake' : 'border-slate-300'
              }`}
            />
            {currentQ.suggestions && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {currentQ.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(suggestion)}
                    className="px-3 py-1 text-sm bg-slate-100 hover:bg-blue-100 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'long-text':
        return (
          <div className="w-full">
            <textarea
              ref={inputRef}
              value={answers[currentQ.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentQ.placeholder}
              rows={6}
              className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none ${
                inputError ? 'border-red-500 animate-shake' : 'border-slate-300'
              }`}
            />
            <p className="mt-2 text-sm text-slate-500 text-center">Press Cmd/Ctrl + Enter to continue</p>
          </div>
        );

      case 'choice':
        return (
          <div className="w-full max-w-2xl space-y-3">
            {currentQ.options.map((option) => (
              <button
                key={option.key}
                onClick={() => handleAnswer(option.label)}
                className={`w-full px-6 py-4 text-left rounded-xl border-2 transition-all ${
                  answers[currentQ.id] === option.label
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500">{option.key}</span>
                    <span className="text-base">{option.label}</span>
                  </div>
                  {answers[currentQ.id] === option.label && <Check className="w-5 h-5 text-blue-600" />}
                </div>
              </button>
            ))}
          </div>
        );

      case 'multi-text':
      case 'multi-page':
        const currentList = answers[currentQ.id] || [];
        return (
          <div className="w-full max-w-2xl">
            <div className="flex gap-2 mb-4">
              <input
                ref={inputRef}
                type="text"
                value={listInput}
                onChange={(e) => setListInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentQ.placeholder}
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleListAdd}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentQ.buttonText}
              </button>
            </div>
            {currentQ.suggestions && (
              <div className="mb-4 flex flex-wrap gap-2">
                {currentQ.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setListInput(suggestion);
                      setTimeout(() => handleListAdd(), 100);
                    }}
                    className="px-3 py-1 text-sm bg-slate-100 hover:bg-blue-100 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {currentList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg group"
                >
                  <span>{currentQ.type === 'multi-page' ? item.title : item}</span>
                  <button
                    onClick={() => handleListRemove(idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-center text-sm text-slate-500">
            Step {currentStep + 1} of {questions.length}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Question */}
          <div className="mb-8 text-center">
            {currentQ.title && (
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {currentQ.title}
              </h1>
            )}
            {currentQ.question && (
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-2">
                {currentQ.question}
              </h2>
            )}
            {currentQ.text && (
              <p className="text-lg text-slate-600">{currentQ.text}</p>
            )}
            {currentQ.subtext && (
              <p className="text-sm text-slate-500 mt-2">{currentQ.subtext}</p>
            )}
          </div>

          {/* Input */}
          <div className="flex justify-center mb-8">
            {renderInput()}
          </div>

          {/* Sample Projects Section */}
          {currentQ.showSamples && sampleProjects && sampleProjects.length > 0 && (
            <div className="mt-8 mb-8">
              <h3 className="text-xl text-purple-600 font-medium mb-4 text-center">Or start with a sample project:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sampleProjects.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setAnswers(sample.data);
                      toast.success(`Loaded: ${sample.label}`);
                      setTimeout(() => setCurrentStep(1), 500);
                    }}
                    className="p-4 border-2 border-slate-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-purple-900 group-hover:text-purple-600">{sample.label}</span>
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2">{sample.data.businessObjective}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-6 py-3 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Back
            </button>

            <button
              onClick={handleNext}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {currentQ.buttonText || 'Continue'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrchestratorWizard;
