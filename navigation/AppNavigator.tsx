import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/Ionicons";
import { useAuth } from "@/context/AuthContext";
import Inicio from "@/screens/Inicio";
import Menu from "@/screens/Menu";
import Carrito from "@/screens/Carrito";
import PerfilAdmin from "@/screens/Admin/PerfilAdmin";
import Perfil from "@/screens/Perfil";
import Login from "@/screens/Login";
import Registro from "@/screens/Registro";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeTabs = () => {
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "home";

          if (route.name === "Inicio") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Menú") {
            iconName = focused ? "restaurant" : "restaurant-outline";
          } else if (route.name === "Carrito") {
            iconName = focused ? "cart" : "cart-outline";
          } else if (route.name === "Perfil") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "tomato",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="Inicio" component={Inicio} />
      <Tab.Screen name="Menú" component={Menu} />
      <Tab.Screen name="Carrito" component={Carrito} />
      <Tab.Screen name="Perfil" component={Perfil} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Registro" component={Registro} />
          </>
        ) : user.tipo_usuario === "admin" ? (
          <Stack.Screen name="PerfilAdmin" component={PerfilAdmin} />
        ) : (
          <Stack.Screen 
            name="MainApp" 
            component={HomeTabs}
            listeners={({ navigation }) => ({
              focus: () => {
                // Navegar a Inicio cada vez que se enfoca MainApp
                navigation.navigate('Inicio');
              },
            })}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;