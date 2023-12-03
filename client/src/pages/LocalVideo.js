import { memo, useEffect, useRef } from "react";
import poster from './poster';

function LocalVideo(stream) {
  const videoRef = useRef();

//   useEffect(() => {
//     console.log("stream.stream",stream)
//     videoRef.current.srcObject = stream.stream;
//   }, [stream.stream]);

  if (stream) {
    return <video
      ref={stream.stream}
      className="w-100 h-100 br7"
      autoPlay
      muted
      playsInline
      style={{transform: "scaleX(-1)" }}
      poster={poster('You')}
      >
    </video>
  }
  else {
    return <div className="w-100 h-100 bg-black d-flex justify-center align-center br7">
      <img height="100" width="100" src={poster('You')} alt="You" />
    </div>
  }
}

export default memo(LocalVideo)