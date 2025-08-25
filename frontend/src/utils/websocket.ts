import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth";

export interface WebSocketEvents {
  connect: () => void;
  disconnect: () => void;
  // Market data events
  "market:data": (data: any) => void;
  "initial:accounts": (data: any) => void;
  "initial:strategies": (data: any) => void;
  "initial:trades": (data: any) => void;
  // Strategy events
  "strategies:list": (data: any) => void;
  "strategies:status": (data: any) => void;
  "strategies:update": (data: any) => void;
  // Trading events
  "trading:accounts": (data: any) => void;
  "trading:recent": (data: any) => void;
  "trading:updates": (data: any) => void;
  "trading:update": (data: any) => void;
  // System events
  "system:metrics": (data: any) => void;
  "system:alert": (data: any) => void;
  // Alert events
  "alert:new": (data: any) => void;
  // Error events
  error: (error: any) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    const authStore = useAuthStore();

    if (!authStore.token) {
      console.warn("No auth token available, skipping WebSocket connection");
      return;
    }

    if (this.isConnecting || this.socket?.connected) {
      return;
    }

    this.isConnecting = true;

    this.socket = io("http://localhost:8000", {
      auth: {
        token: authStore.token,
      },
      transports: ["websocket", "polling"],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.emit("connect");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      this.isConnecting = false;
      this.emit("disconnect");

      if (reason === "io server disconnect") {
        // 服务器主动断开，尝试重连
        this.reconnect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.isConnecting = false;
      this.emit("error", error);
    });

    // 设置默认事件监听器
    this.socket.on("market:data", (data) => {
      this.emit("market:data", data);
    });

    this.socket.on("initial:accounts", (data) => {
      this.emit("initial:accounts", data);
    });

    this.socket.on("initial:strategies", (data) => {
      this.emit("initial:strategies", data);
    });

    this.socket.on("initial:trades", (data) => {
      this.emit("initial:trades", data);
    });

    this.socket.on("strategies:list", (data) => {
      this.emit("strategies:list", data);
    });

    this.socket.on("strategies:status", (data) => {
      this.emit("strategies:status", data);
    });

    this.socket.on("strategies:update", (data) => {
      this.emit("strategies:update", data);
    });

    this.socket.on("trading:accounts", (data) => {
      this.emit("trading:accounts", data);
    });

    this.socket.on("trading:recent", (data) => {
      this.emit("trading:recent", data);
    });

    this.socket.on("trading:updates", (data) => {
      this.emit("trading:updates", data);
    });

    this.socket.on("trading:update", (data) => {
      this.emit("trading:update", data);
    });

    this.socket.on("system:metrics", (data) => {
      this.emit("system:metrics", data);
    });

    this.socket.on("system:alert", (data) => {
      this.emit("system:alert", data);
    });

    this.socket.on("alert:new", (data) => {
      this.emit("alert:new", data);
    });
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    setTimeout(() => {
      this.init();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  public connect() {
    if (this.socket?.connected) {
      console.log("WebSocket already connected");
      return;
    }
    this.init();
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  public on<K extends keyof WebSocketEvents>(
    event: K,
    handler: WebSocketEvents[K],
  ) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off<K extends keyof WebSocketEvents>(
    event: K,
    handler: WebSocketEvents[K],
  ) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  public joinRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit("join-room", room);
    }
  }

  public leaveRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit("leave-room", room);
    }
  }

  public send(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn("WebSocket not connected, cannot send message");
    }
  }

  // Market data subscription methods
  public subscribeMarketData(symbols: string[]) {
    if (this.socket?.connected) {
      this.socket.emit("subscribe:market", { symbols });
      console.log(`Subscribed to market data for: ${symbols.join(", ")}`);
    }
  }

  public unsubscribeMarketData(symbols: string[]) {
    if (this.socket?.connected) {
      this.socket.emit("unsubscribe:market", { symbols });
      console.log(`Unsubscribed from market data for: ${symbols.join(", ")}`);
    }
  }

  // Strategy subscription methods
  public subscribeStrategies() {
    if (this.socket?.connected) {
      this.socket.emit("subscribe:strategies");
      console.log("Subscribed to strategy updates");
    }
  }

  // Trading subscription methods
  public subscribeTrading() {
    if (this.socket?.connected) {
      this.socket.emit("subscribe:trading");
      console.log("Subscribed to trading updates");
    }
  }

  // System metrics subscription methods
  public subscribeMetrics() {
    if (this.socket?.connected) {
      this.socket.emit("subscribe:metrics");
      console.log("Subscribed to system metrics");
    }
  }

  // Alerts subscription methods
  public subscribeAlerts() {
    if (this.socket?.connected) {
      this.socket.emit("subscribe:alerts");
      console.log("Subscribed to alerts");
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public getConnectionStatus(): "connected" | "connecting" | "disconnected" {
    if (this.socket?.connected) return "connected";
    if (this.isConnecting) return "connecting";
    return "disconnected";
  }
}

// 创建单例实例
export const wsService = new WebSocketService();

// 导出类型
export type { Socket };
