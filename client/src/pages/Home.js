import { useState } from "react";
import { useNavigate } from "react-router-dom";
export default function Home() {
  const navigate = useNavigate();
  const [user, setUserData] = useState({});
  const [stream, setStream] = useState(null);

  const onCreateRoom = () => {
    console.log("user", { user })
    localStorage.setItem('roomName', user.room);
    localStorage.setItem('name', user.name);
    if (user.room != undefined && user.name != undefined && user.room != ' ' && user.name != ' ' && user.room != '' && user.name != '') {

      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: true
        })
        .then((streams) => {
          navigate("/video-call/", {
            state: {
              roomId: user.room,
              name: user.name
            }
          })
        })
        .catch((error) => {
          alert("Camera and Microphone Access Required")
        });

    }
    else {
      alert("Fill the Details")
    }

  };

  const handlChange = (e) => {
    setUserData({
      ...user,
      [e.target.name]: e.target.value
    });
  };
  return (
    <>
      <section className="container">
        <div className="d-flex flex-column align-center justify-center">
          <h1 className="uppercase bleu" id="app">
            Meet from anywhere.
          </h1>
          <input
            type="text"
            name="room"
            placeholder="Room Number"
            className="mt-3"
            value={user.room}
            onChange={handlChange}
          />
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            className="mt-3"
            value={user.name}
            onChange={handlChange}
          />
          <div className="d-flex mt-3">
            <button className="btn mr-1" onClick={onCreateRoom}>
              <i className="fa fa-video mr-1"></i>Join Video room
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
