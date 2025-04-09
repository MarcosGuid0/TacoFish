import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Carrusel from "@/components/Carrusel";
export default function Inicio() {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.titulo}>TacoFish</Text>
        <Ionicons name="notifications-outline" size={28} color="#000000" />
      </View>
      <Text style={styles.subtitulo}>La mejor comida de la sierra</Text>
      <View style={styles.linea} />
      <Text style={styles.destacados}>Nuestros Platillos</Text>
      <Text style={styles.text}>Bienvenido a TacoFish 🍽️</Text>
      <Carrusel />
      <Text style={styles.categoria}>Nuestras Categorias</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20, // Margen lateral
    paddingTop: 40, // Margen superior
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0084FF",
  },
  subtitulo: {
    fontSize: 18,
    color: "#B8B8B8",
    marginBottom: 4,
  },
  linea: {
    width: "100%",
    height: 1,
    backgroundColor: "#00DDFF",
    marginBottom: 12,
  },
  destacados: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  categoria: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    alignSelf: "center",
  },
});
