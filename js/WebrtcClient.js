const configuration = {
  iceServers: [
    {
      urls: "stun:ffcmd.com:3478",
    },
    {
      urls: "turn:ffcmd.com:3478?transport=udp",
      username: "leo",
      credential: "aidashcam",
    },
    {
      urls: "turn:ffcmd.com:3478?transport=tcp",
      username: "leo",
      credential: "aidashcam",
    },
  ],
};

const answerOption = {
  offerToReceiveAudio: false,
  offerToReceiveVideo: true,
};

var ACTION_REMOTE_CONNECTED = "remoteConnected";
var ACTION_SET_SDP = "setSessionDescription";
var ACTION_ADD_ICE_CANDIDATE = "addIceCandidate";
var ACTION_TELL_MYID = "tellMyId";

const opt = {
  negotiated: true,
  id: 100,
};
const lable = "dashcam";

var inboundStream = new MediaStream();

var mRemoteId;
let mLocalId;
let peerConnection;
let mDataChannel;
let mRemoteVideo;

initPeerConnection();

function initPeerConnection() {
  peerConnection = new RTCPeerConnection(configuration);

  peerConnection.addEventListener("icecandidate", (e) => onIceCandidate(e));
  peerConnection.addEventListener("track", (e) => gotRemoteStream(e));
  peerConnection.addEventListener("iceconnectionstatechange", (pc, event) =>
    onIceConnectionStateChange(pc, event)
  );

  mDataChannel = peerConnection.createDataChannel(lable, opt);
  mDataChannel.onopen = function () {};
  mDataChannel.onclose = function () {};
  mDataChannel.onmessage = function (event) {
    console.log("datachannel receive:" + event.data);
  };
}
function onIceConnectionStateChange(pc, event) {
  console.log("ICE state change event: ", peerConnection.iceConnectionState);
}
function connect(localId, remoteVideo) {
  mLocalId = localId;
  mRemoteVideo = remoteVideo;
  connectWebsocket(localId, (signalmessage) => {
    try {
      var content = signalmessage.content;
      var msg = JSON.parse(content);
      var action = msg.action;
      if (action == ACTION_SET_SDP) {
        createAnswer(msg.value);
      } else if (action == ACTION_ADD_ICE_CANDIDATE) {
        addRemoteIceCandidate(msg.value);
      }
    } catch (error) {
      // console.error(error);
    }
  });
}

function gotRemoteStream(event) {
  console.log("gotRemoteStream");
  if (event.streams[0]) {
    mRemoteVideo.srcObject = event.streams[0];
    console.log("remoteVideo set src object:" + event.streams[0].id);
  } else {
    inboundStream.addTrack(event.track);
    mRemoteVideo.srcObject = inboundStream;
    console.log("remoteVideo add src track:" + event.track.kind);
  }
}

function sendConnectMessage() {
  var msg = {};
  msg["action"] = ACTION_REMOTE_CONNECTED;
  sendMsg(mLocalId, mRemoteId, JSON.stringify(msg), 0);
  console.log("sendConnectMessage");
}

async function createAnswer(sdp) {
  if (peerConnection) {
    var rtcSdp = {};
    rtcSdp["type"] = "offer";
    rtcSdp["sdp"] = sdp;

    try {
      await peerConnection.setRemoteDescription(rtcSdp);
      console.info("setRemoteDescription " + sdp);
      const answer = await peerConnection.createAnswer(answerOption);
      await onCreateAnswerSuccess(answer);
    } catch (e) {
      console.error(e);
    }
  }
}

async function onCreateAnswerSuccess(desc) {
  console.info("onCreateAnswerSuccess desc" + desc);
  try {
    await peerConnection.setLocalDescription(desc);
    sendSdpToRemote(desc.sdp);
  } catch (e) {
    console.error("setLocalDescription error" + e);
  }
}

function addRemoteIceCandidate(candidate) {
  if (peerConnection != null) {
    var rtcIceCandidateInit = {};
    rtcIceCandidateInit["candidate"] = candidate.sdp;
    rtcIceCandidateInit["sdpMLineIndex"] = candidate.sdpMLineIndex;
    rtcIceCandidateInit["sdpMid"] = candidate.sdpMid;
    peerConnection.addIceCandidate(rtcIceCandidateInit);
    console.log("addIceCandidate:" + candidate.sdp);
  }
}

async function onIceCandidate(event) {
  console.log("onIceCandidate:" + event.candidate);
  var rtcIceCandidate = event.candidate;
  if (rtcIceCandidate != null) {
    var candidateJson = {};
    candidateJson["sdp"] = rtcIceCandidate.candidate;
    candidateJson["sdpMLineIndex"] = rtcIceCandidate.sdpMLineIndex;
    candidateJson["sdpMid"] = rtcIceCandidate.sdpMid;

    var packet = {};
    packet["action"] = ACTION_ADD_ICE_CANDIDATE;
    packet["value"] = candidateJson;

    sendMsg(mLocalId, mRemoteId, JSON.stringify(packet), 0);
    console.log("send msg onIceCandidate :" + JSON.stringify(packet));
  }
}

function sendSdpToRemote(sdp) {
  var packet = {};
  packet["action"] = ACTION_SET_SDP;
  packet["value"] = sdp;
  sendMsg(mLocalId, mRemoteId, JSON.stringify(packet), 0);
  console.log("sendSdpToRemote");
}
