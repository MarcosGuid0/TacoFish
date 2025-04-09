import { StackNavigationProp } from "@react-navigation/stack";


// types/types.ts
export type RootStackParamList = {
  Login: undefined;
  Registro: undefined;
  Home: undefined;
  PerfilAdmin: undefined;
  Perfil: undefined;
  Inicio: undefined;
  AdminStack: undefined;
  MainApp: undefined;
};


export type InicioScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Inicio"
>;