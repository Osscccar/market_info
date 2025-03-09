"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { TrendingUp, DollarSign, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";

// -----------------------------------------
// New imports for Chart.js and plugins
// -----------------------------------------
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns"; // Adapter for time scale
import {
  CandlestickController,
  CandlestickElement,
} from "chartjs-chart-financial";
import crosshairPlugin from "chartjs-plugin-crosshair";
import { Chart } from "react-chartjs-2";

import { SearchAutocomplete } from "@/components/SearchAutocomplete";

// Register Chart.js components and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  CandlestickController,
  CandlestickElement,
  Tooltip,
  Legend,
  crosshairPlugin
);

// Types for candlestick and dividend data
interface CandleData {
  t: number; // Unix timestamp in seconds
  o: number;
  h: number;
  l: number;
  c: number;
}
interface DividendData {
  t: number; // Unix timestamp in seconds
  y: number; // Price at that date
  amount: number;
}
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
  // Dividend (from stockData endpoint)
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

  // Chart data states
  const [timeframe, setTimeframe] = useState("1M");
  const [chartLoading, setChartLoading] = useState(false);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [dividends, setDividends] = useState<DividendData[]>([]);

  const timeframeOptions = ["1D", "1W", "1M", "6M", "1Y", "10Y"];

  // ------------------------------------------------
  // 1) Fetch main stock data
  // ------------------------------------------------
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
      await fetchCandlestickData("1M");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------
  // 2) Fetch Candlestick + Dividend Data
  // ------------------------------------------------
  async function fetchCandlestickData(tf: string) {
    if (!ticker) return;
    setChartLoading(true);
    setError("");

    try {
      const urlParams = new URLSearchParams();
      urlParams.append("timeframe", tf);
      if (dividendMode) {
        urlParams.append("dividend", "true");
      }
      const url = `https://market-info-m22z.onrender.com/api/stock/${ticker}/history?${urlParams.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Unknown error from backend.");
        setCandles([]);
        setDividends([]);
        return;
      }
      const data = await res.json();
      if (data.candles) {
        setCandles(data.candles);
      } else {
        setCandles([]);
      }
      if (data.dividends) {
        setDividends(data.dividends);
      } else {
        setDividends([]);
      }
    } catch (err: any) {
      setError(err.message);
      setCandles([]);
      setDividends([]);
    } finally {
      setChartLoading(false);
    }
  }

  // Re-fetch chart data when timeframe changes
  useEffect(() => {
    if (ticker) {
      fetchCandlestickData(timeframe);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe]);

  // Toggle handlers
  function handleAdvancedToggle(val: boolean) {
    setAdvancedMode(val);
  }

  function handleDividendToggle(val: boolean) {
    setDividendMode(val);
  }

  // ------------------------------------------------
  // Build Chart.js data for Candlestick & Dividend points
  // ------------------------------------------------
  const chartData = {
    datasets: [
      {
        label: "Candlestick",
        data: candles.map((c) => ({
          x: c.t * 1000, // convert seconds to ms
          o: c.o,
          h: c.h,
          l: c.l,
          c: c.c,
        })),
        type: "candlestick" as const,
        color: {
          up: "#22c55e", // green for bullish
          down: "#ef4444", // red for bearish
          unchanged: "#999999",
        },
      },
      {
        label: "Dividends",
        data: dividends.map((d) => ({
          x: d.t * 1000,
          y: d.y,
        })),
        type: "scatter" as const,
        pointBackgroundColor: "#eab308", // gold
        pointRadius: 5,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "time", // time scale using chartjs-adapter-date-fns
        time: { unit: "day" },
        display: true,
      },
      y: { display: true, beginAtZero: false },
    },
    interaction: { mode: "nearest", intersect: false },
    plugins: {
      legend: { display: false },
      crosshair: {
        line: { color: "#999999", width: 1 },
        sync: { enabled: false },
        zoom: { enabled: false },
        snap: { enabled: true },
      },
    },
  };

  // ------------------------------------------------
  // Render
  // ------------------------------------------------
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8">
        {/* Input & Toggles */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Stock Information</h1>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end mb-6">
            <div className="w-full md:w-1/2">
              <SearchAutocomplete
                onSelectSymbol={(symbol) => {
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

              {advancedMode && (
                <Card className="bg-gray-900/50 border-gray-800/50">
                  <CardHeader className="border-b border-gray-800/50 pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <TrendingUp className="mr-2" size={18} />
                      Advanced Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 text-sm">
                    {/* Add your advanced fields here */}
                  </CardContent>
                </Card>
              )}

              {dividendMode && (
                <Card className="bg-gray-900/50 border-gray-800/50">
                  <CardHeader className="border-b border-gray-800/50 pb-3">
                    <CardTitle className="flex items-center text-xl">
                      <DollarSign className="mr-2" size={18} />
                      Dividend Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 text-sm">
                    {/* Add your dividend fields here */}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Price History Card (Candlestick Chart with Dividends and Crosshair) */}
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
              {!chartLoading && candles.length > 0 && (
                <div className="h-80">
                  <Chart
                    type="candlestick"
                    data={chartData}
                    options={chartOptions}
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
