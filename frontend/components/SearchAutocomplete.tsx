"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Building, Briefcase, TrendingUp } from "lucide-react";

// Adjust this interface to match the JSON we return from /api/companies
interface CompanySuggestion {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
}

interface SearchAutocompleteProps {
  // Pass a callback that sets the selected symbol in parent (page.tsx)
  onSelectSymbol: (symbol: string) => void;
}

export function SearchAutocomplete({
  onSelectSymbol,
}: SearchAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions from our new backend route whenever inputValue changes
  useEffect(() => {
    if (inputValue.trim() === "") {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        // IMPORTANT: Replace the base URL with your Render backend domain if different
        // e.g. https://market-info-m22z.onrender.com/api/companies
        const res = await fetch(
          `https://market-info-m22z.onrender.com/api/companies?query=${encodeURIComponent(
            inputValue
          )}`
        );
        if (!res.ok) {
          console.error("Failed to fetch suggestions");
          return;
        }
        const data: CompanySuggestion[] = await res.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };

    fetchSuggestions();
  }, [inputValue]);

  // Close popup if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsPopupOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation in the dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isPopupOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectCompany(suggestions[selectedIndex].symbol);
    } else if (e.key === "Escape") {
      setIsPopupOpen(false);
    }
  };

  // When a suggestion is clicked or chosen
  const handleSelectCompany = (symbol: string) => {
    setInputValue(symbol);
    onSelectSymbol(symbol); // pass it back up to page.tsx
    setIsPopupOpen(false);
  };

  return (
    <div className="relative w-full">
      <Label htmlFor="symbol" className="text-sm text-gray-400 mb-2 block">
        Enter a symbol/ticker (e.g. AAPL)
      </Label>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <Input
          id="symbol"
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsPopupOpen(true);
          }}
          onFocus={() => setIsPopupOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 bg-gray-900/70 border-gray-800/50 focus:border-gray-600"
          placeholder="Search by symbol or company name"
          autoComplete="off"
        />
      </div>

      {isPopupOpen && suggestions.length > 0 && (
        <div
          ref={popupRef}
          className="absolute z-50 mt-1 w-full bg-gray-900 border border-gray-800 rounded-md shadow-lg max-h-80 overflow-y-auto"
        >
          <div className="p-2">
            <h3 className="text-xs font-semibold text-gray-400 mb-2 px-2">
              Suggestions
            </h3>
            <ul>
              {suggestions.map((company, index) => (
                <li key={company.symbol}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-md flex items-start hover:bg-gray-800 transition-colors ${
                      selectedIndex === index ? "bg-gray-800" : ""
                    }`}
                    onClick={() => handleSelectCompany(company.symbol)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex-shrink-0 mr-3 mt-1">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-white truncate">
                          {company.name}
                        </p>
                        <p className="text-sm font-bold text-gray-300">
                          {company.symbol}
                        </p>
                      </div>
                      <div className="flex items-center mt-1">
                        <Briefcase className="h-3 w-3 text-gray-500 mr-1" />
                        <p className="text-xs text-gray-500 mr-3">
                          {company.sector || "N/A"}
                        </p>
                        <TrendingUp className="h-3 w-3 text-gray-500 mr-1" />
                        <p className="text-xs text-gray-500">
                          {company.exchange || "N/A"}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
