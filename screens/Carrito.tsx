import React from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useCarrito } from "../context/CarritoContext";

const Carrito = () => {
  const { carrito, quitarDelCarrito, limpiarCarrito } = useCarrito();

  const total = carrito.reduce((sum, item) => sum + item.precio * (item.cantidad || 1), 0);
  
  const renderItem = ({ item }: any) => (
    <View style={styles.itemContainer}>
      {item.imagen && (
       <Image source={item.imagen} style={styles.imagen} />
      )}
      <View style={styles.infoContainer}>
        <Text style={styles.nombre}>{item.nombre}</Text>
        <Text style={styles.descripcion}>{item.descripcion}</Text>
        <Text style={styles.precio}>
          {item.cantidad} x ${Number(item.precio).toFixed(2)}
        </Text>
        <TouchableOpacity
          style={styles.botonQuitar}
          onPress={() => quitarDelCarrito(item.id)}
        >
          <Text style={styles.textoBoton}>Quitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={carrito}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.vacio}>Tu carrito está vacío.</Text>}
      />
      {carrito.length > 0 && (
        <View style={styles.totalContainer}>
          <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
          <TouchableOpacity style={styles.botonLimpiar} onPress={limpiarCarrito}>
            <Text style={styles.textoBoton}>Vaciar carrito</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  itemContainer: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 12,
    padding: 10,
    alignItems: "center",
  },
  imagen: { width: 80, height: 80, borderRadius: 8,  resizeMode: "cover", marginRight: 10 },
  infoContainer: { flex: 1 },
  nombre: { fontSize: 18, fontWeight: "bold" },
  descripcion: { fontSize: 14, color: "#555" },
  precio: { fontSize: 16, marginTop: 4 },
  botonQuitar: {
    marginTop: 6,
    backgroundColor: "#ff6347",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  textoBoton: { color: "#fff", fontWeight: "bold" },
  totalContainer: {
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingTop: 16,
    marginTop: 10,
    alignItems: "center",
  },
  total: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  botonLimpiar: {
    backgroundColor: "#ff3b30",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  vacio: { textAlign: "center", marginTop: 30, fontSize: 16, color: "#999" },
});

export default Carrito;
