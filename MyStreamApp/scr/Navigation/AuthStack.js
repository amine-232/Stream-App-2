import { createStackNavigator } from "@react-navigation/stack";
import Login from "../Screen/Login";
import SignUp from "../Screen/SignUp";

const StackAuth = createStackNavigator();

const AuthStack = () => {
  return (
    <StackAuth.Navigator initialRouteName="login">
      <StackAuth.Screen
        name="login"
        component={Login}
        options={{ headerShown: false }}
      />
      <StackAuth.Screen
        name="signUp"
        component={SignUp}
        options={{ headerShown: false }}
      />
    </StackAuth.Navigator>
  );
};

export default AuthStack;
