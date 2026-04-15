export function useChatSocket(options = {}) {
  const {
    getUrl,
    onStatusChange,
    onMessage,
    onError,
    reconnect = {
      enabled: true,
      maxAttempts: 3,
      delay: 1200,
    },
  } = options;

  let socket = null;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let manuallyClosed = false;

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const setStatus = (status) => {
    if (typeof onStatusChange === "function") {
      onStatusChange(status);
    }
  };

  const connect = () => {
    if (!getUrl) return;
    if (
      socket &&
      [WebSocket.OPEN, WebSocket.CONNECTING].includes(socket.readyState)
    ) {
      return;
    }

    clearReconnectTimer();
    manuallyClosed = false;
    setStatus("connecting");

    socket = new WebSocket(getUrl());

    socket.onopen = () => {
      // 每次成功重连后清零计数，避免后续被 maxAttempts 提前截断。
      reconnectAttempts = 0;
      setStatus("connected");
    };

    socket.onmessage = (event) => {
      if (typeof onMessage === "function") {
        onMessage(event.data);
      }
    };

    socket.onerror = (error) => {
      setStatus("error");
      if (typeof onError === "function") {
        onError(error);
      }
    };

    socket.onclose = () => {
      setStatus("disconnected");

      if (!reconnect.enabled || manuallyClosed) {
        return;
      }

      if (reconnectAttempts >= reconnect.maxAttempts) {
        return;
      }

      reconnectAttempts += 1;
      // 采用递增延迟，降低短时间频繁重连对服务端的压力。
      const delay = reconnect.delay * reconnectAttempts;
      reconnectTimer = setTimeout(() => {
        connect();
      }, delay);
    };
  };

  const send = (payload) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    // 统一在组合函数内部序列化，页面层只传对象。
    socket.send(JSON.stringify(payload));
    return true;
  };

  const close = () => {
    manuallyClosed = true;
    clearReconnectTimer();
    if (socket) {
      socket.close();
    }
  };

  const getReadyState = () => {
    return socket ? socket.readyState : WebSocket.CLOSED;
  };

  return {
    connect,
    send,
    close,
    getReadyState,
  };
}
