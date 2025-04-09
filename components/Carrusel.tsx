import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import axios from "axios";

const { width } = Dimensions.get("window");

// Mapeo estático de imágenes
const imageMap: { [key: string]: any } = {
  "sopa.jpg": require("../assets/images/sopa.jpg"),
  "pescado.jpg": require("../assets/images/pescado.jpg"),
  "camaron.jpg": require("../assets/images/camaron.jpg"),
  "frito.jpg": require("../assets/images/frito.jpg"),
  "tacos.jpg": require("../assets/images/tacos.jpg"),
  "lisa.jpg": require("../assets/images/lisa.jpg"),
  "frio.jpg": require("../assets/images/frio.jpg"),
  "torre.jpg": require("../assets/images/torre.jpg"),
};

export default function Carrusel() {
  interface Platillo {
    id: string;
    nombre: string;
    imagen: string;
    calificacion_promedio: number; // Add this line
    // Add other properties as needed
  }
  const [activeIndex, setActiveIndex] = useState(0);
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchPlatillos();
  }, []);

  const fetchPlatillos = async () => {
    const response = await axios.get(
      "http://10.19.100.158:3000/mejores-platillos"
    );
    setPlatillos(response.data);
  };

  const handleScrollEnd = (event: {
    nativeEvent: { contentOffset: { x: number } };
  }) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(slide);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Platillos Destacados</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.scrollView}
      >
        {platillos.map((platillo) => (
          <View key={platillo.id} style={styles.card}>
            <Image source={imageMap[platillo.imagen]} style={styles.image} />
            <View style={styles.overlay}>
              <Text style={styles.platilloName}>{platillo.nombre}</Text>
              <Text style={styles.rating}>
                {Number(platillo.calificacion_promedio || 0).toFixed(1)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 20,
    width: "100%",
    padding: 20,
    backgroundColor: "#f5f5f5", // Fondo gris claro
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0043FF",
    marginBottom: 20,
  },
  scrollView: {
    width,
  },
  card: {
    width,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "80%", // Ajusta el ancho proporcionalmente
    height: 200, // Fija la altura
    borderRadius: 15, // Bordes redondeados
    borderWidth: 2, // Grosor del borde
    borderColor: "#000", // Color negro para el borde
  },

  overlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    borderRadius: 10,
  },
  platilloName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  rating: {
    fontSize: 16,
    color: "#FFD700",
  },
});
