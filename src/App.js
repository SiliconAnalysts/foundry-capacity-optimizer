import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users, BarChart, Settings } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const INITIAL_WEIGHTS = {
  price: 40,
  prepayment: 30,
  accuracy: 30
};

const INITIAL_CUSTOMERS = [
  {
    id: 1,
    name: "Customer A",
    requestedVolume: 1000,
    priceWillingToPay: 12000,
    prepayment: 30,
    forecastAccuracy: 90
  },
  {
    id: 2,
    name: "Customer B",
    requestedVolume: 800,
    priceWillingToPay: 11000,
    prepayment: 20,
    forecastAccuracy: 85
  },
  {
    id: 3,
    name: "Customer C",
    requestedVolume: 500,
    priceWillingToPay: 10000,
    prepayment: 10,
    forecastAccuracy: 80
  }
];

const FoundryCapacityOptimizer = () => {
  const [waferCost, setWaferCost] = useState(8000);
  const [totalCapacity, setTotalCapacity] = useState(2000);
  const [weights, setWeights] = useState(INITIAL_WEIGHTS);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);

  const handleWeightChange = (factor, value) => {
    const newValue = Number(value);
    const otherFactors = Object.keys(weights).filter(k => k !== factor);
    const remainingWeight = Math.max(0, 100 - newValue);
    const ratio = weights[otherFactors[0]] + weights[otherFactors[1]] === 0 ? 
      1 : remainingWeight / (weights[otherFactors[0]] + weights[otherFactors[1]]);
    
    setWeights({
      ...weights,
      [factor]: newValue,
      [otherFactors[0]]: Math.round(weights[otherFactors[0]] * ratio),
      [otherFactors[1]]: Math.round(weights[otherFactors[1]] * ratio)
    });
  };

  const calculateResults = () => {
    // Calculate scores and allocate capacity
    const maxPrice = Math.max(...customers.map(c => c.priceWillingToPay));
    const minPrice = Math.min(...customers.map(c => c.priceWillingToPay));
    const priceRange = maxPrice - minPrice;

    let scoredCustomers = customers.map(customer => {
      const normalizedScores = {
        price: priceRange === 0 ? 1 : (customer.priceWillingToPay - minPrice) / priceRange,
        prepayment: customer.prepayment / 100,
        accuracy: customer.forecastAccuracy / 100
      };

      const weightedScore = 
        normalizedScores.price * (weights.price / 100) +
        normalizedScores.prepayment * (weights.prepayment / 100) +
        normalizedScores.accuracy * (weights.accuracy / 100);

      return {
        ...customer,
        score: (weightedScore * 100).toFixed(1),
        normalizedScores
      };
    });

    // Sort and allocate capacity
    scoredCustomers.sort((a, b) => b.score - a.score);
    let remainingCapacity = totalCapacity;

    scoredCustomers = scoredCustomers.map(customer => {
      const allocation = Math.min(customer.requestedVolume, remainingCapacity);
      remainingCapacity -= allocation;

      const revenue = allocation * customer.priceWillingToPay;
      const cost = allocation * waferCost;
      const profit = revenue - cost;
      const margin = ((customer.priceWillingToPay - waferCost) / customer.priceWillingToPay) * 100;

      return {
        ...customer,
        allocation,
        fulfillmentRate: (allocation / customer.requestedVolume) * 100,
        financials: { revenue, cost, profit, margin }
      };
    });

    return {
      customers: scoredCustomers,
      summary: {
        totalRevenue: scoredCustomers.reduce((sum, c) => sum + c.financials.revenue, 0),
        totalProfit: scoredCustomers.reduce((sum, c) => sum + c.financials.profit, 0),
        capacityUtilization: ((totalCapacity - remainingCapacity) / totalCapacity) * 100,
        remainingCapacity
      }
    };
  };

  const [results, setResults] = useState(calculateResults());

  useEffect(() => {
    setResults(calculateResults());
  }, [customers, weights, totalCapacity, waferCost]);

  const chartData = results.customers.map(c => ({
    name: c.name,
    requested: c.requestedVolume,
    allocated: c.allocation
  }));

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <Alert className="bg-blue-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Optimize foundry capacity allocation across customers
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Base Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Manufacturing Cost per Wafer ($)
                </label>
                <input
                  type="number"
                  value={waferCost}
                  onChange={(e) => setWaferCost(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Total Capacity (wafers)
                </label>
                <input
                  type="number"
                  value={totalCapacity}
                  onChange={(e) => setTotalCapacity(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Scoring Weights (Total: 100%)</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(weights).map(([factor, value]) => (
                  <div key={factor}>
                    <label className="block text-sm font-medium mb-1 capitalize">
                      {factor} Weight (%)
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleWeightChange(factor, e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {customers.map((customer) => (
              <div key={customer.id} className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-3">{customer.name}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Volume Ask (wafers)
                    </label>
                    <input
                      type="number"
                      value={customer.requestedVolume}
                      onChange={(e) => {
                        setCustomers(prev => prev.map(c => 
                          c.id === customer.id ? {...c, requestedVolume: Number(e.target.value)} : c
                        ));
                      }}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Wafer Price ($)
                    </label>
                    <input
                      type="number"
                      value={customer.priceWillingToPay}
                      onChange={(e) => {
                        setCustomers(prev => prev.map(c => 
                          c.id === customer.id ? {...c, priceWillingToPay: Number(e.target.value)} : c
                        ));
                      }}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Prepayment (%)
                    </label>
                    <input
                      type="number"
                      value={customer.prepayment}
                      onChange={(e) => {
                        setCustomers(prev => prev.map(c => 
                          c.id === customer.id ? {...c, prepayment: Number(e.target.value)} : c
                        ));
                      }}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Demand Accuracy (%)
                    </label>
                    <input
                      type="number"
                      value={customer.forecastAccuracy}
                      onChange={(e) => {
                        setCustomers(prev => prev.map(c => 
                          c.id === customer.id ? {...c, forecastAccuracy: Number(e.target.value)} : c
                        ));
                      }}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Summary</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="block text-gray-600">Total Revenue</span>
                  <span className="font-medium">
                    ${(results.summary.totalRevenue / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div>
                  <span className="block text-gray-600">Total Profit</span>
                  <span className="font-medium">
                    ${(results.summary.totalProfit / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div>
                  <span className="block text-gray-600">Capacity Utilization</span>
                  <span className="font-medium">
                    {results.summary.capacityUtilization.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="block text-gray-600">Remaining Capacity</span>
                  <span className="font-medium">
                    {results.summary.remainingCapacity} wafers
                  </span>
                </div>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="requested" name="Requested Volume" fill="#8884d8" />
                  <Bar dataKey="allocated" name="Allocated Volume" fill="#82ca9d" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>

            {results.customers.map((customer) => (
              <div key={customer.id} className="p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">{customer.name}</h3>
                  <div className="flex gap-4">
                    <span className="text-sm bg-blue-100 px-2 py-1 rounded">
                      Score: {customer.score}
                    </span>
                    <span className="text-sm bg-green-100 px-2 py-1 rounded">
                      Fulfillment: {customer.fulfillmentRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Allocation Details:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Requested:</span>
                        <span>{customer.requestedVolume} wafers</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allocated:</span>
                        <span>{customer.allocation} wafers</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Financial Impact:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Revenue:</span>
                        <span>${(customer.financials.revenue / 1000000).toFixed(2)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit:</span>
                        <span>${(customer.financials.profit / 1000000).toFixed(2)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Margin:</span>
                        <span>{customer.financials.margin.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FoundryCapacityOptimizer;
