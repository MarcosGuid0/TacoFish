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
  PlatillosCategoria: {
    categoriaId: number;
    categoriaNombre: string;
  };
};

export interface Platillo {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  categoria_id?: number;
}
export type InicioScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Inicio"
>;