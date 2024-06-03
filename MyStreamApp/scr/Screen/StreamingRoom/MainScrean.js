import React, { useContext, useState } from "react";
import { View, Text, Button, StyleSheet, TextInput } from "react-native";
import { SocketContext } from "../../Context/SocketContext";
import RoomListScreen from "./RoomList";

const CreateRoomScreen = ({ navigation }) => {
  const [roomName, setRoomName] = useState("");
  const { handleCreateRoom } = useContext(SocketContext);

  return (
    <View style={styles.container}>
      <RoomListScreen navigation={navigation} />
      <Text style={styles.title}>Create Room</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter room name"
        value={roomName}
        onChangeText={setRoomName}
      />
      <Button
        title="Create"
        onPress={() => handleCreateRoom({ roomName, navigation })}
      />
    </View>
  );
};

export default CreateRoomScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  input: {
    width: "100%",
    padding: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
  },
});
