import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import usersIcon from "../../../assets/usersIcon.png";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { SocketContext } from "../../Context/SocketContext";
import RoomListUsers from "./RoomListUsers";
import RequestCard from "./RequestCard";
import MessageView from "./MessageView";
import IconButton from "../../component/IconButton";
import TestView from "./Viewer";
import TeatStreaming from "./Stream";

const RoomDetailScreen = ({ route }) => {
  const {
    socket,
    creatorId,
    requestToJoin,
    guestRequests,
    setUsers,
    isModerator,
    users,
    setRooms,
    addModerator,
    removeModerator,
    setRoomUsersListener,
    isGuest,
    myPeer,
  } = useContext(SocketContext);
  console.log("guestRequests", guestRequests);

  const { room, isCreator } = route.params;
  const [message, setMessage] = useState("");
  const [showBtn, setShowBtn] = useState(null); // Updated to store user id
  const [requestState, setRequestState] = useState(false);
  const [isShowList, setIsShowList] = useState(false);
  let roomId = room.id;

  useEffect(() => {
    socket.emit("joinRoom", room.id);
    setRoomUsersListener(socket);
    socket.on("kicked", (roomId) => {
      if (roomId === roomId) {
        console.log("You have been kicked out of the room");
        navigation.navigate("home");
      }
    });
    return () => {
      socket.off("kicked");
    };
  }, []);

  useEffect(() => {}, [guestRequests, isShowList]);

  console.log("RoomDetailScreen", users);

  const navigation = useNavigation();

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("message", { roomId: room.id, message });
      setMessage("");
    }
  };

  const kickUser = (userId) => {
    if (socket) {
      socket.emit("kickUser", room.id, userId);
    }
  };
  const handleUserPress = (user) => {
    setShowBtn((prev) => (prev === user.id ? null : user.id));
  };

  const closeRoom = () => {
    if (socket) {
      socket.emit("closeRoom", room.id);
      navigation.navigate("home");
    }
  };

  const btndata = [
    {
      text: "Set as Moderator",
      onPress: (user) => {
        addModerator(user.id);
        setShowBtn(null);
      },
    },
    {
      text: "Remove Moderator",
      onPress: (user) => {
        removeModerator(user.id), setShowBtn(null);
      },
      // Show this option only if the user is already a moderator
      condition: (user) => user.isModerator,
    },
    {
      text: "Kick Out",
      onPress: (user) => {
        kickUser(user.id);
        setUsers((prev) => prev.filter((prev) => prev.id !== user.id));

        setShowBtn(null);
      },
    },
  ];

  const ShowRoomList = () => {
    if (!isShowList) {
      setIsShowList(true);
    } else {
      setIsShowList(false);
    }
  };

  return (
    <View style={{ width: "100%", height: "100%", flexDirection: "column" }}>
      <View
        style={{
          width: "100%",
          height: "auto",
          flexDirection: "row",
          padding: 5,
          borderWidth: 1,
          borderColor: "silver",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: "auto",
            height: "auto",
            marginRight: "auto",
            marginLeft: "auto",
          }}
        >
          <Text style={styles.title}>{room.id}</Text>
        </View>
        <View
          style={{
            width: "auto",
            height: "auto",
            marginRight: 10,
            marginLeft: "auto",
          }}
        >
          <IconButton icon={usersIcon} size={30} onPress={ShowRoomList} />
        </View>
        {isCreator ? (
          <Button title="Close Room" onPress={closeRoom} />
        ) : (
          <Button title="Make Request" onPress={() => requestToJoin(room.id)} />
        )}
        <Button title="Exit" onPress={() => navigation.navigate("home")} />
      </View>
      <View style={{ width: "100%", height: "92%", flexDirection: "row" }}>
        <View
          style={{
            width: "60%",
            height: "100%",
            borderWidth: 1,
            borderColor: "silver",
          }}
        >
          {isCreator | isGuest ? (
            <TeatStreaming socket={socket} isCreator={isCreator} />
          ) : (
            <TestView socket={socket} isCreator={isCreator} />
          )}
        </View>
        <View
          style={{
            width: "40%",
            height: "auto",
            flexDirection: "column",
            borderWidth: 1,
            borderColor: "silver",
          }}
        >
          {requestState ? <Text>{room.name}</Text> : null}
          <MessageView socket={socket} />
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter message"
              value={message}
              onChangeText={setMessage}
            />
            <Button
              title="Send"
              onPress={() => sendMessage({ socket, message, setMessage })}
            />
          </View>
        </View>
        {isShowList ? (
          <View
            style={{
              width: "30%",
              height: "100%",
              borderWidth: 1,
              borderColor: "silver",
              position: "absolute",
              backgroundColor: "#fff",
              right: 0,
              top: 0,
            }}
          >
            <RoomListUsers
              users={Object.values(users)}
              isCreator={isCreator}
              creatorId={creatorId}
              showBtn={showBtn}
              setShowBtn={setShowBtn}
              isModerator={isModerator}
              btndata={btndata}
              handleUserPress={handleUserPress}
            />
          </View>
        ) : null}
      </View>
      <RequestCard guestRequests={guestRequests} roomId={roomId} />
    </View>
  );
};

export default RoomDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
  },
  message: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  username: {
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginRight: 8,
  },
  user: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
