import { createStackNavigator } from "@react-navigation/stack";
import { useContext } from "react";
import { AuthContext } from "../Context/AuthContenxt";
import HomeStack from "./HomeStack";
import AuthStack from "./AuthStack";

const Stack = createStackNavigator();

const Routes = () => {
  const { user } = useContext(AuthContext);

  return (
    <Stack.Navigator>
      {user !== null ? (
        <Stack.Screen
          name="HomeStack"
          component={HomeStack}
          options={{ headerShown: false }}
        />
      ) : (
        <Stack.Screen
          name="AuthStack"
          component={AuthStack}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};

export default Routes;
