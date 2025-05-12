import React from "react";
import { View, Text, Image, ScrollView, StyleSheet } from "react-native";
import { Rating } from "react-native-ratings";

// Objeto de imágenes
const PLATILLOS_IMAGENES = {
  // Tacos
  "taco_master.jpg": require("../assets/images/platillos/taco_master.jpg"),

  // Mariscos
  "camaron_empanizado.jpg": require("../assets/images/platillos/camaron_empanizado.jpg"),

  // Aguachiles
  "aguachile_negro.jpg": require("../assets/images/platillos/aguachile_negro.jpg"),

  // Hamburguesas
  "hamburguesa_camaron.jpg": require("../assets/images/platillos/hamburguesa_camaron.jpg"),

  // Cocteles
  "el_brujo.jpg": require("../assets/images/platillos/el_brujo.jpg"),

  // Imagen por defecto
  "default.jpg": require("../assets/images/platillos/default.jpg"),
};

// Datos de los platillos
const PLATILLOS_EJEMPLO = [
  {
    id: 1,
    nombre: "Taco Master",
    imagen: "taco_master.jpg",
    calificacion: 4.5,
    precio: "$120",
    descripcion:
      "Taco con carne de res, lechuga, tomate y salsa especial de la casa",
    categoria: "Tacos",
  },
  {
    id: 2,
    nombre: "Camarón Empanizado",
    imagen: "camaron_empanizado.jpg",
    calificacion: 4.8,
    precio: "$150",
    descripcion:
      "Camarones empanizados crujientes con salsa de mostaza y limón",
    categoria: "Mariscos",
  },
  {
    id: 3,
    nombre: "Aguachile Negro",
    imagen: "aguachile_negro.jpg",
    calificacion: 4.3,
    precio: "$180",
    descripcion:
      "Aguachile con un toque especial de tinta de pulpo y chile serrano",
    categoria: "Aguachiles",
  },
  {
    id: 4,
    nombre: "Hamburguesa Camarón",
    imagen: "hamburguesa_camaron.jpg",
    calificacion: 4.7,
    precio: "$110",
    descripcion:
      "Hamburguesa con camarones empanizados, aguacate y vegetales frescos",
    categoria: "Hamburguesas",
  },
  {
    id: 5,
    nombre: "Cóctel El Brujo",
    imagen: "el_brujo.jpg",
    calificacion: 4.9,
    precio: "$95",
    descripcion:
      "Cóctel especial con mezcla de mariscos frescos y salsa secreta",
    categoria: "Cocteles",
  },
];

const Carrusel = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Platillos Destacados ⭐</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carrusel}
      >
        {PLATILLOS_EJEMPLO.map((platillo) => (
          <View key={platillo.id} style={styles.tarjeta}>
            <Image
              source={
                PLATILLOS_IMAGENES?.[
                  platillo.imagen as keyof typeof PLATILLOS_IMAGENES
                ] ?? PLATILLOS_IMAGENES["default.jpg"]
              }
              style={styles.imagen}
              resizeMode="cover"
            />
            <View style={styles.contenido}>
              <Text style={styles.categoria}>{platillo.categoria}</Text>
              <Text style={styles.nombre}>{platillo.nombre}</Text>
              <Text style={styles.precio}>{platillo.precio}</Text>
              <View style={styles.ratingContainer}>
                <Rating
                  type="star"
                  ratingCount={5}
                  imageSize={20}
                  readonly
                  startingValue={platillo.calificacion}
                  tintColor="#f8f8f8"
                  ratingBackgroundColor="#c8c7c8"
                />
                <Text style={styles.calificacionText}>
                  {platillo.calificacion.toFixed(1)}
                </Text>
              </View>
              <Text style={styles.descripcion} numberOfLines={2}>
                {platillo.descripcion}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    backgroundColor: "#f8f8f8",
    paddingVertical: 10,
    borderRadius: 15,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 20,
    marginBottom: 15,
    color: "#2c3e50",
  },
  carrusel: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  tarjeta: {
    width: 250,
    backgroundColor: "white",
    borderRadius: 15,
    marginRight: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  imagen: {
    width: "100%",
    height: 160,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  contenido: {
    padding: 15,
  },
  categoria: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 5,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  nombre: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    color: "#2c3e50",
  },
  precio: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  calificacionText: {
    fontSize: 14,
    color: "#f39c12",
    marginLeft: 8,
    fontWeight: "700",
  },
  descripcion: {
    fontSize: 13,
    color: "#7f8c8d",
    lineHeight: 18,
  },
});

export default Carrusel;
