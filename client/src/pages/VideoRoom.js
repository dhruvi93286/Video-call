import { useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import RemoteVideo from "./RemoteVideo";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCoffee,
  faCogs,
  faComment,
  faCommentSlash,
  faComments,
  faDesktop,
  faFill,
  faMicrophone,
  faMicrophoneSlash,
  faPhone,
  faPhoneSlash,
  faUser,
  faVideo,
  faVideoSlash,
} from "@fortawesome/free-solid-svg-icons";
import LocalVideo from "./LocalVideo";

const VideoRoom = () => {
  const navigate = useNavigate();
  const user = useLocation();
  const myVideo = useRef(null);
  const videoRef = useRef(null);
  const screenVideoRef = useRef([]);
  const messagesRef = useRef();
  const [media, setMedia] = useState({
    audio: true,
    video: true,
    sharingScreen: false,
  });
  const [isScreenSharingActive, setisScreenSharingActive] = useState(false);
  const [dstreams, setdstreams] = useState(null);
  const [remoteScreenVideos, setRemoteScreenVideos] = useState(null);
  const peersRef = useRef([]);
  const speersRef = useRef([]);
  const roomID = user?.state?.roomId;
  const name = user?.state?.name;
  const [socket, setSocket] = useState(null);
  const [stream, setStream] = useState(null);
  const [connectedUsers, setConnectedUser] = useState(null);
  const [peers, setPeers] = useState([]);
  const [sharingstream, setScreenSharingStream] = useState({});
  const [screenshare, setScreenShare] = useState({});

  const [ndata, setndata] = useState({});
  const [newname, setnewname] = useState(null);
  const [names, setName] = useState(null);
  const [newconnectedname, setnewconnectedname] = useState(null);

  const [leavename, setleavename] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showAside, setShowAside] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  console.log("roomID", roomID);
  useEffect(() => {
    if (roomID != null) {
      const socket = io("ws://localhost:9000");
      setSocket(socket);
      socket.emit("join-room", roomID, name);

      window.addEventListener("beforeunload", function () {
        console.log("socket", socket);
        navigate("/");
        // socket.emit("leaving", roomID,name);
      });

      socket.on("connected-user", (user) => {
        setConnectedUser(user);
      });

      socket.on("message", payload => {
        console.log("payload", payload)
        if (payload.message.trim() !== '') {
          setMessages(messages => [...messages, payload]);
          setMessage('');
        }
      });

      const initializeMediaDevices = async () => {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputDevices = devices.filter(
            (device) =>
              device.kind === "audioinput" &&
              device.deviceId !== "default" &&
              device.deviceId !== "communications"
          );
          console.log("audioInputDevices------>", audioInputDevices);
          console.log(
            "audioInputDevices[audioInputDevices.length-1].deviceId",
            audioInputDevices[audioInputDevices.length - 1].deviceId
          );

          navigator.mediaDevices
            .getUserMedia({
              video: true,
              audio: true,
            })
            .then((stream) => {
              console.log(
                "stre",
                stream.getAudioTracks()[0].getSettings().deviceId
              );
              setStream(stream);
              if (myVideo.current) {
                myVideo.current.srcObject = stream;
              }
              socket.on("user-connected", (name) => {
                console.log("fff", name);
                setnewconnectedname(name);
                const peer = createPeer(name, stream, socket);
                peersRef.current.push({ peerID: name, peer });
                peer.addTrack(stream.getVideoTracks()[0], stream);
                peer.addTrack(stream.getAudioTracks()[0], stream);
                console.log("uuu", dstreams);
                setPeers((users) => [...users, peer]);
              });

              socket.on("callUser", ({ signal, from, userToCall }) => {
                console.log("signal", signal, from, userToCall);
                const peer = addPeer(signal, from, stream, socket, userToCall);
                peersRef.current.push({ peerID: from, peer });
                setPeers((users) => [...users, peer]);
              });

              socket.on("share-screen", ({ signal, from, userToCall }) => {
                console.log("signal", signal, from, userToCall);

                const peer = screenaddPeer(signal, from, socket, userToCall);
                speersRef.current.push({
                  peerID: from + "_" + userToCall,
                  peer,
                });
              });

              socket.on("receiving returned signal", ({ signal, id }) => {
                console.log("idid------>", id);
                const item = peersRef.current.find((p) => p.peerID === id);
                console.log("item------>", item);
                if (item) {
                  item.peer.signal(signal);
                }

                item.peer.on("stream", (stream) => {
                  console.log("remotesfffftream------>", stream);
                  // setScreenSharingStream({ ...sharingstream, [id]: stream  })
                  setScreenSharingStream((prevSharingStream) => ({
                    ...prevSharingStream,
                    [id]: stream,
                  }));
                });
              });

              socket.on("receiving-share-returned-signal", ({ signal, id }) => {
                console.log("idid------>", id);
                const item = speersRef.current.find(
                  (p) => p.peerID === name + "_" + id
                );
                console.log("item------>", item);
                if (item) {
                  item.peer.signal(signal);
                }
              });

             

              socket.on("user-leave", (username) => {
                console.log("user-leave", username);
                console.log("user-leave-peersRef", peersRef);
                const leftPeer = peersRef.current.find(
                  (u) => u.peerID === username
                );

                if (leftPeer) {
                  console.log("user-leave-leftPeer", leftPeer);

                  leftPeer.peer.destroy();

                  const newPeers = peersRef.current.filter(
                    (u) => u.peerID !== username
                  );
                  peersRef.current = newPeers;
                  // setPeers(newPeers);
                  setleavename(username);
                  let name=username;
                  socket.emit('message', { roomID, name, message: ' Left room', type: 2 });
                }
              });

              socket.on("leaving-call-success", (name) => {
                console.log("leaving-call-success", name);
                setleavename(name);
              });

              socket.on("stop-sharing", (name) => {
                console.log("shhhh", name);
                setName(name);
              });
            })
            .catch((error) => {
              console.error("Error accessing media devices:", error);
            });
        } catch (error) {
          console.error("Error accessing media devices:", error);
        }
      };

      initializeMediaDevices();

      return () => {
        socket.off("receiving returned signal");
        socket.off("callUser");
        socket.off("user-connected");
        socket.disconnect();
      };
    } else {
      navigate("/");
    }
  }, []);


  navigator.mediaDevices.ondevicechange = async () => {
    navigator.mediaDevices
      .getUserMedia({
        audio: media?.audio,
        video: true
      })
      .then((streams) => {
        if (peers.length > 0) {
          peers.map((peer) => {
            peer?.replaceTrack(stream?.getAudioTracks()[0], streams?.getAudioTracks()[0], stream)
          })
          setnewname(streams)
        }
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });

  };
  useEffect(() => {
    console.log("connectedUsers.includes(newconnectedname)", connectedUsers);
    if (newconnectedname != null && dstreams != null) {
      console.log("iff---------->");
      const peer = screencreatePeer(newconnectedname, dstreams, socket);
      speersRef.current.push({ peerID: name + "_" + newconnectedname, peer });
    }
  }, [newconnectedname]);

  useEffect(() => {
    if (names != null) {
      handlestopsharing();
    }
  }, [names]);

  const handlestopsharing = () => {
    const updatedSharingStream = { ...screenshare };
    delete updatedSharingStream[names];
    console.log(
      "updatedSharingStream---updatedSharingStream",
      updatedSharingStream
    );
    setScreenShare(updatedSharingStream);
    setName(null);
  };

  const createPeer = (userTosignal, stream, socket) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      // stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: userTosignal,
        signalData: data,
        from: name,
      });
    });

    peer.on("error", (e) => {
      console.log(e);
    });
    peer.on("close", () => {
      console.log("Peer close", userTosignal);
    });
    return peer;
  };

  const screencreatePeer = (userTosignal, stream, socket) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("share-screen", {
        userToCall: userTosignal,
        signalData: data,
        from: name,
      });
    });

    peer.on("error", (e) => {
      console.log(e);
    });
    peer.on("close", () => {
      console.log("Peer close", userTosignal);
    });
    return peer;
  };

  function addPeer(incomingSignal, callerID, stream, socket, userToCall) {
    if (incomingSignal && callerID && stream) {
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream,
      });

      peer.on("signal", (signal) => {
        socket.emit("returning signal", { signal, callerID, userToCall });
      });

      peer.on("stream", (stream) => {
        console.log("remotesfffftream------>", stream);
        setScreenSharingStream((prevSharingStream) => ({
          ...prevSharingStream,
          [callerID]: stream,
        }));
      });

      peer.on("close", () => {
        console.log("Peer close");
        // const newPeers = peersRef.current.filter((u) => u.peerID !== callerID);
        // peersRef.current = newPeers;

        // setPeers(newPeers);
      });
      peer.on("error", (err) => {
        console.log("error", err);
      });

      peer.signal(incomingSignal);
      return peer;
    }
  }

  function screenaddPeer(incomingSignal, callerID, socket, userToCall) {
    if (incomingSignal && callerID) {
      const peer = new Peer({
        initiator: false,
        trickle: false,
      });

      peer.on("signal", (signal) => {
        socket.emit("returning-share-signal", { signal, callerID, userToCall });
      });

      peer.on("stream", (stream) => {
        console.log("remote---share---sfffftream------>", stream);
        setScreenShare((prevSharingStream) => ({
          ...prevSharingStream,
          [callerID]: stream,
        }));
      });

      peer.on("close", () => {
        console.log("Peer close");
      });
      peer.on("error", (err) => {
        console.log("error", err);
      });

      peer.signal(incomingSignal);
      return peer;
    }
  }

  useEffect(() => {
    if (leavename != "") {
      console.log("leavename", leavename);
      console.log("gggg", sharingstream);
      const updatedSharingStream = { ...sharingstream };
      delete updatedSharingStream[leavename];
      console.log("updatedSharingStream", updatedSharingStream);
      setScreenSharingStream(updatedSharingStream);

      const updatedSharing = { ...screenshare };
      delete updatedSharing[leavename];
      console.log("updatedSharing", updatedSharing);
      setScreenShare(updatedSharing);

      setleavename("");
    }
  }, [leavename]);

  const onHangout = () => {
    socket.emit("leave-call", { name, roomID });
    if (stream.current)
      stream.current.getTracks().forEach((track) => track.stop());
    socket.close();
    socket.disconnect();

    const updatedSharingStream = Object.keys(screenshare).reduce(
      (result, key) => {
        console.log("tttkkkk", key);
        if (key !== name) {
          result[key] = screenshare[key];
        }
        return result;
      },
      {}
    );

    console.log("updatedSharingStream", updatedSharingStream);
    setScreenShare(updatedSharingStream);
    screenshare[name]?.getTracks().forEach((t) => t.stop());
    socket.emit("stop-sharing", name);
    setisScreenSharingActive(false);

    navigate("/");
  };


  const onSendMessage = () => {
    if(message=='')
    {
      alert("Message Required")
    }
    else{
      socket.emit('message', { roomID, name, message, type: 0 });

    }
    setMessage("")
  }
  
  useEffect(() => {
    console.log("meee");
    const remoteVideoElements = Object.keys(sharingstream).map((key, index) => (
      <RemoteVideo
        key={key}
        user={sharingstream[key]}
        sharingstream={sharingstream}
      />
    ));
    setRemoteScreenVideos(remoteVideoElements);
  }, [sharingstream, stream]);
  console.log("dstreamsdstreamsdstreams---->", dstreams);
  if (dstreams != null) {
    console.log("dstreamsdstreamsdstreams--222-->", dstreams);
    dstreams.getVideoTracks()[0].onended = function () {
      const updatedSharingStream = Object.keys(screenshare).reduce(
        (result, key) => {
          if (key !== name) {
            result[key] = screenshare[key];
          }
          return result;
        },
        {}
      );

      console.log("updatedSharingStream", updatedSharingStream);
      setScreenShare(updatedSharingStream);
      screenshare[name].getTracks().forEach((t) => t.stop());
      socket.emit("stop-sharing", name);
      setisScreenSharingActive(false);
      speersRef.current = [];
    };
  }

  const onMedia = async (mediaType) => {
    switch (mediaType) {
      case "audio":
        setMedia({ ...media, audio: !media.audio, sharingScreen: false });
        console.log("peers----->", peers)
        if (newname == null) {
          stream.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled; // Toggle Audio on/off
          });
        }
        else {

          navigator.mediaDevices
            .getUserMedia({
              audio: !media.audio,
              video: true
            })
            .then((streams) => {
              if (peers.length > 0) {
                peers.map((peer) => {
                  peer?.replaceTrack(stream?.getAudioTracks()[0], streams?.getAudioTracks()[0], stream)
                })
                setnewname(streams)
              }
            })
            .catch((error) => {
              console.error("Error accessing media devices:", error);
            });
        }
        break;

      case "video":
        if(stream!=null)
        {
          const isVideoEnabled = stream.getVideoTracks()[0].enabled;
          stream.getVideoTracks()[0].enabled = !isVideoEnabled;
          setMedia({ ...media, video: !isVideoEnabled, sharingScreen: false });
        }
        else{
          alert("Allow Camera Access")
        }
        
        break;

      case "share-screen":
        if (!isScreenSharingActive) {
          const constraints = {
            audio: false,
            video: true,
          };
          try {
            const dstreams = await navigator.mediaDevices.getDisplayMedia(
              constraints
            );
            setdstreams(dstreams);
            if (dstreams) {
              const newusers = connectedUsers.filter((names) => names != name);
              console.log("newusers", newusers);

              newusers.map((user, i) => {
                console.log("user-user", user);
                const peer = screencreatePeer(user, dstreams, socket);
                speersRef.current.push({ peerID: name + "_" + user, peer });
              });
              console.log("connectedUsers---->", connectedUsers);
              setScreenShare({ ...screenshare, [name]: dstreams });
              setisScreenSharingActive(true);
            }
          } catch (err) {
            console.log(
              "error occured when trying to get an access to screen share stream"
            );
          }
        } else {
          const updatedSharingStream = Object.keys(screenshare).reduce(
            (result, key) => {
              console.log("tttkkkk", key);
              if (key !== name) {
                result[key] = screenshare[key];
              }
              return result;
            },
            {}
          );

          console.log("updatedSharingStream", updatedSharingStream);
          setScreenShare(updatedSharingStream);
          screenshare[name]?.getTracks().forEach((t) => t.stop());
          socket.emit("stop-sharing", name);
          setisScreenSharingActive(false);
          speersRef.current = [];
        }
        break;

      default:
        break;
    }
  };
  return (
    <>
      <main style={{ width: showAside ? 'calc(100vw - 320px)' : '100vw' }}>
        <div className={'w-100 h-100 justify-center align-center media-grid-' + (peersRef.current.length + 1)}>
          <LocalVideo stream={myVideo} />
          {remoteScreenVideos}
          {Object.keys(screenshare).map(function (key, index) {
            console.log("screenshare[key]", screenshare[key]);
            return <RemoteVideo key={key} user={screenshare[key]} />;
          })}
        </div>
        <div className='w-100 media-controls'>

          <div className="d-flex align-center"></div>

          <div>
            <button
              className="btn"
              onClick={() => {
                onMedia("audio");
              }}
              title="Toggle Audio"
            >
              {media.audio ? (
                <FontAwesomeIcon icon={faMicrophone} />
              ) : (
                <FontAwesomeIcon icon={faMicrophoneSlash} />
              )}
            </button>

            <button
              className="btn"
              onClick={() => {
                onMedia("video");
              }}
              title="Toggle Video"
            >
              {media.video ? (
                <FontAwesomeIcon icon={faVideo} />
              ) : (
                <FontAwesomeIcon icon={faVideoSlash} />
              )}
            </button>

            <button
              className="btn"
              onClick={() => {
                onMedia("share-screen");
              }}
              title="Toggle Share Screen"
            >
              {isScreenSharingActive ? (
                <FontAwesomeIcon icon={faFill} />
              ) : (
                <FontAwesomeIcon icon={faDesktop} />
              )}
            </button>

            <button
              className="btn"
              onClick={() => { setShowAside(!showAside) }}
              title="Toggle Audio"
            >
              {showAside ? (
                <FontAwesomeIcon icon={faCommentSlash} />
              ) : (
                <FontAwesomeIcon icon={faComments} />
              )}
            </button>

            <button
              className="btn"
              onClick={onHangout}
              title="Hangout"
            >
              <FontAwesomeIcon icon={faPhone} />

            </button>
          </div>

          <div></div>
        </div>

        {showAside && <div className="h-100 chat-box" style={{ width: showAside ? '320px' : '0' }}>
          <header>
            <span onClick={() => { setShowSettings(false); }}><FontAwesomeIcon icon={faComment} /></span>
            <span onClick={() => { setShowSettings(true) }}><FontAwesomeIcon icon={faCogs} /> </span>
          </header>


          {showSettings
            ? <>
              <form>
                <label>Share url with friends</label>
                <input className="w-100" type="url" defaultValue={window.location.protocol + "//" + window.location.host} readOnly />
              </form>
            </>
            : <>
              <div>
                {console.log("messages",messages)}
                <ul>
                  {messages.map((msg, index) => (
                    <li>
                    <h3 style={{color:"#00bcd4",fontWeight: '600',margin:0}}>
                      <FontAwesomeIcon icon={faUser}></FontAwesomeIcon> {name === msg.name ? 'You' : msg.name.replace(/-\d+/g, '')}: <small style={{color: '#9f9f9f'}}>{new Date().toLocaleTimeString().slice(0, 4)}</small></h3>
                    <br />{msg.message}
                  </li>
                  ))}
                  
                </ul>
              </div>
              <div className="p-[10px] w-full flex items-center d-block">
                <div className="div-stage">
                  <input
                    placeholder="Type a message..."
                    className="w-[75%]"
                    inputClassName="p-4 border-0 shadow-md rounded-full bg-light focus:ring-0 focus:border-0 outline-0"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <div
                    className="ml-4 p-2 cursor-pointer bg-light rounded-full" onClick={onSendMessage}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="icon icon-tabler icon-tabler-send"
                      width="30"
                      height="30"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="#2c3e50"
                      fill="none"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M10 14l11 -11" />
                      <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
                    </svg>
                  </div>

                </div>

              </div>
            </>}

        </div>}

      </main>
    </>
  );
};

export default VideoRoom;
