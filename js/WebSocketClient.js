var server = "wss://ffcmd.com/socket";
var socket;
var lockReconnect = false;

if (!window.WebSocket) {
  window.WebSocket = window.MozWebSocket;
}

let onReceiveMessage;
let userId;

function connectWebsocket(localId, onMessage) {
  try {
    var url = server + "?userId=" + localId;
    userId = localId;
    var client = new WebSocket(url);
    client.onopen = sOpen;
    client.onerror = sError;
    client.onmessage = sMessage;
    client.onclose = sClose;
    socket = client;
    onReceiveMessage = onMessage;
  } catch (e) {
    console.error("connectWS error " + e.code + " " + e.reason);
    return;
  }
}

function sOpen() {
  console.log("connect success!");
  HeartCheck.reset().start();
  document.getElementById("connect").removeAttribute("disabled")
}

function sError(e) {
  console.error("sError " + e.code + " " + e.reason);
  reconnect();
}
function sMessage(msg) {
  console.log("receive msg:" + msg);
  HeartCheck.reset().start();
  try {
    var object = JSON.parse(msg.data);
    if (object.content != "pong") {
      onReceiveMessage(object);
    } else {
      // console.log("receive pong");
      return;
    }
  } catch (error) {
    // console.warn(error);
  }
}
function sClose(e) {
  console.error("sClose " + e.code + " " + e.reason);
  reconnect();
}

async function sendMsg(sender, receiver, content, type) {
  var signalmessage = {
    sender: "",
    receiver: "",
    content: "",
    type: 0,
  };
  signalmessage["sender"] = sender;
  signalmessage["receiver"] = receiver;
  signalmessage["content"] = content;
  signalmessage["type"] = type;
  var json = JSON.stringify(signalmessage);
  socket.send(json);
}
function Close() {
  socket.close();
}

//心跳检测
var HeartCheck = {
  timeout: 45 * 1000, //nginx 1分钟没有收到消息会断开ws连接,这里45s发送一次心跳
  timeoutObj: null,
  serverTimeoutObj: null,
  reset: function () {
    clearTimeout(this.timeoutObj);
    clearTimeout(this.serverTimeoutObj);
    return this;
  },
  start: function () {
    var self = this;
    this.timeoutObj = setTimeout(function () {
      sendMsg(userId, "", "ping", 0);
      self.serverTimeoutObj = setTimeout(function () {
        socket.close();
      }, self.timeout);
    }, this.timeout);
  },
};

// 重新连接
function reconnect(url) {
  if (lockReconnect) return;
  lockReconnect = true;
  setTimeout(function () {
    connectWebsocket(userId);
    lockReconnect = false;
  }, 2000);
}

window.onbeforeunload = function () {
  Close();
};
