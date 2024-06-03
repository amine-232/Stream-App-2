import { useNavigation } from "@react-navigation/native";
import React, { createContext, useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import Peer from "peerjs";

const SocketContext = createContext();

const SocketProvider = ({ children }) => {
  const [isGuest, setIsGuest] = useState(false);
  const [socket, setSocket] = useState(null);
  const [guestRequests, setGuestRequests] = useState([]);
  const [roomId, setRoomId] = useState();
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [guestStreams, setGuestStreams] = useState(new Map());
  const [creatorId, setCreatorId] = useState(null);
  const [users, setUsers] = useState([]);
  const navigation = useNavigation();
  const localVideoRef = useRef(null);
  const videosContainer = useRef(null);
  //// Peer connection

  const myPeer = new Peer(undefined, {
    host: "localhost",
    port: "3005",
  });
  // let's add the steaming

  useEffect(() => {
    const newSocket = io("http://localhost:4000");
    setSocket(newSocket);

    newSocket.on("guestJoinRequest", ({ userId }) => {
      setGuestRequests((prev) => [...prev, { userId }]);
    });

    // Event listener for updateGuestRequests
    newSocket.on("updateGuestRequests", (updatedRequests) => {
      setGuestRequests(updatedRequests);
    });

    // Event listener for roomsUpdated
    newSocket.on("roomsUpdated", (updatedRooms) => {
      setRooms(updatedRooms);
    });

    newSocket.on("joinRequestAccepted", ({ roomId }) => {
      console.log(`Join request accepted for room ${roomId}`);
      setIsGuest(true);
      // Additional logic to handle when join request is accepted
    });

    newSocket.on("joinRequestRejected", ({ roomId }) => {
      console.log(`Join request rejected for room ${roomId}`);
      // Additional logic to handle when join request is rejected
    }); // Emit getRooms event

    newSocket.emit("getRooms");

    return () => {
      socket.emit("leaveRoom", roomId);
    };
  }, []);

  // call back function to return request state with state message Accept case and Reject Case message are coming from

  // the backEnd server if you want to change the message get to the backEnd

  const callback = (success, message) => {
    console.log("success, message", success, message);
  };

  // setRoomUsersListener is function that wrap the useFFect to be use in the room and add the socket
  const setRoomUsersListener = (socket) => {
    if (socket) {
      // get the online room to show in the room list
      socket.emit("getRooms");

      // get any update that may happing in the room is call back function
      socket.on("roomsUpdated", (updatedRooms) => {
        console.log("updatedRooms", updatedRooms);
        setRooms(updatedRooms);
      });

      // kicked it navigate the user to home out of the room
    }
    // get the room info the creatorId is the streamer and it check if the id is equal to the streamer
    // if streamer is true it set the state and alos is set the user list
    socket.on("roomUsers", ({ users, creatorId, moderators }) => {
      if (socket) {
        setUsers(users);
        const currentUser = users.find((user) => user.id === socket.id);
        if (currentUser) {
          setIsCreator(currentUser === creatorId ? true : false);
          if (creatorId)
            setCreatorId(creatorId === socket.id ? creatorId : null);
          setIsModerator(moderators.includes(socket.id));
        }
      }
    });

    /// the bellow section is for the socket off after receiving the even to turn the socket off so we can receive new
    /// notifications
    return () => {
      socket.off("roomsUpdated");
      socket.off("roomUsers");
      socket.off("kicked");
    };
  };

  //////////////////////////////////////////

  ////////////////////////////////////////////

  // this section is the buttons
  const requestToJoin = (roomId) => {
    if (socket) {
      socket.emit("requestToJoin", { roomId, userId: socket.id }, (info) => {
        callback(info.success, info.message);
      });
    }
  };

  const respondToJoinRequest = ({ userId, roomId, accept }) => {
    if (socket) {
      socket.emit(
        "respondToJoinRequest",
        { roomId: roomId, userId, accept },
        (info) => {
          callback(info.success, info.message);
        }
      );
    }
  };

  const handleResponse = ({ userId, accept }) => {
    socket.emit(
      "respondToJoinRequest",
      { roomId: roomId, userId, accept: accept },
      (response) => {
        if (response.success) {
          setGuestRequests((prev) =>
            prev.filter((req) => req.userId !== userId)
          );
        } else {
          console.error(response.message);
        }
      }
    );
  };

  // add this function to you'er messaging button in the same page

  // const sendMessage = () => {
  //   if (message.trim()) {
  //     socket.emit("message", { roomId: room.id, message });
  //     setMessage("");
  //   }
  // };

  const addModerator = (userId) => {
    if (socket) {
      socket.emit("addModerator", room.id, userId);
    }
  };

  const removeModerator = (userId) => {
    if (socket) {
      socket.emit("removeModerator", room.id, userId);
    }
  };

  const handleCreateRoom = ({ roomName, navigation }) => {
    socket.emit("createRoom", roomName, (room) => {
      setRoomId(room.id);
      navigation.navigate("RoomDetail", { room, isCreator: true });
    });
  };

  const GuestMakeRequest = ({ setRequestStatus }) => {
    const userId = socket.id;
    socket.emit("requestToJoin", { roomId: roomId, userId }, (response) => {
      setRequestStatus(response.message);
    });
  };

  const contextValue = {
    addModerator,
    removeModerator,
    handleCreateRoom,
    requestToJoin,
    respondToJoinRequest,
    handleResponse,
    GuestMakeRequest,
    videosContainer,
    guestRequests: guestRequests,
    socket: socket,
    roomId,
    guestStreams,
    rooms,
    room,
    users,
    isGuest: isGuest,
    isCreator,
    isModerator,
    creatorId,
    setUsers,
    setRoomUsersListener,
    setRooms,
    setRoomId,
    setRoom,
    myPeer,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext, SocketProvider };
