import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';import { useAuth } from '@/contexts/AuthContext';import { projectsAPI, agentAPI } from '@/services/api';
import { toast } from 'sonner';
import { ArrowRight, Check, Zap, ChevronUp, ChevronDown, Sparkles, X, Settings, LogOut } from 'lucide-react';

// --- Configuration Data for Wizard Steps ---
const questions = [
  {
    id: 'welcome',
    type: 'statement',
    title: "Let's Build Something Amazing",
    text: "Welcome to the AI-powered project generator! We'll guide you through defining your project requirements in just a few minutes. You can start from scratch or use a sample project as a starting point.",
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
    required: true,
    examples: [
      'Enable customers to browse and purchase products online with secure payment processing and real-time order tracking.',
      'Allow patients to book medical appointments, manage their schedules, and receive notifications about upcoming visits.',
      'Help teams collaborate on projects with task management, file sharing, and real-time progress tracking.'
    ]
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
    suggestions: ['Customer', 'Admin', 'Manager', 'Vendor', 'Patient', 'Doctor', 'Teacher', 'Student', 'Employee']
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
    suggestions: ['User registration', 'Login/Authentication', 'Product listing', 'Order processing', 'Payment processing', 'Dashboard', 'Notifications', 'Search and filter', 'File upload', 'Reporting']
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
    suggestions: ['Home', 'Dashboard', 'Login', 'Profile', 'Settings', 'Product List', 'Product Detail', 'Cart', 'Checkout', 'Admin Panel']
  },
  {
    id: 'backend',
    type: 'choice',
    question: "Choose your backend framework",
    options: [
      { key: 'A', label: 'Python (FastAPI) - Fast & Modern' },
      { key: 'B', label: 'Python (Django) - Batteries Included' },
      { key: 'C', label: 'Python (Flask) - Lightweight' },
      { key: 'D', label: 'Node.js (Express) - JavaScript' },
      { key: 'E', label: 'TypeScript (NestJS) - Enterprise Node' },
      { key: 'F', label: '.NET Core (C#) - Enterprise' },
      { key: 'G', label: 'Go (Gin) - High Performance' },
      { key: 'H', label: 'Rust (Actix) - Memory Safe' },
      { key: 'I', label: 'Java (Spring Boot) - Enterprise Java' },
      { key: 'J', label: 'PHP (Laravel) - Full Stack' },
      { key: 'K', label: 'Ruby (Rails) - Convention over Config' },
      { key: 'L', label: 'Kotlin (Ktor) - Modern JVM' },
      { key: 'M', label: 'Scala (Play) - Functional JVM' }
    ],
    required: true
  },
  {
    id: 'frontend',
    type: 'choice',
    question: "Choose your frontend framework",
    options: [
      { key: 'A', label: 'React + Vite - Fast & Modern' },
      { key: 'B', label: 'Next.js - Full-stack React' },
      { key: 'C', label: 'Vue.js - Progressive' },
      { key: 'D', label: 'Angular - Enterprise' },
      { key: 'E', label: 'Svelte - Compiled Framework' }
    ],
    required: true
  },
  {
    id: 'database',
    type: 'choice',
    question: "Choose your database",
    options: [
      { key: 'A', label: 'MongoDB - NoSQL, Flexible' },
      { key: 'B', label: 'PostgreSQL - Relational, ACID' },
      { key: 'C', label: 'MySQL - Popular, Reliable' },
      { key: 'D', label: 'SQL Server - Microsoft Enterprise' },
      { key: 'E', label: 'SQLite - Lightweight File DB' },
      { key: 'F', label: 'Redis - In-Memory Key-Value' },
      { key: 'G', label: 'DynamoDB - AWS NoSQL' },
      { key: 'H', label: 'Cassandra - Distributed NoSQL' },
      { key: 'I', label: 'Elasticsearch - Search & Analytics' }
    ],
    required: true
  },
  {
    id: 'auth',
    type: 'choice',
    question: "Choose your authentication method",
    options: [
      { key: 'A', label: 'JWT - Token-based' },
      { key: 'B', label: 'OAuth 2.0 - Social Login' },
      { key: 'C', label: 'Session-based - Traditional' }
    ],
    required: true
  },
  {
    id: 'complexity',
    type: 'choice',
    question: "What's the expected complexity of your project?",
    options: [
      { key: 'A', label: 'Small (1-3 modules, <10 pages) - MVP' },
      { key: 'B', label: 'Medium (3-7 modules, 10-30 pages) - Standard' },
      { key: 'C', label: 'Enterprise (7+ modules, 30+ pages) - Large-scale' }
    ],
    required: true
  },
  {
    id: 'integrations',
    type: 'multi-select',
    question: "Select any third-party integrations you need (optional)",
    options: [
      { key: 'A', label: 'Stripe (Payments)' },
      { key: 'B', label: 'SendGrid (Email)' },
      { key: 'C', label: 'Twilio (SMS)' },
      { key: 'D', label: 'AWS S3 (Storage)' },
      { key: 'E', label: 'Google Maps' },
      { key: 'F', label: 'Redis (Cache)' }
    ],
    required: false
  },
  {
    id: 'thank-you',
    type: 'statement',
    title: "Perfect! We're Ready to Build",
    text: "We have all the information we need. Click below to start generating your complete project with AI.",
    buttonText: "Generate Project",
    isEnd: true
  }
];

const RequirementsWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [direction, setDirection] = useState('forward');
  const [inputError, setInputError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listInput, setListInput] = useState('');
  const [useMultiAgent, setUseMultiAgent] = useState(false); // Advanced multi-agent mode
  const [multiAgentMode, setMultiAgentMode] = useState('hybrid'); // 'hybrid' or 'full'
  
  // Refs for auto-focusing
  const inputRef = useRef(null);

  // Sample projects data for quick start
  const sampleProjects = [
    {
      label: 'E-commerce Platform',
      data: {
        projectName: 'E-commerce Platform',
        businessDomain: 'Retail',
        businessObjective: 'Enable users to buy and sell products online with secure payments.',
        actors: ['Customer', 'Admin', 'Vendor'],
        workflows: ['User registration', 'Product listing', 'Order processing', 'Payment'],
        uiPages: [
          { id: 'page-0', route: '/home', component_name: 'Home', title: 'Home' },
          { id: 'page-1', route: '/product-list', component_name: 'ProductList', title: 'Product List' },
          { id: 'page-2', route: '/product-detail', component_name: 'ProductDetail', title: 'Product Detail' },
          { id: 'page-3', route: '/cart', component_name: 'Cart', title: 'Cart' },
          { id: 'page-4', route: '/checkout', component_name: 'Checkout', title: 'Checkout' },
          { id: 'page-5', route: '/admin-dashboard', component_name: 'AdminDashboard', title: 'Admin Dashboard' },
        ],
        backend: 'python',
        frontend: 'react',
        database: 'mongodb',
        auth: 'jwt',
        complexity: 'medium',
        moduleCount: 5,
        integrations: ['Stripe (Payments)', 'SendGrid (Email)'],
      }
    },
    {
      label: 'Healthcare Appointment System',
      data: {
        projectName: 'Healthcare Appointment System',
        businessDomain: 'Healthcare',
        businessObjective: 'Allow patients to book, manage, and track medical appointments online.',
        actors: ['Patient', 'Doctor', 'Receptionist'],
        workflows: ['Appointment booking', 'Doctor scheduling', 'Patient notifications'],
        uiPages: [
          { id: 'page-0', route: '/login', component_name: 'Login', title: 'Login' },
          { id: 'page-1', route: '/book-appointment', component_name: 'BookAppointment', title: 'Book Appointment' },
          { id: 'page-2', route: '/my-appointments', component_name: 'MyAppointments', title: 'My Appointments' },
          { id: 'page-3', route: '/doctor-dashboard', component_name: 'DoctorDashboard', title: 'Doctor Dashboard' },
        ],
        backend: 'python',
        frontend: 'react',
        database: 'mongodb',
        auth: 'jwt',
        complexity: 'small',
        moduleCount: 3,
        integrations: ['Twilio (SMS)'],
      }
    },
    {
      label: 'Project Management Tool',
      data: {
        projectName: 'Project Management Tool',
        businessDomain: 'Productivity',
        businessObjective: 'Help teams plan, track, and manage projects collaboratively.',
        actors: ['Manager', 'Team Member'],
        workflows: ['Task creation', 'Task assignment', 'Progress tracking'],
        uiPages: [
          { id: 'page-0', route: '/dashboard', component_name: 'Dashboard', title: 'Dashboard' },
          { id: 'page-1', route: '/projects', component_name: 'Projects', title: 'Projects' },
          { id: 'page-2', route: '/tasks', component_name: 'Tasks', title: 'Tasks' },
          { id: 'page-3', route: '/team', component_name: 'Team', title: 'Team' },
        ],
        backend: 'node',
        frontend: 'react',
        database: 'postgresql',
        auth: 'jwt',
        complexity: 'medium',
        moduleCount: 4,
        integrations: ['SendGrid (Email)', 'AWS S3 (Storage)'],
      }
    }
  ];

  // Helper to get processed question text (replacing variables)
  const getProcessedText = (text) => {
    if (!text) return '';
    return text.replace(/{(\w+)}/g, (_, key) => answers[key] || '');
  };

  const currentQ = questions[currentStep];
  const progress = ((currentStep) / (questions.length - 1)) * 100;

  // --- Handlers ---

  const handleNext = () => {
    // Validation
    if (currentQ.required && !currentQ.isEnd) {
      const val = answers[currentQ.id];
      
      // Check for multi-text and multi-page types
      if (currentQ.type === 'multi-text' || currentQ.type === 'multi-page' || currentQ.type === 'multi-select') {
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
      // Submit the project
      handleSubmit();
      return;
    }

    setDirection('forward');
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
      setListInput(''); // Clear list input when moving to next step
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
    // Auto-advance for choice questions
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
        // Create page object
        const pageObj = {
          id: `page-${currentList.length}`,
          route: `/${listInput.toLowerCase().replace(/\s+/g, '-')}`,
          name: listInput.trim(),
          title: listInput.trim(),
          component_name: listInput.trim().replace(/\s+/g, ''),
          components: []
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

  const handleMultiSelectToggle = (value) => {
    const currentList = answers[currentQ.id] || [];
    if (currentList.includes(value)) {
      setAnswers(prev => ({ 
        ...prev, 
        [currentQ.id]: currentList.filter(item => item !== value) 
      }));
    } else {
      setAnswers(prev => ({ 
        ...prev, 
        [currentQ.id]: [...currentList, value] 
      }));
    }
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

  // Auto-focus input on step change
  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [currentStep]);

  // Restore wizard answers from localStorage if returning from login
  useEffect(() => {
    const savedAnswers = localStorage.getItem('wizard_answers');
    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers);
        setAnswers(parsed);
        // Jump to the last step (thank you page)
        setCurrentStep(questions.length - 1);
        localStorage.removeItem('wizard_answers');
        toast.success('Welcome back! Click below to create your project.');
      } catch (e) {
        console.error('Failed to restore wizard answers:', e);
      }
    }
  }, []);

  // Submit handler
  const handleSubmit = async () => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    if (!token) {
      // Save answers to localStorage and redirect to login
      localStorage.setItem('wizard_answers', JSON.stringify(answers));
      toast.info('Please login to create your project');
      navigate('/login?redirect=/wizard');
      return;
    }

    setLoading(true);
    try {
      // Map answers to project data format
      const projectData = {
        name: answers.projectName,
        requirements: {
          business_domain: answers.businessDomain,
          business_objective: answers.businessObjective,
          actors: answers.actors || [],
          workflows: answers.workflows || [],
          ui_pages: answers.uiPages || [],
          tech_stack: {
            // Extract framework from "Python (FastAPI)" -> "fastapi" or ".NET Core (C#)" -> ".net"
            backend: (() => {
              const backend = answers.backend || 'Python (FastAPI)';
              const match = backend.match(/\((.*?)\)/);
              if (match) {
                const framework = match[1].toLowerCase();
                // Map display names to backend identifiers
                const backendMap = {
                  'fastapi': 'fastapi',
                  'django': 'django',
                  'flask': 'flask',
                  'express': 'node',
                  'nestjs': 'typescript',
                  'c#': '.net',
                  'gin': 'go',
                  'actix': 'rust',
                  'spring boot': 'java',
                  'laravel': 'php',
                  'rails': 'ruby',
                  'ktor': 'kotlin',
                  'play': 'scala'
                };
                return backendMap[framework] || framework;
              }
              return 'python';
            })(),
            frontend: (() => {
              const frontend = answers.frontend || 'React + Vite';
              if (frontend.includes('React') || frontend.includes('Vite')) return 'react';
              if (frontend.includes('Next')) return 'next';
              if (frontend.includes('Vue')) return 'vue';
              if (frontend.includes('Angular')) return 'angular';
              if (frontend.includes('Svelte')) return 'svelte';
              return 'react';
            })(),
            database: answers.database?.toLowerCase().split(' ')[0] || 'mongodb',
            auth: answers.auth?.toLowerCase().split(' ')[0] || 'jwt',
          },
          complexity: answers.complexity?.toLowerCase().split(' ')[0] || 'medium',
          integrations: answers.integrations || [],
        },
      };

      const response = await projectsAPI.create(projectData);
      
      if (!response || !response.data || !response.data.id) {
        toast.error('Project creation failed: No response from server.');
        setLoading(false);
        return;
      }
      
      const projectId = response.data.id;

      // Auto-start code generation
      const initialTask = `Generate complete project structure for: ${answers.projectName}
      
Business Domain: ${answers.businessDomain}
Objective: ${answers.businessObjective}
Tech Stack: ${projectData.requirements.tech_stack.backend}, ${projectData.requirements.tech_stack.frontend}, ${projectData.requirements.tech_stack.database}
Pages needed: ${(answers.uiPages || []).map(p => p.name || p.title || p).join(', ')}
Complexity: ${answers.complexity}

Please create:
1. Complete backend API with all required endpoints
2. Frontend pages and components
3. Database models and schemas
4. Authentication and authorization
5. All necessary configurations`;

      await agentAPI.start({
        project_id: projectId,
        task_title: 'Initial Project Generation',
        task_description: initialTask,
        use_multi_agent: useMultiAgent,
        multi_agent_mode: multiAgentMode
      });
      
      toast.success('Project created — AI generation started!');
      navigate(`/project/${projectId}`);
      
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error(error.response?.data?.detail || 'Failed to create project. Please try again.');
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
            {/* Sample Projects Section */}
            {currentQ.showSamples && sampleProjects && sampleProjects.length > 0 && (
              <div className="mt-8 w-full max-w-3xl">
                <h3 className="text-xl text-blue-600 font-medium mb-4 text-center">Or start with a sample project:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {sampleProjects.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAnswers(sample.data);
                        toast.success(`Loaded: ${sample.label}`);
                        setTimeout(() => setCurrentStep(1), 500);
                      }}
                      className="p-4 bg-white border-2 border-blue-100 rounded-lg hover:border-blue-400 hover:shadow-lg transition-all text-left group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-blue-900 group-hover:text-blue-600">{sample.label}</span>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2">{sample.data.businessObjective}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Multi-Agent Mode Toggle */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <input
                  type="checkbox"
                  id="multiAgentToggle"
                  checked={useMultiAgent}
                  onChange={(e) => setUseMultiAgent(e.target.checked)}
                  className="w-5 h-5 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="multiAgentToggle" className="flex items-center gap-2 cursor-pointer">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">
                    Use Advanced Multi-Agent System
                  </span>
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                    Higher Quality
                  </span>
                </label>
              </div>
              
              {/* Multi-Agent Mode Selector */}
              {useMultiAgent && (
                <div className="flex gap-3 justify-center animate-in">
                  <button
                    type="button"
                    onClick={() => setMultiAgentMode('hybrid')}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      multiAgentMode === 'hybrid'
                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Hybrid Mode</div>
                        <div className="text-xs opacity-75">Fast + Smart Planning</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setMultiAgentMode('full')}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      multiAgentMode === 'full'
                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Full Mode</div>
                        <div className="text-xs opacity-75">Max Quality (Slower)</div>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleNext}
              disabled={loading}
              className="group px-8 py-3 bg-blue-600 text-white text-xl font-medium rounded-lg hover:bg-blue-700 transition-all flex items-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Sparkles className="animate-spin" />
                  Generating Project...
                </>
              ) : (
                <>
                  {currentQ.buttonText}
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        );

      case 'text':
      case 'email':
        return (
          <div className="mt-8 w-full max-w-2xl">
            <input
              ref={inputRef}
              type={currentQ.type === 'email' ? 'email' : 'text'}
              className="w-full bg-transparent border-b-2 border-blue-200 text-4xl text-blue-900 pb-2 focus:outline-none focus:border-blue-600 transition-colors placeholder-blue-200/50 font-light"
              placeholder={currentQ.placeholder}
              value={answers[currentQ.id] || ''}
              onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
              onKeyDown={handleKeyDown}
            />
            {/* Suggestions */}
            {currentQ.suggestions && currentQ.suggestions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-blue-400 font-medium mr-2">Suggestions:</span>
                {currentQ.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: suggestion }))}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm hover:bg-blue-100 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
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
            {/* Examples */}
            {currentQ.examples && currentQ.examples.length > 0 && (
              <div className="mt-4 space-y-2">
                <span className="text-sm text-blue-400 font-medium">Examples:</span>
                {currentQ.examples.map((example, idx) => (
                  <div
                    key={idx}
                    onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: example }))}
                    className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    {example}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm font-medium">
              <span>Press <span className="font-bold">Cmd/Ctrl + Enter ⌘↵</span> to continue</span>
            </div>
          </div>
        );

      case 'multi-text':
      case 'multi-page':
        return (
          <div className="mt-8 w-full max-w-2xl">
            <div className="flex gap-2 mb-4">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-blue-50/50 px-4 py-3 border-2 border-blue-100 focus:border-blue-400 rounded-lg text-xl text-blue-900 focus:outline-none transition-all placeholder-blue-300/50"
                placeholder={currentQ.placeholder}
                value={listInput}
                onChange={(e) => setListInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button 
                onClick={handleListAdd}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
              >
                {currentQ.buttonText || 'Add'}
              </button>
            </div>
            
            {/* Suggestions */}
            {currentQ.suggestions && currentQ.suggestions.length > 0 && (answers[currentQ.id] || []).length === 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="text-sm text-blue-400 font-medium mr-2">Quick add:</span>
                {currentQ.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const currentList = answers[currentQ.id] || [];
                      if (!currentList.includes(suggestion)) {
                        if (currentQ.type === 'multi-page') {
                          const id = `page-${currentList.length}`;
                          const route = `/${suggestion.toLowerCase().replace(/\s+/g, '-')}`;
                          const component_name = suggestion.replace(/\s+/g, '');
                          setAnswers(prev => ({ 
                            ...prev, 
                            [currentQ.id]: [...currentList, { id, route, component_name, title: suggestion, name: suggestion }] 
                          }));
                        } else {
                          setAnswers(prev => ({ 
                            ...prev, 
                            [currentQ.id]: [...currentList, suggestion] 
                          }));
                        }
                      }
                    }}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm hover:bg-blue-100 transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            )}
            
            {/* List display */}
            <div className="flex flex-wrap gap-2">
              {(answers[currentQ.id] || []).map((item, index) => (
                <div 
                  key={index}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-900 rounded-full text-sm font-medium"
                >
                  <span>{typeof item === 'string' ? item : item.name || item.title}</span>
                  <button
                    onClick={() => handleListRemove(index)}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm font-medium">
              <span>Press <span className="font-bold">Enter ↵</span> to add</span>
            </div>
          </div>
        );

      case 'choice':
        return (
          <div className="mt-8 flex flex-col gap-3 w-full max-w-xl">
            {currentQ.options.map((opt) => {
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

      case 'multi-select':
        return (
          <div className="mt-8 flex flex-col gap-3 w-full max-w-xl">
            {currentQ.options.map((opt) => {
              const isSelected = (answers[currentQ.id] || []).includes(opt.label);
              return (
                <div 
                  key={opt.key}
                  onClick={() => handleMultiSelectToggle(opt.label)}
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
            <div className="mt-2 text-sm text-blue-400 font-medium">
              Select all that apply (optional)
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">AppGenie</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="p-2 rounded-full hover:bg-gray-100"
              title="Settings"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative w-full">
        
        <main className="container mx-auto px-6 py-4 flex flex-col justify-start items-center max-w-4xl">
          
          {/* Question Container */}
          <div 
            key={currentStep}
            className={`relative w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 my-8 transition-all duration-500 ease-out transform
              ${direction === 'forward' ? 'animate-in fade-in slide-in-from-bottom-8' : 'animate-in fade-in slide-in-from-top-8'}
            `}
          >
            {/* Exit Wizard Button */}
            <button
              onClick={() => navigate('/projects')}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Exit Wizard"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>

            {/* Question Index */}
            {!currentQ.isEnd && currentQ.type !== 'statement' && (
                <div className="flex items-center gap-2 text-blue-600 mb-6 font-medium text-sm uppercase tracking-wider">
                    <span>Step {currentStep} <span className="text-blue-200">/</span> {questions.length - 2}</span>
                </div>
            )}

            {/* Question Title */}
            <h1 className={`
                font-bold text-slate-900 leading-tight
                ${currentQ.type === 'statement' ? 'text-2xl md:text-3xl mb-6' : 'text-xl md:text-2xl'}
            `}>
                {currentQ.type === 'statement' ? currentQ.title : getProcessedText(currentQ.question)}
            </h1>

            {/* Subtext */}
            {(currentQ.subtext || (currentQ.type === 'statement' && currentQ.text)) && (
                <p className="mt-4 text-sm md:text-base text-slate-500 font-light max-w-3xl leading-relaxed">
                    {currentQ.type === 'statement' ? getProcessedText(currentQ.text) : currentQ.subtext}
                </p>
            )}

            {/* Error Message */}
            {inputError && (
                 <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-md text-sm font-medium animate-bounce">
                    Please complete this step to continue
                 </div>
            )}

            {/* Input Area */}
            {renderInput()}

        </div>

        </main>
      </div>

      {/* Footer Navigation */}
      {!currentQ.isEnd && (
          <footer className="w-full border-t border-gray-200 bg-white py-6 mt-auto">
            <div className="container mx-auto px-6 flex items-center justify-between max-w-4xl">
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
            </div>
          </footer>
      )}

      {/* Global Styles for CSS animations */}
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
};

export default RequirementsWizard;