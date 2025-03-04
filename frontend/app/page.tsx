"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { TrendingUp, DollarSign, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Import our new search component
import { SearchAutocomplete } from "@/components/SearchAutocomplete";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend
);

interface StockData {
  // Basic
  ticker: string;
  companyName: string;
  marketCap: number;
  market: string;
  currency: string;
  website: string;
  country: string;
  listedOn: string;
  number?: string;

  // Advanced
  primaryExchange?: string;
  shareClassFigi?: string;
  cik?: string;
  address?: string;
  postCode?: string;
  city?: string;
  state?: string;
  roundLot?: number;
  type?: string;
  lastUpdatedUtc?: string;
  compositeFigi?: string;
  phoneNumber?: string;

  // Dividend
  dividendCashAmount?: number;
  dividendDeclarationDate?: string;
  dividendType?: string;
  exDividendDate?: string;
  frequency?: number;
  payDate?: string;

  // Real-time
  realTimePrice?: number;
  priceChange?: number;
  percentChange?: number;
}

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [dividendMode, setDividendMode] = useState(false);

  // For chart
  const [timeframe, setTimeframe] = useState("1M");
  const [chartLoading, setChartLoading] = useState(false);
  const [chartData, setChartData] = useState<{
    timestamps: number[];
    closePrices: number[];
  } | null>(null);
  const timeframeOptions = ["1D", "1W", "1M", "6M", "1Y", "10Y"];

  // Fetch main stock data and then automatically fetch 1M chart data
  async function handleFetch() {
    setError("");
    setStockData(null);

    if (!ticker) {
      setError("Please enter a ticker symbol.");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (advancedMode) params.append("advanced", "true");
      if (dividendMode) params.append("dividend", "true");

      const url = `https://market-info-m22z.onrender.com/api/stock/${ticker}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Unknown error from backend.");
        return;
      }
      const data = await res.json();
      setStockData(data);
      // Automatically load 1M chart data after main data is fetched
      await fetchChartData("1M");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Fetch chart data
  async function fetchChartData(tf: string) {
    if (!ticker) return;
    setChartLoading(true);
    setError("");
    try {
      const url = `https://market-info-m22z.onrender.com/api/stock/${ticker}/history?timeframe=${tf}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Unknown error from backend.");
        setChartData(null);
        return;
      }
      const data = await res.json();
      setChartData({
        timestamps: data.timestamps,
        closePrices: data.closePrices,
      });
    } catch (err: any) {
      setError(err.message);
      setChartData(null);
    } finally {
      setChartLoading(false);
    }
  }

  // Re-fetch chart data when timeframe changes
  useEffect(() => {
    if (ticker) {
      fetchChartData(timeframe);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe]);

  // Toggle handlers
  function handleAdvancedToggle(val: boolean) {
    setAdvancedMode(val);
    if (ticker.trim() !== "") {
      handleFetch();
    }
  }

  function handleDividendToggle(val: boolean) {
    setDividendMode(val);
    if (ticker.trim() !== "") {
      handleFetch();
    }
  }

  // Prepare chart.js data
  const chartJsData = chartData
    ? {
        labels: chartData.timestamps.map((ts) => {
          const d = new Date(ts * 1000);
          return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "2-digit",
          });
        }),
        datasets: [
          {
            label: "Price",
            data: chartData.closePrices,
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56,189,248,0.1)",
            tension: 0.3,
          },
        ],
      }
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8">
        {/* Input & Toggles at the Top */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Stock Information</h1>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end mb-6">
            {/* SearchAutocomplete replaces the old manual Input */}
            <div className="w-full md:w-1/2">
              <SearchAutocomplete
                onSelectSymbol={(symbol) => {
                  // Update ticker in state when user picks a suggestion
                  setTicker(symbol.toUpperCase());
                }}
              />
            </div>

            <Button
              onClick={handleFetch}
              className="bg-gray-800 hover:bg-gray-700 text-white"
              disabled={loading || !ticker}
            >
              {loading ? "Loading..." : "Fetch"}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="advanced-mode"
                checked={advancedMode}
                onCheckedChange={handleAdvancedToggle}
              />
              <label htmlFor="advanced-mode" className="text-gray-300 text-sm">
                Advanced Mode
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="dividend-mode"
                checked={dividendMode}
                onCheckedChange={handleDividendToggle}
              />
              <label htmlFor="dividend-mode" className="text-gray-300 text-sm">
                Dividend Mode
              </label>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 mt-4">{error}</p>}
        {loading && <LoadingSpinner />}

        {/* Stock Data Section (Below Input) */}
        {stockData && (
          <>
            {/* Price Section */}
            <div className="flex items-center justify-between bg-gray-900/50 border border-gray-800/50 rounded-lg p-4 mb-6">
              <div>
                <p className="text-sm text-gray-400">
                  {stockData.ticker.toUpperCase()}
                </p>
                <h2 className="text-4xl font-bold">
                  {stockData.realTimePrice !== undefined
                    ? `$${stockData.realTimePrice.toFixed(2)}`
                    : "N/A"}
                </h2>
              </div>
              <div className="text-right">
                {stockData.priceChange !== undefined &&
                stockData.percentChange !== undefined ? (
                  <p
                    className={`text-lg font-medium ${
                      stockData.priceChange >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {stockData.priceChange >= 0 ? "+" : ""}
                    {stockData.priceChange.toFixed(2)} (
                    {stockData.percentChange >= 0 ? "+" : ""}
                    {stockData.percentChange.toFixed(2)}%)
                  </p>
                ) : (
                  <p className="text-gray-400">--</p>
                )}
              </div>
            </div>

            {/* Cards Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Info Card */}
              <Card className="bg-gray-900/50 border-gray-800/50">
                <CardHeader className="border-b border-gray-800/50 pb-3">
                  <CardTitle className="flex items-center text-xl">
                    <Info className="mr-2" size={18} />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Company Name:</span>
                    <span className="font-medium">
                      {stockData.companyName || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Market Cap:</span>
                    <span className="font-medium">
                      {stockData.marketCap
                        ? `$${stockData.marketCap.toLocaleString()}`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Market Type:</span>
                    <span className="font-medium">
                      {stockData.market || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Currency:</span>
                    <span className="font-medium">
                      {stockData.currency || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Website:</span>
                    <span className="font-medium text-blue-400 hover:underline">
                      <a
                        href={stockData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {stockData.website || "N/A"}
                      </a>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Country Based:</span>
                    <span className="font-medium">
                      {stockData.country || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stock Listed On:</span>
                    <span className="font-medium">
                      {stockData.listedOn || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Phone Number:</span>
                    <span className="font-medium">
                      {stockData.number || "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Info Card */}
              {advancedMode && (
                <Card className="bg-gray-900/50 border-gray-800/50">
                  <CardHeader className="border-b border-gray-800/50 pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <TrendingUp className="mr-2" size={18} />
                      Advanced Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Primary Exchange:</span>
                      <span className="font-medium">
                        {stockData.primaryExchange || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Share Class Figi:</span>
                      <span className="font-medium">
                        {stockData.shareClassFigi || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">CIK:</span>
                      <span className="font-medium">
                        {stockData.cik || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Address:</span>
                      <span className="font-medium">
                        {stockData.address || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Post Code:</span>
                      <span className="font-medium">
                        {stockData.postCode || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">City:</span>
                      <span className="font-medium">
                        {stockData.city || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">State:</span>
                      <span className="font-medium">
                        {stockData.state || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone (Adv.):</span>
                      <span className="font-medium">
                        {stockData.phoneNumber || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="font-medium">
                        {stockData.type || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Updated UTC:</span>
                      <span className="font-medium">
                        {stockData.lastUpdatedUtc || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Composite Figi:</span>
                      <span className="font-medium">
                        {stockData.compositeFigi || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Round Lot:</span>
                      <span className="font-medium">
                        {stockData.roundLot || "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dividend Info Card */}
              {dividendMode && (
                <Card className="bg-gray-900/50 border-gray-800/50">
                  <CardHeader className="border-b border-gray-800/50 pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <DollarSign className="mr-2" size={18} />
                      Dividend Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">
                        Dividend Cash Amount:
                      </span>
                      <span className="font-medium">
                        {stockData.dividendCashAmount !== undefined
                          ? stockData.dividendCashAmount
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">
                        Dividend Declaration Date:
                      </span>
                      <span className="font-medium">
                        {stockData.dividendDeclarationDate !== undefined
                          ? stockData.dividendDeclarationDate
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dividend Type:</span>
                      <span className="font-medium">
                        {stockData.dividendType !== undefined
                          ? stockData.dividendType
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ex Dividend Date:</span>
                      <span className="font-medium">
                        {stockData.exDividendDate !== undefined
                          ? stockData.exDividendDate
                          : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Price History Card (Line Chart) */}
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-4 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">
                  Price History: {stockData.ticker.toUpperCase()}
                </h3>
                <div className="flex space-x-2">
                  {timeframeOptions.map((tf) => (
                    <Button
                      key={tf}
                      variant={tf === timeframe ? "default" : "ghost"}
                      onClick={() => setTimeframe(tf)}
                    >
                      {tf}
                    </Button>
                  ))}
                </div>
              </div>
              {chartLoading && (
                <p className="text-gray-400">Loading chart...</p>
              )}
              {!chartLoading && chartData && (
                <div className="h-80">
                  <Line
                    data={{
                      labels: chartData.timestamps.map((ts) => {
                        const d = new Date(ts * 1000);
                        return d.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "2-digit",
                        });
                      }),
                      datasets: [
                        {
                          label: "Price",
                          data: chartData.closePrices,
                          borderColor: "#38bdf8",
                          backgroundColor: "rgba(56,189,248,0.1)",
                          tension: 0.3,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        x: { display: true },
                        y: { display: true, beginAtZero: false },
                      },
                      plugins: {
                        legend: { display: false },
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
