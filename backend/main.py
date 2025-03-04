import os
import json
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
import requests
from flask import Flask, jsonify, request

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)

# Enable CORS for all responses
@app.after_request
def add_cors_headers(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,OPTIONS")
    return response

# Environment variables for API keys (used by other endpoints)
POLYGON_API_KEY = os.getenv("POLYGON_API_KEY")
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
FMP_API_KEY = os.getenv("FMP_API_KEY")  # Financial Modeling Prep API key

# -----------------------------------------------------------------------------
# LOAD LOCAL COMPANIES DATABASE
# -----------------------------------------------------------------------------
# The file companies.json should be in the same directory as main.py.
# Example object in companies.json:
# {
#   "Symbol": "AACBU",
#   "Company Name": "Artius II Acquisition Inc.",
#   "Security Name": "Artius II Acquisition Inc. - Units",
#   "Market Category": "G",
#   "Test Issue": "N",
#   "Financial Status": "N",
#   "Round Lot Size": 100,
#   "ETF": "N",
#   "NextShares": "N"
# }
try:
    with open("companies.json", "r") as f:
        companies_data = json.load(f)
except Exception as e:
    companies_data = []
    print("Error loading companies.json:", e)

# -----------------------------------------------------------------------------
# ENDPOINTS
# -----------------------------------------------------------------------------

@app.route("/", methods=["GET"])
def hello():
    return "Backend Debugging Successful"

# Endpoint to fetch stock data using Polygon and Finnhub
@app.route("/api/stock/<string:ticker>", methods=["GET", "OPTIONS"])
def get_stock_data(ticker):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    advanced_mode = request.args.get("advanced", "false").lower() == "true"
    dividend_mode = request.args.get("dividend", "false").lower() == "true"

    # 1) Fetch from Polygon for basic/advanced data
    polygon_url = f"https://api.polygon.io/v3/reference/tickers/{ticker}?apiKey={POLYGON_API_KEY}"
    polygon_resp = requests.get(polygon_url)
    try:
        polygon_data = polygon_resp.json()
    except:
        return jsonify({"error": "Unable to parse JSON from Polygon (tickers)."}), 500

    if "results" not in polygon_data:
        return jsonify({"error": "Ticker not found or invalid Polygon response"}), 404

    results = polygon_data["results"]

    # Basic data
    company_name = results.get("name", "")
    market_cap   = results.get("market_cap", 0)
    ticker_market = results.get("market")
    currency = results.get("currency_name")
    website = results.get("homepage_url")
    listed_on = results.get("list_date")
    country = results.get("locale")
    phone_number_basic = results.get("phone_number")

    # Advanced fields
    cik = None
    address = None
    post_code = None
    state = None
    city = None
    phone_number_advanced = None
    primary_exchange = None
    composite_figi = None
    share_class_figi = None
    last_updated_utc = None
    round_lot = None
    type_ = None

    if advanced_mode:
        cik           = results.get("cik")
        address       = results.get("address", {}).get("address1")
        post_code     = results.get("address", {}).get("postal_code")
        city          = results.get("address", {}).get("city")
        state         = results.get("address", {}).get("state")
        phone_number_advanced = results.get("phone_number")
        primary_exchange = results.get("primary_exchange")
        share_class_figi = results.get("share_class_figi")
        composite_figi = results.get("composite_figi")
        last_updated_utc = results.get("last_updated_utc")
        type_ = results.get("type")
        round_lot = results.get("round_lot")

    # Dividend fields
    dividend_cash_amount = None
    dividend_declaration_date = None
    dividend_type = None
    ex_dividend_date = None
    frequency = None
    pay_date = None

    if dividend_mode:
        polygon_dividend_url = f"https://api.polygon.io/v3/reference/dividends?ticker={ticker}&apiKey={POLYGON_API_KEY}"
        dividend_resp = requests.get(polygon_dividend_url)
        try:
            dividend_data = dividend_resp.json()
        except:
            return jsonify({"error": "Unable to parse JSON from Polygon (dividends)."}), 500

        if "results" in dividend_data and isinstance(dividend_data["results"], list):
            if len(dividend_data["results"]) > 0:
                first_dividend = dividend_data["results"][0]
                dividend_cash_amount = first_dividend.get("cash_amount")
                dividend_declaration_date = first_dividend.get("declaration_date")
                dividend_type = first_dividend.get("dividend_type")
                ex_dividend_date = first_dividend.get("ex_dividend_date")
                frequency = first_dividend.get("frequency")
                pay_date = first_dividend.get("pay_date")

    # 2) Fetch real-time price from Finnhub
    finnhub_url = f"https://finnhub.io/api/v1/quote?symbol={ticker}&token={FINNHUB_API_KEY}"
    finnhub_resp = requests.get(finnhub_url)
    price_data = finnhub_resp.json()
    current_price = price_data.get("c")
    price_change = price_data.get("d")
    percent_change = price_data.get("dp")

    return jsonify({
        "ticker": ticker,
        "companyName": company_name,
        "marketCap": market_cap,
        "market": ticker_market,
        "currency": currency,
        "website": website,
        "country": country,
        "listedOn": listed_on,
        "number": phone_number_basic,
        "cik": cik,
        "address": address,
        "postCode": post_code,
        "city": city,
        "state": state,
        "phoneNumber": phone_number_advanced,
        "primaryExchange": primary_exchange,
        "shareClassFigi": share_class_figi,
        "compositeFigi": composite_figi,
        "lastUpdatedUtc": last_updated_utc,
        "roundLot": round_lot,
        "type": type_,
        "dividendCashAmount": dividend_cash_amount,
        "dividendDeclarationDate": dividend_declaration_date,
        "dividendType": dividend_type,
        "exDividendDate": ex_dividend_date,
        "frequency": frequency,
        "payDate": pay_date,
        "realTimePrice": current_price,
        "priceChange": price_change,
        "percentChange": percent_change,
    })

# Endpoint for historical stock data using Financial Modeling Prep
@app.route("/api/stock/<string:ticker>/history", methods=["GET"])
def get_stock_history(ticker):
    """
    Return historical candle data using Financial Modeling Prep.
    Endpoint:
      https://financialmodelingprep.com/api/v3/historical-price-full/{ticker}?serietype=line&apikey=FMP_API_KEY
    Query param: timeframe=1D|1W|1M|6M|1Y|10Y
    """
    timeframe = request.args.get("timeframe", "1M").upper()

    # Build the URL for Financial Modeling Prep
    fmp_url = f"https://financialmodelingprep.com/api/v3/historical-price-full/{ticker}?serietype=line&apikey={FMP_API_KEY}"
    resp = requests.get(fmp_url)
    data = resp.json()

    if "historical" not in data or not data["historical"]:
        return jsonify({"error": "No historical data found or invalid ticker"}), 404

    # Sort historical data by date ascending
    historical = sorted(data["historical"], key=lambda x: x["date"])
    now = datetime.now()
    cutoff_days = {
        "1D": 1,
        "1W": 7,
        "1M": 30,
        "6M": 180,
        "1Y": 365,
        "10Y": 3650,
    }
    days = cutoff_days.get(timeframe, 30)
    cutoff = now - timedelta(days=days)
    filtered = [
        entry for entry in historical
        if datetime.strptime(entry["date"], "%Y-%m-%d") >= cutoff
    ]
    if not filtered:
        return jsonify({"error": "No candle data found for the selected timeframe"}), 404

    timestamps = []
    closePrices = []
    for entry in filtered:
        dt = datetime.strptime(entry["date"], "%Y-%m-%d")
        timestamps.append(int(dt.timestamp()))
        closePrices.append(float(entry["close"]))

    return jsonify({
        "timeframe": timeframe,
        "resolution": "D",
        "timestamps": timestamps,
        "closePrices": closePrices,
    })

# -----------------------------------------------------------------------------
# NEW ENDPOINT: Search Companies from Local Database
# -----------------------------------------------------------------------------
@app.route("/api/companies", methods=["GET", "OPTIONS"])
def search_companies():
    if request.method == "OPTIONS":
        return jsonify({}), 200  # Handle CORS preflight

    query = request.args.get("query", "").strip().lower()
    if not query:
        return jsonify([]), 200

    filtered = []
    for company in companies_data:
        # Safely convert None to "" so we can call .lower()
        company_name = company.get("Company Name") or ""
        company_symbol = company.get("Symbol") or ""
        # Match either company name or symbol
        if query in company_name.lower() or query in company_symbol.lower():
            filtered.append(company)

    # Map results to the shape your frontend expects
    result = []
    for company in filtered[:10]:
        result.append({
            "symbol": company.get("Symbol", "") or "",
            "name": company.get("Company Name", "") or "",
            "exchange": company.get("Market Category", "") or "",
            "sector": ""  # or something else if you have it
        })
    return jsonify(result)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
