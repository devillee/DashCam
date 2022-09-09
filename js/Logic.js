var remoteVideo = document.getElementById("remoteVideo");
var localId = getUuid();

connect(localId, remoteVideo);

chechRemoteId();

function chechRemoteId() {
  if (localStorage.getItem("remoteId", null) != null) {
    document.getElementById("id_remote_uuid").value = localStorage.getItem(
      "remoteId",
      null
    );
  }
  var url = window.location.href;
  let p = url.split("?")[1];
  let params = new URLSearchParams(p);
  if(params.get("remoteId") != null){
    document.getElementById("id_remote_uuid").value = params.get("remoteId");
  }
}

document.getElementById("connect").addEventListener("click", () => {
  mRemoteId = document.getElementById("id_remote_uuid").value;
  localStorage.setItem("remoteId", mRemoteId);
  sendConnectMessage();
});

function getUuid() {
  if (localStorage.getItem("localId", null) == null) {
    var uuid = uuid2(8, 10);
    localStorage.setItem("localId", uuid);
  }
  return localStorage.getItem("localId");
}

// 指定长度和基数
function uuid2(len, radix) {
  var chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
  var uuid = [],
    i;
  radix = radix || chars.length;

  if (len) {
    // Compact form
    for (i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)];
  } else {
    // rfc4122, version 4 form
    var r;

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
    uuid[14] = "4";

    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | (Math.random() * 16);
        uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r];
      }
    }
  }

  return uuid.join("");
}
