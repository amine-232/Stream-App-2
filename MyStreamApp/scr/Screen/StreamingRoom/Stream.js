import React, { useRef, useEffect, useState } from "react";
import { View, StyleSheet, Button } from "react-native";
import io from "socket.io-client";
import Peer from "peerjs";

const getUserCamera = async (localVideoRef) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    });
    localVideoRef.current.width = 400;
    localVideoRef.current.height = 400;
    localVideoRef.current.srcObject = stream;
    return stream;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const shareScreen = async (localVideoRef) => {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    localVideoRef.current.width = 400;
    localVideoRef.current.height = 400;
    localVideoRef.current.srcObject = screenStream;
    return screenStream;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const TeatStreaming = ({ socket }) => {
  const localVideoRef = useRef(null);
  const videosContainer = useRef(null);
  const [myId, setMyId] = useState();
  const [liveStreams, setLiveStreams] = useState([]);
  const [modeStream, setModeStream] = useState("stream");

  const iceServers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };
  const peers = {};

  let myRole = "streamer";

  useEffect(() => {
    const setupStream = async () => {
      if (localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (modeStream === "stream") {
        await getUserCamera(localVideoRef);
      } else if (modeStream === "shareScreen") {
        await shareScreen(localVideoRef);
      }
    };

    setupStream();
  }, [modeStream]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Myid is:", socket.id);
      setMyId(socket.id);
    });

    socket.on("event", (evt) => {
      switch (evt.type) {
        case "join":
          handleJoin(evt, socket);
          break;
        case "offer":
          handleOffer(evt, socket);
          break;
        case "answer":
          handleAnswer(evt);
          break;
        case "candidate":
          handleCandidate(evt);
          break;
        case "bye":
          handleBye(evt);
          break;
        default:
          break;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function handleJoin(evt, socket) {
    console.log(evt.from + " has joined");
    peers[evt.from] = createRTCPeerConnection(evt.from, socket);
    peers[evt.from].addTransceiver("video", {
      direction: "recvonly",
    });

    peers[evt.from]
      .createOffer()
      .then((sdp) => onOfferAnswer("offer", sdp, evt.from, socket));
  }

  function handleOffer(evt, socket) {
    console.log(evt.from + " has sent an offer:", evt.sdp);
    peers[evt.from] = createRTCPeerConnection(evt.from, socket);
    peers[evt.from].setRemoteDescription(new RTCSessionDescription(evt.sdp));

    peers[evt.from].ondatachannel = (e) => receiveChannelCallback(e, evt.from);

    peers[evt.from]
      .createAnswer()
      .then((sdp) => onOfferAnswer("answer", sdp, evt.from, socket));
  }

  function handleAnswer(evt) {
    console.log(evt.from + " has sent an answer:", evt.sdp);
    peers[evt.from].setRemoteDescription(new RTCSessionDescription(evt.sdp));
  }

  function handleCandidate(evt) {
    console.log(evt.from, "sent a candidate:", evt.candidate);
    peers[evt.from].addIceCandidate(
      new RTCIceCandidate({
        sdpMLineIndex: evt.label,
        candidate: evt.candidate,
      })
    );
  }

  function handleBye(evt) {
    console.log(evt.from + " has left");
    const videoElement = document.getElementById("remote_" + evt.from);
    if (videoElement) {
      videoElement.pause();
      videoElement.removeAttribute("srcObject");
      videoElement.load();
      videoElement.remove();
      styleVideos();
    }
    if (peers[evt.from]) {
      peers[evt.from].close();
      delete peers[evt.from];
    }
  }

  function sendSignaling(data, socket) {
    socket.emit("event", data);
  }

  function createRTCPeerConnection(remoteUser, socket) {
    const rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = (e) =>
      onIceCandidate(e, remoteUser, socket);
    rtcPeerConnection.ontrack = (e) => onAddStream(e, remoteUser);
    if (myRole === "streamer") {
      const videoElement = localVideoRef.current;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject;
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0) {
          rtcPeerConnection.addTrack(videoTracks[0], stream);
        } else {
          console.error("No video tracks found in the MediaStream.");
        }
      } else {
        console.error("Video element or its srcObject is not available.");
      }
    }
    return rtcPeerConnection;
  }

  function onOfferAnswer(type, sdp, to, socket) {
    peers[to].setLocalDescription(sdp);
    console.log(`sending ${type} to:`, to);
    sendSignaling(
      {
        to: to,
        from: socket.id,
        type: type,
        sdp: sdp,
      },
      socket
    );
  }

  function onIceCandidate(event, to, socket) {
    if (event.candidate) {
      console.log("sending ice candidate to:", to);
      sendSignaling(
        {
          type: "candidate",
          from: socket.id,
          to: to,
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate,
        },
        socket
      );
    }
  }

  const switchMode = () => {
    setModeStream((prevMode) =>
      prevMode === "stream" ? "shareScreen" : "stream"
    );
  };

  function onAddStream(event, from) {
    console.log("got video from", from);
    const remoteVideo = document.createElement("video");
    remoteVideo.id = `remote_${from}`;
    remoteVideo.autoplay = true;
    remoteVideo.srcObject = event.streams[0];
    videosContainer.current.appendChild(remoteVideo);

    styleVideos();
  }

  function styleVideos() {
    const videosGrid = videosContainer.current;
    const videoElements = videosGrid.querySelectorAll("video");

    if (videoElements.length === 1) {
      videoElements[0].style.gridRow = "1 / span 2";
      videoElements[0].style.gridColumn = "1 / span 2";
    } else if (videoElements.length === 2) {
      videoElements[0].style.gridRow = "1 / span 2";
      videoElements[0].style.gridColumn = "1 / span 1";
      videoElements[1].style.gridRow = "1 / span 2";
      videoElements[1].style.gridColumn = "2 / span 1";
    } else if (videoElements.length >= 3) {
      if (videoElements.length > 4) {
        videosGrid.style.gridTemplateColumns = `repeat(${Math.ceil(
          videoElements.length / 2
        )}, 1fr)`;
      }
      videoElements.forEach((video) => {
        video.style.gridRow = "auto";
        video.style.gridColumn = "auto";
      });
    }
  }

  const leaveSession = (id) => {
    console.log("Leaving session:", id);
    Object.keys(peers).forEach((key) => {
      peers[key].close();
      delete peers[key];
    });
    socket.emit("event", { type: "bye", from: id });
    if (localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  return (
    <div style={styles.container}>
      <div>
        <div id="videos" style={styles.videos} ref={videosContainer}>
          <video id="localVideo" autoPlay ref={localVideoRef}></video>
        </div>
        <Button onPress={() => leaveSession(socket.id)} title="Leave" />
        <Button
          onPress={switchMode}
          title={modeStream === "stream" ? "ShareScreen" : "Stream"}
        />
      </div>
    </div>
  );
};

export default TeatStreaming;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
  videos: {
    width: "100%",
    height: "50%",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  chatContainer: {
    width: "100%",
    padding: "10px",
  },
  chat: {
    height: 200,
    overflowY: "auto",
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  chatText: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 5,
    marginBottom: 10,
  },
});
