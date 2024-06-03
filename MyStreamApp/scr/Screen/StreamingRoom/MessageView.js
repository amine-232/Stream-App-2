import React, { useState, useEffect, useRef, useContext } from "react";
import { View, Text, FlatList, Dimensions } from "react-native";
import { SocketContext } from "../../Context/SocketContext";

const itemHeight = 120;

const MessageCard = ({ message, username }) => {
  return (
    <View
      style={{
        width: "100%",
        padding: 10,
        borderWidth: 1,
        borderColor: "silver",
        height: "100%",
        flexDirection: "row",
      }}
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          borderWidth: 1,
          borderColor: "silver",
          marginHorizontal: 10,
        }}
      ></View>
      <View style={{ height: "auto", width: "auto" }}>
        <Text
          style={{
            fontWeight: "700",
            color: "black",
            fontSize: 20,
          }}
        >
          {username}:
        </Text>
        <View style={{ height: "100%", width: "100%" }}>
          <Text>{message}</Text>
        </View>
      </View>
    </View>
  );
};
const MessageView = ({ socket }) => {
  const [messages, setMessages] = useState([]);

  const scrollToRef = useRef();

  useEffect(() => {
    socket.on("message", handleNewMessage);

    return () => {
      socket.off("message", handleNewMessage);
      socket.off("kicked");
    };
  }, [socket]);

  const scrollToEnd = () => {
    if (scrollToRef.current) {
      scrollToRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleNewMessage = (msg) => {
    setMessages((prevMessages) => [...prevMessages, msg]);
  };

  useEffect(() => {
    scrollToEnd();
  }, [messages]);

  return (
    <FlatList
      ref={scrollToRef}
      data={messages}
      getItemLayout={(data, index) => {
        return { index, length: itemHeight, offset: itemHeight * index };
      }}
      style={{ height: Dimensions.get("window").height * 0.6 }}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => (
        <View
          style={{
            width: "100%",
            height: itemHeight,
            borderWidth: 1,
            borderColor: "silver",
          }}
        >
          <MessageCard message={item.message} username={item.username} />
        </View>
      )}
    />
  );
};

export default MessageView;
