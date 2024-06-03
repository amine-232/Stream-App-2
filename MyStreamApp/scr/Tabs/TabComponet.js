// before using this component Please make sure that you have added the @react-navigation/material-top-tabs to you'r dependancies
// you can add them using the follow commands
// if you use yarn please use the following command:
// yarn add  @react-navigation/material-top-tabs
// if you are using npm then use the following command:
// npm i  @react-navigation/material-top-tabs
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import React from "react";
const TabStack = createMaterialTopTabNavigator();
const TabCompnent = ({ data, initTab }) => {
  console.log("TabStack", data, initTab);
  return (
    <TabStack.Navigator initialRouteName={data.initTab}>
      {data.map((x, index) => (
        <TabStack.Screen key={index} name={x.tabName} component={x.screen} />
      ))}
    </TabStack.Navigator>
  );
};
export default TabCompnent;
