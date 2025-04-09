import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";

const Login: React.FC = () => {
  const [telefono, setTelefono] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [localError, setLocalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    user,
    login,
    loading: authLoading,
    error: authError,
    clearError,
  } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (user) {
      if (user.tipo_usuario === "admin") {
        navigation.navigate("PerfilAdmin");
      } else {
        navigation.navigate("MainApp");
      }
    }
  }, [user, navigation]);

  useEffect(() => {
    // Limpiar errores al desmontar el componente
    return () => {
      clearError();
    };
  }, []);

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
  };

  const handleLogin = async () => {
    try {
      setIsSubmitting(true);
      setLocalError("");
      clearError();

      if (!telefono.trim() || !contraseña.trim()) {
        setLocalError("Por favor, completa todos los campos");
        return;
      }

      const formattedTelefono = formatPhoneNumber(telefono);
      if (formattedTelefono.length !== 10) {
        setLocalError("El teléfono debe tener 10 dígitos");
        return;
      }

      const { error } = await login(formattedTelefono, contraseña);
      if (error) {
        setLocalError(error);
      }
    } catch (error) {
      setLocalError("Ocurrió un error al iniciar sesión");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/fondoLogin3.jpg")}
      style={styles.background}
      blurRadius={10}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Iniciar Sesión</Text>

          <View style={styles.registerContainer}>
            <Text style={styles.subtitle}>¿No tienes cuenta?</Text>
            <TouchableOpacity
              onPress={() => {
                clearError();
                navigation.navigate("Registro");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.registerText}>Regístrate</Text>
            </TouchableOpacity>
          </View>

          {(localError || authError) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{localError || authError}</Text>
            </View>
          )}

          <Text style={styles.label}>Teléfono:</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            value={telefono}
            onChangeText={(text) => {
              setTelefono(text);
              setLocalError("");
              clearError();
            }}
            placeholder="10 dígitos"
            placeholderTextColor="#999"
            maxLength={10}
            editable={!isSubmitting}
          />

          <Text style={styles.label}>Contraseña:</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={contraseña}
            onChangeText={(text) => {
              setContraseña(text);
              setLocalError("");
              clearError();
            }}
            placeholder="Tu contraseña"
            placeholderTextColor="#999"
            editable={!isSubmitting}
          />

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, resizeMode: "cover", justifyContent: "center" },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  card: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 20,
    borderRadius: 15,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007BFF",
    textAlign: "center",
    marginBottom: 20,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  subtitle: { fontSize: 14, color: "#666" },
  registerText: { fontSize: 16, color: "#007BFF", fontWeight: "bold" },
  label: { fontSize: 16, color: "#007BFF", marginBottom: 8 },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#007BFF",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#fff",
    color: "#333",
  },
  button: {
    width: "100%",
    backgroundColor: "#00C9A7",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF5252",
  },
  errorText: {
    color: "#D32F2F",
    textAlign: "center",
  },
});

export default Login;
