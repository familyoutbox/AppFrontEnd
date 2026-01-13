import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, 
  Shield, 
  Heartbeat, 
  Calculator,
  Plane,
  Phone,
  Package,
  CreditCard,
  Loader2,
  Check
} from 'lucide-react';

const BusinessLogicGenerator = () => {
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [requirements, setRequirements] = useState('');
  const [rules, setRules] = useState('');
  const [constraints, setConstraints] = useState('');
  const [integrations, setIntegrations] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    // Mock data - in production, fetch from API
    setDomains([
      {
        type: 'banking_loan_underwriting',
        description: 'Banking Loan Underwriting Engine',
        icon: Building2,
        components_count: 9,
        models_count: 7,
        complexity: 'Hundreds of rules'
      },
      {
        type: 'fraud_detection',
        description: 'Credit Card Fraud Detection',
        icon: Shield,
        components_count: 9,
        models_count: 7,
        complexity: 'Real-time ML + Rules'
      },
      {
        type: 'insurance_claims',
        description: 'Insurance Claim Adjudication',
        icon: Heartbeat,
        components_count: 8,
        models_count: 8,
        complexity: 'Thousands of rules'
      },
      {
        type: 'tax_calculation',
        description: 'Multi-Jurisdiction Tax Engine',
        icon: Calculator,
        components_count: 8,
        models_count: 6,
        complexity: 'Complex tax rules'
      },
      {
        type: 'airline_pricing',
        description: 'Airline Pricing & Revenue Mgmt',
        icon: Plane,
        components_count: 7,
        models_count: 6,
        complexity: 'Dynamic pricing'
      },
      {
        type: 'telecom_billing',
        description: 'Telecom Billing Rating Engine',
        icon: Phone,
        components_count: 8,
        models_count: 7,
        complexity: 'Usage-based billing'
      },
      {
        type: 'supply_chain_erp',
        description: 'Supply Chain Optimization',
        icon: Package,
        components_count: 9,
        models_count: 8,
        complexity: 'Multi-stage optimization'
      },
      {
        type: 'payment_gateway',
        description: 'Payment Gateway Settlement',
        icon: CreditCard,
        components_count: 8,
        models_count: 7,
        complexity: 'Multi-currency'
      }
    ]);
  };

  const handleGenerate = async () => {
    if (!selectedDomain || !projectName) {
      alert('Please select a domain and provide project name');
      return;
    }

    setLoading(true);
    
    try {
      // In production, call API
      alert(`Generating ${selectedDomain.description}...\n\nThis will create:\n- ${selectedDomain.components_count} components\n- ${selectedDomain.models_count} data models\n- Business rules engine\n- Complete test suite`);
      
      // Navigate to project view
      setTimeout(() => {
        navigate('/projects');
      }, 2000);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complex Business Logic Generator
          </h1>
          <p className="text-gray-600">
            Generate production-ready systems for banking, insurance, healthcare, and more
          </p>
        </div>

        {!selectedDomain ? (
          /* Domain Selection */
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Select Domain Type
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {domains.map((domain) => {
                const Icon = domain.icon;
                return (
                  <Card
                    key={domain.type}
                    className="cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
                    onClick={() => setSelectedDomain(domain)}
                  >
                    <CardHeader>
                      <Icon className="h-10 w-10 text-blue-600 mb-2" />
                      <CardTitle className="text-base">{domain.description}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>• {domain.components_count} Components</p>
                        <p>• {domain.models_count} Data Models</p>
                        <p>• {domain.complexity}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>💡 What gets generated:</strong> Complete production-ready system including 
                data models, business rules engine, APIs, validation, error handling, audit trails, 
                unit tests, integration tests, and comprehensive documentation.
              </p>
            </div>
          </>
        ) : (
          /* Configuration Form */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Selected Domain Info */}
            <div className="lg:col-span-1">
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle>Selected Domain</CardTitle>
                </CardHeader>
                <CardContent>
                  {React.createElement(selectedDomain.icon, { className: "h-16 w-16 text-blue-600 mb-4" })}
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {selectedDomain.description}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Components:</span>
                      <span className="font-medium">{selectedDomain.components_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Data Models:</span>
                      <span className="font-medium">{selectedDomain.models_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Complexity:</span>
                      <span className="font-medium">{selectedDomain.complexity}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDomain(null)}
                    className="w-full mt-4"
                  >
                    Change Domain
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Configuration Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                  <CardDescription>
                    Customize your business logic system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="project-name">Project Name *</Label>
                    <Input
                      id="project-name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g., Enterprise Loan Underwriting System"
                    />
                  </div>

                  <div>
                    <Label htmlFor="requirements">Specific Requirements</Label>
                    <Textarea
                      id="requirements"
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      placeholder="Describe specific requirements for your system..."
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Additional requirements beyond standard implementation
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="rules">Business Rules</Label>
                    <Textarea
                      id="rules"
                      value={rules}
                      onChange={(e) => setRules(e.target.value)}
                      placeholder="e.g., Credit score must be > 700 for approval&#10;Maximum loan amount is 10x annual income&#10;..."
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      One rule per line. System will generate rule engine for these.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="constraints">System Constraints</Label>
                    <Textarea
                      id="constraints"
                      value={constraints}
                      onChange={(e) => setConstraints(e.target.value)}
                      placeholder="e.g., Must handle 10,000 transactions/second&#10;99.99% uptime required&#10;..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="integrations">Required Integrations</Label>
                    <Input
                      id="integrations"
                      value={integrations}
                      onChange={(e) => setIntegrations(e.target.value)}
                      placeholder="e.g., Credit Bureau API, Bank API, KYC Service"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Comma-separated list of external systems to integrate
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleGenerate}
                      disabled={loading || !projectName}
                      className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Generating System...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Generate Complete System
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-900 font-medium mb-2">
                      ✓ What will be generated:
                    </p>
                    <ul className="text-sm text-green-800 space-y-1 ml-4 list-disc">
                      <li>Complete architecture & design</li>
                      <li>All {selectedDomain.models_count} data models with validation</li>
                      <li>All {selectedDomain.components_count} business components</li>
                      <li>Sophisticated business rules engine</li>
                      <li>REST APIs with authentication</li>
                      <li>Comprehensive test suite</li>
                      <li>Technical documentation</li>
                      <li>Deployment configuration</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessLogicGenerator;
