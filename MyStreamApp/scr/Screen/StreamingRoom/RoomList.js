import React, { useContext, useEffect, useState } from "react";

import { View, Text, Button, FlatList, StyleSheet } from "react-native";
import { SocketContext } from "../../Context/SocketContext";

const RoomListScreen = ({ navigation }) => {
  const { socket, isCreator, setRooms, rooms } = useContext(SocketContext);

  useEffect(() => {
    socket.emit("getRooms");

    socket.on("roomsUpdated", (updatedRooms) => {
      setRooms(updatedRooms);
    });

    return () => {
      socket.off("roomsUpdated");
    };
  }, []);

  const Itemrender = ({ item }) => {
    return (
      <View style={styles.room}>
        <Text>{item[1].name}</Text>
        <Button
          title="Join"
          onPress={() =>
            navigation.navigate("RoomDetail", {
              room: { id: item[0], ...item[1] },
            })
          }
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rooms</Text>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item[0]}
        renderItem={({ item }) => <Itemrender item={item} />}
      />
    </View>
  );
};

export default RoomListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  room: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
