import React, { useContext } from "react";
import { View, Text, Button } from "react-native";
import { SocketContext } from "../../Context/SocketContext";

const RequestCard = ({ guestRequests }) => {
  console.log("RequestCard", guestRequests);

  const { respondToJoinRequest, roomId } = useContext(SocketContext);

  return (
    <View
      style={{
        width: "100%",
        height: "auto",
        flexDirection: "column",
        position: "absolute",
        bottom: 10,
        backgroundColor: "#fff",
      }}
    >
      {guestRequests.map((reqst, index) => (
        <View
          style={{
            width: "80%",
            height: "auto",
            flexDirection: "column",
            marginVertical: 10,
          }}
          key={index}
        >
          <View
            style={{
              width: "100%",
              height: "auto",
              justifyContent: "space-evenly",
              alignItems: "center",
              flexDirection: "row",
            }}
          >
            <Text>{reqst.userId}</Text>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "silver",
              }}
            ></View>
          </View>

          <View
            style={{
              width: "100%",
              height: "auto",
              justifyContent: "space-evenly",
              flexDirection: "row",
            }}
          >
            <Button
              onPress={() =>
                respondToJoinRequest({
                  accept: true,
                  userId: reqst.userId,
                  roomId: roomId,
                })
              }
              title="Accept"
              style={{ width: "40%" }}
            />
            <Button
              onPress={() =>
                respondToJoinRequest({
                  accept: false,
                  userId: reqst.userId,
                  roomId: roomId,
                })
              }
              title="Reject"
              style={{ width: "40%" }}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

export default RequestCard;
