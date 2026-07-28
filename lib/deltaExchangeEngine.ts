import crypto from "crypto";
import WebSocket from "ws";

export interface DeltaProduct {
  id: number;
  symbol: string;
  description: string;
  underlying_asset: { symbol: string };
  quoting_asset: { symbol: string };
  product_type: string; // perpetual_futures, call_options, put_options, move_options
  tick_size: string;
  contract_value: string;
  state: string; // live, expired
}

export interface DeltaTicker {
  symbol: string;
  mark_price: string;
  close: string;
  open: string;
  high: string;
  low: string;
  volume: number;
  oi: string; // open interest
  timestamp: number;
  funding_rate?: string;
  turnover_usd?: number;
  leverage?: number;
  quotes?: {
    best_bid: string;
    best_ask: string;
  };
}

export interface DeltaCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type TickListener = (symbol: string, priceINR: number, priceUSD: number, volume: number) => void;

// ------ Delta Exchange India REST + WebSocket Engine ------

const BASE_URL = "https://api.india.delta.exchange/v2";
const WS_URL = "wss://socket.india.delta.exchange";

class DeltaExchangeEngine {
  private apiKey: string;
  private apiSecret: string;
  private products: Map<string, DeltaProduct> = new Map(); // symbol -> product
  private productIdMap: Map<number, DeltaProduct> = new Map(); // id -> product
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 20;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private tickListeners: TickListener[] = [];
  private usdInrRate: number = 83.50; // Fallback, updated live
  private lastPrices: Map<string, { usd: number; inr: number; volume: number; timestamp: number }> = new Map();

  // Default crypto symbols to track
  private defaultSymbols: string[] = [
    "BTCUSD", "ETHUSD", "SOLUSD", "XRPUSD", "DOGEUSD",
    "BNBUSD", "ADAUSD", "AVAXUSD", "DOTUSD", "LINKUSD",
    "BTCUSDT", "ETHUSDT"
  ];

  constructor() {
    this.apiKey = process.env.DELTA_EXCHANGE_API_KEY || "";
    this.apiSecret = process.env.DELTA_EXCHANGE_API_SECRET || "";
    if (this.apiKey) {
      console.log(`[DeltaExchange] 🟢 API Key loaded: ${this.apiKey.slice(0, 8)}...`);
    } else {
      console.warn("[DeltaExchange] ⚠️ No API key found in DELTA_EXCHANGE_API_KEY env var");
    }
  }

  // ────────────────────────────────────────────
  // HMAC-SHA256 Signature Generation
  // ────────────────────────────────────────────
  private generateSignature(method: string, path: string, queryString: string = "", body: string = ""): { signature: string; timestamp: string } {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const prehash = method.toUpperCase() + timestamp + path + queryString + body;
    const signature = crypto
      .createHmac("sha256", this.apiSecret)
      .update(prehash)
      .digest("hex");
    return { signature, timestamp };
  }

  private getAuthHeaders(method: string, path: string, queryString: string = "", body: string = ""): Record<string, string> {
    const { signature, timestamp } = this.generateSignature(method, path, queryString, body);
    return {
      "api-key": this.apiKey,
      "timestamp": timestamp,
      "signature": signature,
      "Content-Type": "application/json",
      "User-Agent": "DeltaExchangeEngine/1.0"
    };
  }

  // ────────────────────────────────────────────
  // USD/INR Rate Fetcher (Live)
  // ────────────────────────────────────────────
  public async fetchUsdInrRate(): Promise<number> {
    try {
      const res = await fetch("https://query2.finance.yahoo.com/v8/finance/chart/USDINR=X?range=1d&interval=1m", {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      if (res.ok) {
        const json: any = await res.json();
        const rate = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (rate && rate > 50 && rate < 150) {
          this.usdInrRate = Number(rate.toFixed(2));
          console.log(`[DeltaExchange] 💱 USD/INR rate updated: ₹${this.usdInrRate}`);
        }
      }
    } catch (e) {
      // Keep existing fallback rate
    }
    return this.usdInrRate;
  }

  public getUsdInrRate(): number {
    return this.usdInrRate;
  }

  // ────────────────────────────────────────────
  // REST API: Fetch All Products
  // ────────────────────────────────────────────
  public async fetchProducts(): Promise<DeltaProduct[]> {
    try {
      const path = "/v2/products";
      const res = await fetch(`${BASE_URL}/products`, {
        headers: { "Content-Type": "application/json", "User-Agent": "DeltaExchangeEngine/1.0" }
      });
      if (!res.ok) {
        console.warn(`[DeltaExchange] ❌ Products fetch failed: HTTP ${res.status}`);
        return [];
      }
      const json: any = await res.json();
      const products: DeltaProduct[] = json?.result || json || [];

      this.products.clear();
      this.productIdMap.clear();
      let count = 0;
      for (const p of products) {
        if (p.state === "live" && p.symbol) {
          this.products.set(p.symbol.toUpperCase(), p);
          this.productIdMap.set(p.id, p);
          count++;
        }
      }
      console.log(`[DeltaExchange] 📦 Loaded ${count} live products from Delta Exchange India`);
      return products.filter(p => p.state === "live");
    } catch (e: any) {
      console.warn(`[DeltaExchange] ❌ Products fetch error: ${e.message}`);
      return [];
    }
  }

  // ────────────────────────────────────────────
  // REST API: Fetch Ticker (Single Symbol)
  // ────────────────────────────────────────────
  public async fetchTicker(symbol: string): Promise<DeltaTicker | null> {
    try {
      const res = await fetch(`${BASE_URL}/tickers/${symbol.toUpperCase()}`, {
        headers: { "Content-Type": "application/json", "User-Agent": "DeltaExchangeEngine/1.0" }
      });
      if (!res.ok) return null;
      const json: any = await res.json();
      const ticker: DeltaTicker = json?.result || json;
      if (ticker && ticker.mark_price) {
        const priceUSD = parseFloat(ticker.mark_price) || parseFloat(ticker.close) || 0;
        const priceINR = Number((priceUSD * this.usdInrRate).toFixed(2));
        this.lastPrices.set(symbol.toUpperCase(), {
          usd: priceUSD,
          inr: priceINR,
          volume: ticker.volume || 0,
          timestamp: Date.now()
        });
        return ticker;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // ────────────────────────────────────────────
  // REST API: Fetch All Tickers
  // ────────────────────────────────────────────
  public async fetchAllTickers(): Promise<DeltaTicker[]> {
    try {
      const res = await fetch(`${BASE_URL}/tickers`, {
        headers: { "Content-Type": "application/json", "User-Agent": "DeltaExchangeEngine/1.0" }
      });
      if (!res.ok) return [];
      const json: any = await res.json();
      const tickers: DeltaTicker[] = json?.result || [];
      for (const t of tickers) {
        if (t.symbol && t.mark_price) {
          const priceUSD = parseFloat(t.mark_price) || parseFloat(t.close) || 0;
          const priceINR = Number((priceUSD * this.usdInrRate).toFixed(2));
          this.lastPrices.set(t.symbol.toUpperCase(), {
            usd: priceUSD,
            inr: priceINR,
            volume: t.volume || 0,
            timestamp: Date.now()
          });
        }
      }
      return tickers;
    } catch (e) {
      return [];
    }
  }

  // ────────────────────────────────────────────
  // REST API: Fetch OHLCV Candles
  // ────────────────────────────────────────────
  public async fetchCandles(symbol: string, resolution: string = "1m", startTime?: number, endTime?: number): Promise<DeltaCandle[]> {
    try {
      if (this.products.size === 0) {
        await this.fetchProducts();
      }
      let product = this.products.get(symbol.toUpperCase());
      if (!product) {
        // Fallback: search by symbol or underlying
        const found = Array.from(this.products.values()).find(p => p.symbol?.toUpperCase() === symbol.toUpperCase() || p.underlying_asset?.symbol?.toUpperCase() === symbol.replace("USD", "").toUpperCase());
        if (!found) {
          console.warn(`[DeltaExchange] ⚠️ Product not found for candles: ${symbol}`);
          return [];
        }
        product = found;
      }

      const now = Math.floor(Date.now() / 1000);
      const start = startTime || (now - 86400); // Default: last 24 hours
      const end = endTime || now;

      const queryParams = `?symbol=${encodeURIComponent(product.symbol)}&resolution=${resolution}&start=${start}&end=${end}`;
      const res = await fetch(`${BASE_URL}/history/candles${queryParams}`, {
        headers: { "Content-Type": "application/json", "User-Agent": "DeltaExchangeEngine/1.0" }
      });
      if (!res.ok) {
        // Try alternate global endpoint fallback
        const altRes = await fetch(`https://api.delta.exchange/v2/history/candles${queryParams}`, {
          headers: { "Content-Type": "application/json", "User-Agent": "DeltaExchangeEngine/1.0" }
        });
        if (!altRes.ok) return [];
        const altJson: any = await altRes.json();
        return this.parseCandles(altJson?.result || []);
      }
      const json: any = await res.json();
      return this.parseCandles(json?.result || []);
    } catch (e) {
      return [];
    }
  }

  private parseCandles(raw: any[]): DeltaCandle[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((c: any) => ({
      time: c.time || c.t || 0,
      open: parseFloat(c.open || c.o || "0"),
      high: parseFloat(c.high || c.h || "0"),
      low: parseFloat(c.low || c.l || "0"),
      close: parseFloat(c.close || c.c || "0"),
      volume: parseFloat(c.volume || c.v || "0")
    })).filter(c => c.close > 0);
  }

  // ────────────────────────────────────────────
  // REST API: Authenticated — Wallet Balance
  // ────────────────────────────────────────────
  public async fetchWalletBalance(): Promise<any> {
    try {
      const path = "/v2/wallet/balances";
      const headers = this.getAuthHeaders("GET", path);
      const res = await fetch(`${BASE_URL}/wallet/balances`, { headers });
      if (!res.ok) return null;
      const json: any = await res.json();
      return json?.result || json;
    } catch (e) {
      return null;
    }
  }

  // ────────────────────────────────────────────
  // WebSocket: Live Price Feed
  // ────────────────────────────────────────────
  public connectWebSocket(symbols?: string[]): void {
    if (this.ws && this.isConnected) {
      console.log("[DeltaExchange] WebSocket already connected, skipping...");
      return;
    }

    const subscribeSymbols = symbols || this.defaultSymbols;
    console.log(`[DeltaExchange] 🔌 Connecting WebSocket to ${WS_URL}...`);

    try {
      this.ws = new WebSocket(WS_URL);
    } catch (e: any) {
      console.warn(`[DeltaExchange] ❌ WebSocket creation error: ${e.message}`);
      this.scheduleReconnect(subscribeSymbols);
      return;
    }

    this.ws.on("open", () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log("[DeltaExchange] 🟢 WebSocket connected successfully!");

      // Enable heartbeat
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "enable_heartbeat" }));
      }

      // Subscribe to ticker channels for all crypto symbols
      const subscribePayload = {
        type: "subscribe",
        payload: {
          channels: [
            {
              name: "v2/ticker",
              symbols: subscribeSymbols
            }
          ]
        }
      };
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(subscribePayload));
      }
      console.log(`[DeltaExchange] 📡 Subscribed to tickers: ${subscribeSymbols.join(", ")}`);

      // Start heartbeat ping every 25 seconds
      if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = setInterval(() => {
        if (this.ws && this.isConnected) {
          try {
            this.ws.send(JSON.stringify({ type: "ping" }));
          } catch (e) {}
        }
      }, 25000);
    });

    this.ws.on("message", (data: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(data.toString());
        this.handleWsMessage(msg);
      } catch (e) {}
    });

    this.ws.on("close", (code: number, reason: Buffer) => {
      this.isConnected = false;
      console.warn(`[DeltaExchange] ⚠️ WebSocket closed (code: ${code})`);
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      this.scheduleReconnect(subscribeSymbols);
    });

    this.ws.on("error", (err: Error) => {
      console.warn(`[DeltaExchange] ❌ WebSocket error: ${err.message}`);
    });
  }

  private handleWsMessage(msg: any): void {
    // Handle heartbeat
    if (msg.type === "heartbeat" || msg.type === "pong") return;

    // Handle subscription confirmation
    if (msg.type === "subscriptions") {
      console.log("[DeltaExchange] ✅ Subscription confirmed:", JSON.stringify(msg.payload?.channels?.map((c: any) => c.name) || []));
      return;
    }

    // Handle ticker updates
    if (msg.type === "v2/ticker" || msg.type === "ticker") {
      const symbol = msg.symbol || msg.payload?.symbol;
      const markPrice = parseFloat(msg.mark_price || msg.payload?.mark_price || "0");
      const closePrice = parseFloat(msg.close || msg.payload?.close || "0");
      const priceUSD = markPrice > 0 ? markPrice : closePrice;
      const volume = parseFloat(msg.volume || msg.payload?.volume || "0");

      if (symbol && priceUSD > 0) {
        const priceINR = Number((priceUSD * this.usdInrRate).toFixed(2));
        this.lastPrices.set(symbol.toUpperCase(), {
          usd: priceUSD,
          inr: priceINR,
          volume,
          timestamp: Date.now()
        });

        // Notify all tick listeners
        for (const listener of this.tickListeners) {
          try {
            listener(symbol, priceINR, priceUSD, volume);
          } catch (e) {}
        }
      }
    }
  }

  private scheduleReconnect(symbols: string[]): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[DeltaExchange] ❌ Max reconnect attempts reached. Giving up WebSocket connection.");
      return;
    }

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    this.reconnectAttempts++;
    console.log(`[DeltaExchange] 🔄 Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    this.reconnectTimer = setTimeout(() => {
      this.connectWebSocket(symbols);
    }, delay);
  }

  // ────────────────────────────────────────────
  // Tick Listener Management
  // ────────────────────────────────────────────
  public onTick(listener: TickListener): void {
    this.tickListeners.push(listener);
  }

  public removeTick(listener: TickListener): void {
    this.tickListeners = this.tickListeners.filter(l => l !== listener);
  }

  // ────────────────────────────────────────────
  // Price Accessors
  // ────────────────────────────────────────────
  public getLivePrice(symbol: string): { usd: number; inr: number; volume: number; timestamp: number } | null {
    return this.lastPrices.get(symbol.toUpperCase()) || null;
  }

  public getAllPrices(): Map<string, { usd: number; inr: number; volume: number; timestamp: number }> {
    return this.lastPrices;
  }

  public isWsConnected(): boolean {
    return this.isConnected;
  }

  public getProductBySymbol(symbol: string): DeltaProduct | undefined {
    return this.products.get(symbol.toUpperCase());
  }

  public getAllProducts(): DeltaProduct[] {
    return Array.from(this.products.values());
  }

  public getDefaultSymbols(): string[] {
    return [...this.defaultSymbols];
  }

  // ────────────────────────────────────────────
  // Bootstrap: Initialize Everything
  // ────────────────────────────────────────────
  public async initialize(): Promise<void> {
    console.log("[DeltaExchange] 🚀 Initializing Delta Exchange Engine...");
    await this.fetchUsdInrRate();
    await this.fetchProducts();
    this.connectWebSocket();

    // Refresh USD/INR rate every 5 minutes
    setInterval(() => {
      this.fetchUsdInrRate().catch(() => {});
    }, 5 * 60 * 1000);

    // REST fallback ticker poll every 10 seconds (in case WS misses)
    setInterval(async () => {
      if (!this.isConnected) {
        // WS is down, use REST as fallback
        for (const sym of this.defaultSymbols) {
          const ticker = await this.fetchTicker(sym);
          if (ticker) {
            const priceUSD = parseFloat(ticker.mark_price || ticker.close || "0");
            const priceINR = Number((priceUSD * this.usdInrRate).toFixed(2));
            if (priceUSD > 0) {
              for (const listener of this.tickListeners) {
                try {
                  listener(sym, priceINR, priceUSD, ticker.volume || 0);
                } catch (e) {}
              }
            }
          }
        }
      }
    }, 10000);

    console.log("[DeltaExchange] ✅ Delta Exchange Engine initialized!");
  }

  public disconnectWebSocket(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this.isConnected = false;
    console.log("[DeltaExchange] 🔴 WebSocket disconnected.");
  }
}

export const deltaExchangeEngine = new DeltaExchangeEngine();
