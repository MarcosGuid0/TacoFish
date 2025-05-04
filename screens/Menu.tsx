import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface Categoria {
  id: number;
  nombre: string;
}

interface Platillo {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string | null;
  categoria: {
    id: number;
    nombre: string;
  };
}

interface CategoriaImagenes {
  [id: number]: any;
}

interface PlatilloImagenes {
  [key: string]: any;
}

const { width } = Dimensions.get("window");
const NUM_COLUMNS = 2;
const ITEM_MARGIN = 16;
const ITEM_WIDTH = (width - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH * 1.2;

// Imágenes de categorías
const CATEGORIAS_IMAGENES: CategoriaImagenes = {
  1: require("../assets/images/platillos/taco_fish.jpg"),
  2: require("../assets/images/platillos/caldo_7_mares.jpg"),
  3: require("../assets/images/platillos/camaron_empanizado.jpg"),
  4: require("../assets/images/platillos/coctel_camaron_mediano.jpg"),
  5: require("../assets/images/platillos/el_aguachile.jpg"),
  6: require("../assets/images/platillos/tostada_pulpo.jpg"),
  7: require("../assets/images/platillos/ceviche_camaron_medio.jpg"),
  8: require("../assets/images/platillos/callitos.jpg"),
  9: require("../assets/images/platillos/tosticamaron.jpg"),
  10: require("../assets/images/platillos/hamburguesa_doble.jpg"),
  11: require("../assets/images/platillos/soda.jpg"),
};

const PLATILLOS_IMAGENES: PlatilloImagenes = {
  // Tacos (categoría_id 1)
  "taco_fish.jpg": require("../assets/images/platillos/taco_fish.jpg"),
  "taco_mixto.jpg": require("../assets/images/platillos/taco_mixto.jpg"),
  "taco_master.jpg": require("../assets/images/platillos/taco_master.jpg"),
  "taco_camacino.jpg": require("../assets/images/platillos/taco_camacino.jpg"),

  // Mariscos (categoría_id 2)
  "queca.jpg": require("../assets/images/platillos/queca.jpg"),
  "quesadilla_marlin.jpg": require("../assets/images/platillos/quesadilla_marlin.jpg"),
  "quesadilla_pulpo.jpg": require("../assets/images/platillos/quesadilla_pulpo.jpg"),
  "burrito_marlin.jpg": require("../assets/images/platillos/burrito_marlin.jpg"),
  "caldo_7_mares.jpg": require("../assets/images/platillos/caldo_7_mares.jpg"),
  "caldo_camaron.jpg": require("../assets/images/platillos/caldo_camaron.jpg"),
  "jugo_vichi.jpg": require("../assets/images/platillos/jugo_vichi.jpg"),
  "el_30.jpg": require("../assets/images/platillos/el_30.jpg"),
  "el_mixto.jpg": require("../assets/images/platillos/el_mixto.jpg"),
  "el_rey.jpg": require("../assets/images/platillos/el_rey.jpg"),

  // Empanizados y capeados (categoría_id 3)
  "camaron_empanizado.jpg": require("../assets/images/platillos/camaron_empanizado.jpg"),
  "camaron_williams.jpg": require("../assets/images/platillos/camaron_williams.jpg"),
  "pescado_empanizado.jpg": require("../assets/images/platillos/pescado_empanizado.jpg"),

  // Cocteles (categoría_id 4)
  "coctel_camaron_chabela.jpg": require("../assets/images/platillos/coctel_camaron_chabela.jpg"),
  "coctel_camaron_mediano.jpg": require("../assets/images/platillos/coctel_camaron_mediano.jpg"),
  "coctel_aguachile_chabela.jpg": require("../assets/images/platillos/coctel_aguachile_chabela.jpg"),
  "coctel_aguachile_mediano.jpg": require("../assets/images/platillos/coctel_aguachile_mediano.jpg"),
  "campechana.jpg": require("../assets/images/platillos/campechana.jpg"),
  "maleficio.jpg": require("../assets/images/platillos/maleficio.jpg"),
  "el_brujo.jpg": require("../assets/images/platillos/el_brujo.jpg"),
  "coctel_camaron_pulpo.jpg": require("../assets/images/platillos/coctel_camaron_pulpo.jpg"),

  // Aguachiles (categoría_id 5)
  "aguachile_negro_media.jpg": require("../assets/images/platillos/aguachile_negro_media.jpg"),
  "aguachile_con_callo.jpg": require("../assets/images/platillos/aguachile_con_callo.jpg"),
  "aguachile_levantamuertos.jpg": require("../assets/images/platillos/aguachile_levantamuertos.jpg"),
  "aguachile.jpg": require("../assets/images/platillos/aguachile.jpg"),
  "aguachile_media.jpg": require("../assets/images/platillos/aguachile_media.jpg"),
  "aguachile_negro.jpg": require("../assets/images/platillos/aguachile_negro.jpg"),
  "el_aguachile.jpg": require("../assets/images/platillos/el_aguachile.jpg"),

  // Tostadas (categoría_id 6)
  "tostada_callito.jpg": require("../assets/images/platillos/tostada_callito.jpg"),
  "tostada_camaron.jpg": require("../assets/images/platillos/tostada_camaron.jpg"),
  "tostada_aguachile.jpg": require("../assets/images/platillos/tostada_aguachile.jpg"),
  "tostada_pulpo.jpg": require("../assets/images/platillos/tostada_pulpo.jpg"),
  "tostada_suprema.jpg": require("../assets/images/platillos/tostada_suprema.jpg"),
  "tostada_doble.jpg": require("../assets/images/platillos/tostada_doble.jpg"),
  "tostada_triple.jpg": require("../assets/images/platillos/tostada_triple.jpg"),

  // Ceviches (categoría_id 7)
  "ceviche_camaron_medio.jpg": require("../assets/images/platillos/ceviche_camaron_medio.jpg"),
  "ceviche_camaron_litro.jpg": require("../assets/images/platillos/ceviche_camaron_litro.jpg"),
  "ceviche_tilapia_medio.jpg": require("../assets/images/platillos/ceviche_tilapia_medio.jpg"),
  "ceviche_tilapia_litro.jpg": require("../assets/images/platillos/ceviche_tilapia_litro.jpg"),
  "ceviche_mixto.jpg": require("../assets/images/platillos/ceviche_mixto.jpg"),

  // Callitos (categoría_id 8)
  "callitos.jpg": require("../assets/images/platillos/callitos.jpg"),
  "callito_camaron.jpg": require("../assets/images/platillos/callito_camaron.jpg"),
  "callito_camaron_pulpo.jpg": require("../assets/images/platillos/callito_camaron_pulpo.jpg"),

  // Tosticamaron (categoría_id 9)
  "tosticamaron.jpg": require("../assets/images/platillos/tosticamaron.jpg"),

  // Hamburguesas (categoría_id 10)
  "hamburguesa_clasica.jpg": require("../assets/images/platillos/hamburguesa_clasica.jpg"),
  "hamburguesa_doble.jpg": require("../assets/images/platillos/hamburguesa_doble.jpg"),
  "hamburguesa_bacona.jpg": require("../assets/images/platillos/hamburguesa_bacona.jpg"),
  "hamburguesa_bacona_doble.jpg": require("../assets/images/platillos/hamburguesa_bacona_doble.jpg"),
  "hamburguesa_mar_tierra.jpg": require("../assets/images/platillos/hamburguesa_mar_tierra.jpg"),
  "hamburguesa_especial.jpg": require("../assets/images/platillos/hamburguesa_especial.jpg"),
  "hamburguesa_camaron.jpg": require("../assets/images/platillos/hamburguesa_camaron.jpg"),
  "hamburguesa_fish.jpg": require("../assets/images/platillos/hamburguesa_fish.jpg"),
  "boneles.jpg": require("../assets/images/platillos/boneles.jpg"),
  "nuggets_papas.jpg": require("../assets/images/platillos/nuggets_papas.jpg"),
  "papas_fritas.jpg": require("../assets/images/platillos/papas_fritas.jpg"),
  "papas_queso.jpg": require("../assets/images/platillos/papas_queso.jpg"),

  // Bebidas (categoría_id 11)
  "clamato_preparado.jpg": require("../assets/images/platillos/clamato_preparado.jpg"),
  "uvola_vaso.jpg": require("../assets/images/platillos/uvola_vaso.jpg"),
  "uvola_litro.jpg": require("../assets/images/platillos/uvola_litro.jpg"),
  "uvola_jarra.jpg": require("../assets/images/platillos/uvola_jarra.jpg"),
  "horchata.jpg": require("../assets/images/platillos/horchata.jpg"),
  "jamaica.jpg": require("../assets/images/platillos/jamaica.jpg"),
  "cebada.jpg": require("../assets/images/platillos/cebada.jpg"),
  "cafe.jpg": require("../assets/images/platillos/cafe.jpg"),

  // Limonadas (categoría_id 12)
  "limonada_vaso.jpg": require("../assets/images/platillos/limonada_vaso.jpg"),
  "limonada_litro.jpg": require("../assets/images/platillos/limonada_litro.jpg"),
  "limonada_jarra.jpg": require("../assets/images/platillos/limonada_jarra.jpg"),
  "limonadam_vaso.jpg": require("../assets/images/platillos/limonadam_vaso.jpg"),
  "limonadam_litro.jpg": require("../assets/images/platillos/limonadam_litro.jpg"),
  "limonadam_jarra.jpg": require("../assets/images/platillos/limonadam_jarra.jpg"),

  // Bebidas embotelladas (categoría_id 13)
  "soda.jpg": require("../assets/images/platillos/soda.jpg"),

  // Imagen por defecto
  "default.jpg": require("../assets/images/platillos/default.jpg"),
};

const Menu = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<Categoria | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingPlatillos, setLoadingPlatillos] = useState(false);

  const fetchCategorias = async () => {
    try {
      const response = await fetch("http://192.168.1.127:3000/categorias");

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setCategorias(data);
    } catch (err) {
      setError("Error al cargar el menú. Por favor, inténtalo de nuevo.");
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatillos = async (categoriaId: number) => {
    setLoadingPlatillos(true);
    setError(null);
    try {
      const response = await fetch(
        `http://192.168.1.127:3000/categorias/${categoriaId}/platillos`
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("La respuesta no es un array válido");
      }

      setPlatillos(data);
    } catch (err) {
      console.error("Error fetching platillos:", err);
      setError((err as Error).message || "Error al cargar los platillos");
      setPlatillos([]);
    } finally {
      setLoadingPlatillos(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const getImagenCategoria = (id: number) => {
    return (
      CATEGORIAS_IMAGENES[id] ||
      require("../assets/images/platillos/default.jpg")
    );
  };

  const getImagenPlatillo = (imagenNombre: string | null) => {
    if (!imagenNombre) return PLATILLOS_IMAGENES["default.jpg"];

    // Extrae solo el nombre del archivo (última parte después de /)
    const nombreArchivo = imagenNombre.split("/").pop() || imagenNombre;

    return (
      PLATILLOS_IMAGENES[nombreArchivo] || PLATILLOS_IMAGENES["default.jpg"]
    );
  };

  const getImagenPlatillo2 = (imagenNombre: string | null) => {
    if (!imagenNombre) return PLATILLOS_IMAGENES["default.jpg"];

    const imagen =
      PLATILLOS_IMAGENES[imagenNombre] || PLATILLOS_IMAGENES["default.jpg"];
    console.log(
      "Imagen seleccionada:",
      imagen ? "Encontrada" : "No encontrada, usando default"
    );

    return imagen;
  };

  const handlePressCategoria = (categoria: Categoria) => {
    setCategoriaSeleccionada(categoria);
    fetchPlatillos(categoria.id);
  };

  const handleBackToCategories = () => {
    setCategoriaSeleccionada(null);
    setPlatillos([]);
  };

  const renderCategoria = ({ item }: { item: Categoria }) => (
    <TouchableOpacity
      style={styles.categoriaContainer}
      onPress={() => handlePressCategoria(item)}
      activeOpacity={0.7}
    >
      <ImageBackground
        source={getImagenCategoria(item.id)}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.gradient}
        />
        <Text style={styles.textoCategoria}>{item.nombre}</Text>
      </ImageBackground>
    </TouchableOpacity>
  );

  const renderPlatillo = ({ item }: { item: Platillo }) => (
    <View style={styles.platilloContainer}>
      <Image
        source={getImagenPlatillo(item.imagen)}
        style={styles.platilloImagen}
        resizeMode="cover"
      />
      <View style={styles.platilloInfo}>
        <Text style={styles.platilloNombre}>{item.nombre}</Text>
        <Text style={styles.platilloDescripcion}>{item.descripcion}</Text>
        <Text style={styles.platilloPrecio}>
          ${Number(item.precio).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6347" />
        <Text style={styles.loadingText}>Cargando categorías...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setError(null);
            categoriaSeleccionada
              ? fetchPlatillos(categoriaSeleccionada.id)
              : fetchCategorias();
          }}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (categoriaSeleccionada) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToCategories}
        >
          <Text style={styles.backButtonText}>← Volver a categorías</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>{categoriaSeleccionada.nombre}</Text>

        {loadingPlatillos ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff6347" />
            <Text style={styles.loadingText}>Cargando platillos...</Text>
          </View>
        ) : (
          <>
            {platillos.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No hay platillos disponibles en esta categoría
                </Text>
                <Text>ID de categoría: {categoriaSeleccionada.id}</Text>
              </View>
            ) : (
              <FlatList
                data={platillos}
                renderItem={renderPlatillo}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Nuestro Menú</Text>
      <FlatList
        data={categorias}
        renderItem={renderCategoria}
        keyExtractor={(item) => item.id.toString()}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// Estilos (se mantienen igual que en tu código original)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: ITEM_MARGIN,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#ff6347",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
    color: "#333",
  },
  gridContainer: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: ITEM_MARGIN,
  },
  categoriaContainer: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  imageBackground: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  imageStyle: {
    borderRadius: 12,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  textoCategoria: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    paddingHorizontal: 8,
  },
  backButton: {
    margin: 16,
    padding: 8,
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "#ff6347",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  platilloContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  platilloImagen: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  platilloInfo: {
    padding: 16,
  },
  platilloNombre: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  platilloDescripcion: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  platilloPrecio: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6347",
  },
});

export default Menu;
