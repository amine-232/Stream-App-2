import React, { useRef } from "react";
import { Pressable, Image, Platform } from "react-native";
import { useHover } from "react-native-web-hooks";

const IconButton = ({ onPress, size, color, icon }) => {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: size, height: size, padding: 2, userSelect: "non" }}
    >
      <Image
        style={{ width: "100%", height: "100%" }}
        source={icon}
        resizeMode="contain"
        tintColor={Platform === "web" ? myHover : ""}
      />
    </Pressable>
  );
};

export default IconButton;
