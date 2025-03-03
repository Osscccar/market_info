import os
import time
from dotenv import load_dotenv
import requests
from flask import Flask, jsonify, request

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)

@app.after_request
def add_cors_headers(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,OPTIONS")
    return response

# Environment variables
POLYGON_API_KEY = os.getenv("POLYGON_API_KEY")
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")

@app.route("/", methods=["GET"])
def hello():
    return "Backend Debugging Successful"

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
    except Exception as e:
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
        except Exception as e:
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
    finnhub_url = f"https://finnhub.io/api/v1/quote?symbol={ticker.upper()}&token={FINNHUB_API_KEY}"
    finnhub_resp = requests.get(finnhub_url)
    price_data = finnhub_resp.json()
    current_price = price_data.get("c")
    price_change = price_data.get("d")
    percent_change = price_data.get("dp")

    return jsonify({
        # Basic
        "ticker": ticker,
        "companyName": company_name,
        "marketCap": market_cap,
        "market": ticker_market,
        "currency": currency,
        "website": website,
        "country": country,
        "listedOn": listed_on,
        "number": phone_number_basic,

        # Advanced
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

        # Dividend
        "dividendCashAmount": dividend_cash_amount,
        "dividendDeclarationDate": dividend_declaration_date,
        "dividendType": dividend_type,
        "exDividendDate": ex_dividend_date,
        "frequency": frequency,
        "payDate": pay_date,

        # Real-time price
        "realTimePrice": current_price,
        "priceChange": price_change,
        "percentChange": percent_change,
    })

@app.route("/api/stock/<string:ticker>/history", methods=["GET"])
def get_stock_history(ticker):
    """
    Return historical price data for the given ticker over a timeframe:
    ?timeframe=1D|1W|1M|6M|1Y|10Y
    """
    timeframe = request.args.get("timeframe", "1M")
    now = int(time.time())

    seconds_map = {
        "1D": 86400,
        "1W": 604800,
        "1M": 2592000,
        "6M": 15552000,
        "1Y": 31536000,
        "10Y": 315360000,
    }
    secs = seconds_map.get(timeframe, 2592000)
    from_epoch = now - secs

    # For 1D, use 5-minute resolution; otherwise daily
    resolution = "5" if timeframe == "1D" else "D"

    candle_url = "https://finnhub.io/api/v1/stock/candle"
    params = {
        "symbol": ticker.upper(),
        "resolution": resolution,
        "from": from_epoch,
        "to": now,
        "token": FINNHUB_API_KEY
    }
    resp = requests.get(candle_url, params=params)
    data = resp.json()

    if data.get("s") != "ok":
        return jsonify({"error": "No candle data found or invalid ticker"}), 404

    return jsonify({
        "timeframe": timeframe,
        "resolution": resolution,
        "timestamps": data.get("t", []),
        "closePrices": data.get("c", []),
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
