import os
import json
from datetime import datetime
from dotenv import load_dotenv
import requests
from flask import Flask, jsonify, request
import yfinance as yf  # <-- Yahoo Finance library

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

# 1) Fetch Stock Data (Polygon + Finnhub)
@app.route("/api/stock/<string:ticker>", methods=["GET", "OPTIONS"])
def get_stock_data(ticker):
    if request.method == "OPTIONS":
        return jsonify({}), 200

    advanced_mode = request.args.get("advanced", "false").lower() == "true"
    dividend_mode = request.args.get("dividend", "false").lower() == "true"

    # 1) Basic + Advanced from Polygon
    polygon_url = f"https://api.polygon.io/v3/reference/tickers/{ticker}?apiKey={POLYGON_API_KEY}"
    try:
        polygon_resp = requests.get(polygon_url)
        polygon_data = polygon_resp.json()
    except:
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
        except:
            return jsonify({"error": "Error fetching dividend data from Polygon"}), 500

        if "results" in dividend_data and isinstance(dividend_data["results"], list):
            if len(dividend_data["results"]) > 0:
                first_dividend = dividend_data["results"][0]
                dividend_cash_amount = first_dividend.get("cash_amount")
                dividend_declaration_date = first_dividend.get("declaration_date")
                dividend_type = first_dividend.get("dividend_type")
                ex_dividend_date = first_dividend.get("ex_dividend_date")
                frequency = first_dividend.get("frequency")
                pay_date = first_dividend.get("pay_date")

    # 2) Real-time price from Finnhub
    finnhub_url = f"https://finnhub.io/api/v1/quote?symbol={ticker}&token={FINNHUB_API_KEY}"
    try:
        finnhub_resp = requests.get(finnhub_url)
        price_data = finnhub_resp.json()
    except:
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

# 2) Historical Data from Yahoo Finance
@app.route("/api/stock/<string:ticker>/history", methods=["GET"])
def get_stock_history(ticker):
    """
    Return historical candlestick data using yfinance.
    If ?dividend=true, also return 'dividends' from yfinance's Dividends info.
    Query param: timeframe=1D|1W|1M|6M|1Y|10Y
    """
    timeframe = request.args.get("timeframe", "1M").upper()
    dividend_mode = request.args.get("dividend", "false").lower() == "true"

    # Map timeframe to yfinance 'period'
    # (yfinance supports: 1d,5d,1mo,3mo,6mo,1y,5y,10y,ytd,max)
    period_map = {
        "1D": "1d",   # yfinance "1 day" data
        "1W": "5d",   # not a perfect match, but let's do 5 days
        "1M": "1mo",
        "6M": "6mo",
        "1Y": "1y",
        "10Y": "10y",
    }
    y_period = period_map.get(timeframe, "1mo")

    # Use yfinance to download data
    # interval default is 1d. If you want intraday, specify interval='1h', etc.
    try:
        ticker_obj = yf.Ticker(ticker)
        hist = ticker_obj.history(period=y_period, interval="1d", actions=True)
    except Exception as e:
        return jsonify({"error": f"Error fetching data from yfinance: {str(e)}"}), 500

    if hist.empty:
        return jsonify({"candles": [], "dividends": [], "timeframe": timeframe}), 200

    # Build candlestick array
    # hist index is DatetimeIndex, columns: Open, High, Low, Close, Dividends, Stock Splits
    candles = []
    dividends = []

    for date, row in hist.iterrows():
        # row["Open"], row["High"], row["Low"], row["Close"], row["Dividends"]
        try:
            t_unix = int(date.timestamp())
            o = float(row["Open"])
            h = float(row["High"])
            l = float(row["Low"])
            c = float(row["Close"])
            candles.append({
                "t": t_unix,
                "o": o,
                "h": h,
                "l": l,
                "c": c,
            })

            # If user wants dividends, check row["Dividends"]
            if dividend_mode:
                div_amount = float(row.get("Dividends", 0.0))
                if div_amount != 0.0:
                    # We'll place a dot at that day's close
                    dividends.append({
                        "t": t_unix,
                        "y": c,           # place the dot at the close price
                        "amount": div_amount,
                    })
        except:
            continue

    return jsonify({
        "timeframe": timeframe,
        "candles": candles,
        "dividends": dividends,
    })

# 3) Search Companies from Local Database
@app.route("/api/companies", methods=["GET", "OPTIONS"])
def search_companies():
    if request.method == "OPTIONS":
        return jsonify({}), 200  # CORS preflight

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
