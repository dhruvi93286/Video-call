import React, { useEffect, useRef } from "react";
import poster from "./poster";

export default function RemoteVideo(user) {
  const videoRef = useRef(null);
  console.log("user.useruser.user11------>", user);
  useEffect(() => {
    console.log("user.useruser.user1155555555------>", user.user);
    videoRef.current.srcObject = user.user;
  }, [user.user]);

  return (
    <div className="w-100 h-100 bg-black d-flex justify-center align-center br7">
      <video
        className="w-100 h-100 br7"
        poster={poster(user.username)}
        // key={user.user.id+"gd"+Math.random()}
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "300px", transform: "scaleX(-1)" }}
      />
    </div>
  );
}
