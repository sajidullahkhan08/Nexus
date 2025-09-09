import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';

import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { Entrepreneur } from '../../types';
import { userAPI } from '../../config/api';

export const EntrepreneursPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedFundingRange, setSelectedFundingRange] = useState<string[]>([]);
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fundingRanges = ['< $500K', '$500K - $1M', '$1M - $5M', '> $5M'];

  // Fetch entrepreneurs on component mount
  useEffect(() => {
    const fetchEntrepreneurs = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getEntrepreneurs();
        setEntrepreneurs(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching entrepreneurs:', err);
        setError('Failed to load entrepreneurs. Please try again.');
        // Fallback to empty array
        setEntrepreneurs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEntrepreneurs();
  }, []);

  // Get unique industries from fetched entrepreneurs
  const allIndustries = Array.isArray(entrepreneurs) ? Array.from(new Set(entrepreneurs.map(e => e?.industry || ''))).filter(Boolean) : [];

  // Filter entrepreneurs based on search and filters
  const filteredEntrepreneurs = Array.isArray(entrepreneurs) ? entrepreneurs.filter(entrepreneur => {
    if (!entrepreneur) return false;

    const matchesSearch = searchQuery === '' ||
      (entrepreneur.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (entrepreneur.startupName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (entrepreneur.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (entrepreneur.pitchSummary?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesIndustry = selectedIndustries.length === 0 ||
      selectedIndustries.includes(entrepreneur.industry);

    // Simple funding range filter based on the amount string
    const matchesFunding = selectedFundingRange.length === 0 ||
      selectedFundingRange.some(range => {
        const fundingNeeded = entrepreneur.fundingNeeded || '';
        const amount = parseInt(fundingNeeded.replace(/[^0-9]/g, ''));
        switch (range) {
          case '< $500K': return amount < 500;
          case '$500K - $1M': return amount >= 500 && amount <= 1000;
          case '$1M - $5M': return amount > 1000 && amount <= 5000;
          case '> $5M': return amount > 5000;
          default: return true;
        }
      });

    return matchesSearch && matchesIndustry && matchesFunding;
  }) : [];
  
  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industry)
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
    );
  };
  
  const toggleFundingRange = (range: string) => {
    setSelectedFundingRange(prev => 
      prev.includes(range)
        ? prev.filter(r => r !== range)
        : [...prev, range]
    );
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Startups</h1>
        <p className="text-gray-600">Discover promising startups looking for investment</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Industry</h3>
                <div className="space-y-2">
                  {allIndustries.map(industry => (
                    <button
                      key={industry}
                      onClick={() => toggleIndustry(industry)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                        selectedIndustries.includes(industry)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Funding Range</h3>
                <div className="space-y-2">
                  {fundingRanges.map(range => (
                    <button
                      key={range}
                      onClick={() => toggleFundingRange(range)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                        selectedFundingRange.includes(range)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Location</h3>
                <p className="text-sm text-gray-600">
                  Location filtering will be available soon. For now, all startups are shown.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search startups by name, industry, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<Search size={18} />}
              fullWidth
            />

            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                {filteredEntrepreneurs.length} results
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
              <span className="ml-2 text-gray-600">Loading entrepreneurs...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600"
              >
                Try Again
              </button>
            </div>
          ) : filteredEntrepreneurs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No entrepreneurs found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEntrepreneurs.map(entrepreneur => (
                <EntrepreneurCard
                  key={entrepreneur.id}
                  entrepreneur={entrepreneur}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};