import os
import json
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

# 1) Stock Data Endpoint
@app.route("/api/stock/<string:ticker>", methods=["GET", "OPTIONS"])
def get_stock_data(ticker):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    advanced_mode = request.args.get("advanced", "false").lower() == "true"
    dividend_mode = request.args.get("dividend", "false").lower() == "true"

    # Fetch from Polygon for basic/advanced data
    polygon_url = f"https://api.polygon.io/v3/reference/tickers/{ticker}?apiKey={POLYGON_API_KEY}"
    try:
        polygon_resp = requests.get(polygon_url)
        polygon_data = polygon_resp.json()
    except Exception:
        return jsonify({"error": "Error fetching data from Polygon"}), 500

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
    cik = results.get("cik") if advanced_mode else None
    address = results.get("address", {}).get("address1") if advanced_mode else None
    post_code = results.get("address", {}).get("postal_code") if advanced_mode else None
    city = results.get("address", {}).get("city") if advanced_mode else None
    state = results.get("address", {}).get("state") if advanced_mode else None
    phone_number_advanced = results.get("phone_number") if advanced_mode else None
    primary_exchange = results.get("primary_exchange") if advanced_mode else None
    composite_figi = results.get("composite_figi") if advanced_mode else None
    share_class_figi = results.get("share_class_figi") if advanced_mode else None
    last_updated_utc = results.get("last_updated_utc") if advanced_mode else None
    type_ = results.get("type") if advanced_mode else None
    round_lot = results.get("round_lot") if advanced_mode else None

    # Dividend fields (from Polygon dividends)
    dividend_cash_amount = None
    dividend_declaration_date = None
    dividend_type = None
    ex_dividend_date = None
    frequency = None
    pay_date = None

    if dividend_mode:
        polygon_dividend_url = f"https://api.polygon.io/v3/reference/dividends?ticker={ticker}&apiKey={POLYGON_API_KEY}"
        try:
            dividend_resp = requests.get(polygon_dividend_url)
            dividend_data = dividend_resp.json()
        except Exception:
            return jsonify({"error": "Error fetching dividend data from Polygon"}), 500

        if "results" in dividend_data and isinstance(dividend_data["results"], list) and len(dividend_data["results"]) > 0:
            first_dividend = dividend_data["results"][0]
            dividend_cash_amount = first_dividend.get("cash_amount")
            dividend_declaration_date = first_dividend.get("declaration_date")
            dividend_type = first_dividend.get("dividend_type")
            ex_dividend_date = first_dividend.get("ex_dividend_date")
            frequency = first_dividend.get("frequency")
            pay_date = first_dividend.get("pay_date")

    # Real-time price from Finnhub
    finnhub_url = f"https://finnhub.io/api/v1/quote?symbol={ticker}&token={FINNHUB_API_KEY}"
    try:
        finnhub_resp = requests.get(finnhub_url)
        price_data = finnhub_resp.json()
    except Exception:
        return jsonify({"error": "Error fetching price data from Finnhub"}), 500

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

# 2) Historical Candlestick Data + Dividends Endpoint
@app.route("/api/stock/<string:ticker>/history", methods=["GET"])
def get_stock_history(ticker):
    """
    Return historical candlestick data using Financial Modeling Prep (FMP).
    If ?dividend=true, also return a 'dividends' array.
    Query param: timeframe=1D|1W|1M|6M|1Y|10Y
    """
    timeframe = request.args.get("timeframe", "1M").upper()
    dividend_mode = request.args.get("dividend", "false").lower() == "true"

    # Fetch historical data from FMP
    fmp_url = f"https://financialmodelingprep.com/api/v3/historical-price-full/{ticker}?serietype=line&apikey={FMP_API_KEY}"
    try:
        resp = requests.get(fmp_url)
        data = resp.json()
    except Exception:
        return jsonify({"error": "Error fetching historical data from FMP"}), 500

    if "historical" not in data or not data["historical"]:
        return jsonify({"error": "No historical data found or invalid ticker"}), 404

    # Sort ascending
    historical = sorted(data["historical"], key=lambda x: x["date"])
    now = datetime.now()
    cutoff_days = {"1D": 1, "1W": 7, "1M": 30, "6M": 180, "1Y": 365, "10Y": 3650}
    days = cutoff_days.get(timeframe, 30)
    cutoff = now - timedelta(days=days)
    filtered = [entry for entry in historical if datetime.strptime(entry["date"], "%Y-%m-%d") >= cutoff]
    if not filtered:
        return jsonify({"error": "No candle data found for the selected timeframe"}), 404

    candles = []
    candle_map = {}  # for dividend lookup: date string -> close price
    for entry in filtered:
        # Skip if required keys are missing
        if not all(k in entry for k in ["open", "high", "low", "close"]):
            continue
        dt_str = entry["date"]
        try:
            dt_obj = datetime.strptime(dt_str, "%Y-%m-%d")
        except Exception:
            continue
        t_unix = int(dt_obj.timestamp())
        try:
            o = float(entry["open"])
            h = float(entry["high"])
            l = float(entry["low"])
            c = float(entry["close"])
        except Exception:
            continue
        candles.append({"t": t_unix, "o": o, "h": h, "l": l, "c": c})
        candle_map[dt_str] = c

    # Fetch dividends if requested
    dividends = []
    if dividend_mode and POLYGON_API_KEY:
        polygon_dividend_url = f"https://api.polygon.io/v3/reference/dividends?ticker={ticker}&apiKey={POLYGON_API_KEY}"
        try:
            div_resp = requests.get(polygon_dividend_url)
            div_data = div_resp.json()
        except Exception:
            div_data = {}
        if "results" in div_data and isinstance(div_data["results"], list):
            for div_item in div_data["results"]:
                pay_date = div_item.get("pay_date")
                ex_date = div_item.get("ex_dividend_date")
                amount = div_item.get("cash_amount", 0)
                use_date = pay_date or ex_date
                if not use_date:
                    continue
                try:
                    dt_obj = datetime.strptime(use_date, "%Y-%m-%d")
                except:
                    continue
                if dt_obj < cutoff:
                    continue
                dt_str2 = dt_obj.strftime("%Y-%m-%d")
                if dt_str2 in candle_map:
                    c_price = candle_map[dt_str2]
                    t_unix = int(dt_obj.timestamp())
                    dividends.append({"t": t_unix, "y": c_price, "amount": amount})
    return jsonify({
        "timeframe": timeframe,
        "resolution": "D",
        "candles": candles,
        "dividends": dividends,
    })

# 3) Search Companies Endpoint
@app.route("/api/companies", methods=["GET", "OPTIONS"])
def search_companies():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    query = request.args.get("query", "").strip().lower()
    if not query:
        return jsonify([]), 200

    filtered = []
    for company in companies_data:
        company_name = company.get("Company Name") or ""
        company_symbol = company.get("Symbol") or ""
        if query in company_name.lower() or query in company_symbol.lower():
            filtered.append(company)
    result = []
    for company in filtered[:10]:
        result.append({
            "symbol": company.get("Symbol", "") or "",
            "name": company.get("Company Name", "") or "",
            "exchange": company.get("Market Category", "") or "",
            "sector": "",
        })
    return jsonify(result)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
