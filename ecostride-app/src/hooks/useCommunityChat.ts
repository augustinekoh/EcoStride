import { useState, useEffect, useRef, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  guild_id: string;
  user_id: string;
  username?: string;
  content: string;
  created_at: number;
}

// Use VITE_API_BASE_URL to be consistent, but strip the /api suffix for WS
const API_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api').replace('/api', '');

export function useCommunityChat(guildId: string | undefined | null, token: string | undefined | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    if (!guildId || !token) return;
    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api'}/chat/messages/${guildId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.messages) {
          setMessages(data.messages);
        }
      })
      .catch(console.error);
  }, [guildId, token]);

  const connect = useCallback(() => {
    if (!guildId || !token) return;

    // Convert http/https to ws/wss
    const wsUrl = new URL(`${API_URL}/api/chat/community/${guildId}?token=${token}`);
    wsUrl.protocol = wsUrl.protocol.replace('http', 'ws');

    const ws = new WebSocket(wsUrl.toString());

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'status') {
          setIsMuted(!!data.muted);
        } else if (data.type === 'message' && data.message) {
          setMessages(prev => {
            // Check for duplicates
            if (prev.some(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        } else if (data.type === 'error') {
          if (data.error === 'You have been muted by the admin.') {
            setIsMuted(true);
          } else {
            setMessages(prev => [...prev, {
              id: crypto.randomUUID(),
              guild_id: guildId as string,
              user_id: 'system',
              username: 'System',
              content: data.error,
              created_at: Date.now()
            }]);
          }
        }
      } catch (e) {
        console.error("Failed to parse message", e);
      }
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      
      // Stop reconnecting on unauthorized or max retries
      if (event.code === 1008 || event.code === 4001 || event.code === 4003 || reconnectAttempts.current > 5) {
        return;
      }

      // Exponential backoff reconnect
      const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
      reconnectAttempts.current += 1;
      reconnectTimeoutRef.current = setTimeout(connect, timeout);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    wsRef.current = ws;
  }, [guildId, token]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        // Prevent reconnect loop on unmount
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', content }));
    }
  }, []);

  return {
    messages,
    isConnected,
    isMuted,
    sendMessage
  };
}
