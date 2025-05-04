import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer, NavigationProp, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RootStackParamList } from "@/types/types";

// Pantallas
import Inicio from "@/screens/Inicio";
import Menu from "@/screens/Menu";
import Carrito from "@/screens/Carrito";
import Perfil from "@/screens/Perfil";
import PerfilAdmin from "@/screens/Admin/PerfilAdmin";
import Login from "@/screens/Login";
import Registro from "@/screens/Registro";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

type IconName =
  | "home"
  | "home-outline"
  | "person"
  | "person-outline"
  | "restaurant"
  | "restaurant-outline"
  | "cart"
  | "cart-outline";

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Registro" component={Registro} />
    </Stack.Navigator>
  );
};

const ProfileRedirect = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  React.useEffect(() => {
    if (user && user.tipo_usuario !== "admin") {
      // Redirigir a Inicio si el usuario es cliente
      navigation.navigate("Inicio");
    }
  }, [user, navigation]);

  if (user) {
    if (user.tipo_usuario === "admin") {
      return (
        <PerfilAdmin setIsLoggedIn={(isLoggedIn) => console.log(isLoggedIn)} />
      );
    }
    return <Perfil />;
  }

  return <AuthStack />;
};

const HomeTabs = () => {
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: IconName;

          switch (route.name) {
            case "Inicio":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Menú":
              iconName = focused ? "restaurant" : "restaurant-outline";
              break;
            case "Carrito":
              iconName = focused ? "cart" : "cart-outline";
              break;
            case "Perfil":
              iconName = focused ? "person" : "person-outline";
              break;
            default:
              iconName = "home";
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#ff6347",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Inicio" component={Inicio} />
      <Tab.Screen name="Menú" component={Menu} />
      <Tab.Screen name="Carrito" component={Carrito} />
      <Tab.Screen name="Perfil" component={ProfileRedirect} />
    </Tab.Navigator>
  );
};

const App = () => {
  return (
    <AuthProvider>
        <HomeTabs />
    </AuthProvider>
  );
};

export default App;