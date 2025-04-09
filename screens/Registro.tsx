import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Modal,
  Alert,
} from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/MaterialIcons";

// Configuración de logging
const logError = (error: any, context: string, extraData?: any) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    extraData,
  };

  console.error(`[ERROR] ${timestamp} - ${context}:`, errorInfo);
};

interface RegistroProps {
  setIsLoggedIn: (value: boolean) => void;
  setUserRole: (role: string) => void;
  navigation: NavigationProp<RootStackParamList>;
}

const API_BASE_URL = "http://10.19.100.158:3000";

const Registro: React.FC<RegistroProps> = ({
  setIsLoggedIn,
  setUserRole,
  navigation,
}) => {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [error, setError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [verificationError, setVerificationError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [maxAttempts] = useState(3); // Máximo de intentos permitidos

  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  const validateForm = () => {
    if (
      !nombre.trim() ||
      !telefono.trim() ||
      !contraseña ||
      !confirmarContraseña
    ) {
      setError("Por favor, completa todos los campos.");
      return false;
    }

    if (telefono.length !== 10) {
      setError("El número de teléfono debe tener 10 dígitos.");
      return false;
    }

    if (contraseña.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return false;
    }

    if (contraseña !== confirmarContraseña) {
      setError("Las contraseñas no coinciden.");
      return false;
    }

    return true;
  };

  const startCountdown = () => {
    if (timer) clearInterval(timer);

    setCountdown(60);
    const newTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(newTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimer(newTimer);
  };

  const resetVerificationProcess = () => {
    setVerificationCode("");
    setVerificationError("");
    setAttempts(0);
    setShowVerificationModal(false);
    if (timer) clearInterval(timer);
    setCountdown(60);
  };

  const handleRegistro = async () => {
    setError("");
    setVerificationError("");
    setAttempts(0);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/registro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          nombre,
          telefono,
          contraseña,
          confirmarContraseña,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || "Error en el registro";
        logError(new Error(errorMsg), "Registro API Error", {
          status: response.status,
          responseData: data,
        });
        throw new Error(errorMsg);
      }

      setShowVerificationModal(true);
      startCountdown();
    } catch (err: any) {
      logError(err, "handleRegistro", {
        nombre,
        telefono,
        contraseñaLength: contraseña.length,
      });
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/verificar-codigo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          telefono: `+52${telefono.replace(/\D/g, "")}`,
          codigo: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || "Código de verificación incorrecto";
        logError(new Error(errorMsg), "Verificación API Error", {
          status: response.status,
          responseData: data,
        });
        throw new Error(errorMsg);
      }

      // Verificación exitosa
      resetVerificationProcess();
      setShowSuccessModal(true);

      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      }, 3000);
    } catch (err: any) {
      logError(err, "handleVerification", {
        telefono,
        verificationCode,
        attempts: attempts + 1,
      });

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setVerificationError(err.message);

      if (newAttempts >= maxAttempts) {
        // Máximo de intentos alcanzado
        setError(
          "Demasiados intentos fallidos. Por favor, intente registrarse nuevamente."
        );
        resetVerificationProcess();
      } else {
        // Reiniciar el contador para el nuevo intento
        startCountdown();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/Varios.jpg")}
      style={styles.background}
      blurRadius={10}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Registro</Text>

          <Text style={styles.label}>Nombre:</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ingresa tu nombre"
            placeholderTextColor="#999"
            editable={!isLoading}
          />

          <Text style={styles.label}>Teléfono:</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            value={telefono}
            onChangeText={setTelefono}
            placeholder="Ingresa tu teléfono"
            placeholderTextColor="#999"
            maxLength={10}
            editable={!isLoading}
          />

          <Text style={styles.label}>Contraseña:</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={contraseña}
            onChangeText={setContraseña}
            placeholder="Ingresa tu contraseña"
            placeholderTextColor="#999"
            editable={!isLoading}
          />

          <Text style={styles.label}>Confirmar Contraseña:</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={confirmarContraseña}
            onChangeText={setConfirmarContraseña}
            placeholder="Confirma tu contraseña"
            placeholderTextColor="#999"
            editable={!isLoading}
          />

          {error ? (
            <Animatable.View animation="fadeIn" style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </Animatable.View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.disabledButton]}
            onPress={handleRegistro}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Procesando..." : "Registrarse"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            disabled={isLoading}
          >
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta? Inicia sesión
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de verificación */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showVerificationModal}
        onRequestClose={() => !isLoading && resetVerificationProcess()}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => !isLoading && resetVerificationProcess()}
              disabled={isLoading}
            >
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Verificación</Text>
            <Text style={styles.modalText}>
              Ingresa el código de verificación enviado a tu teléfono.
            </Text>

            <TextInput
              style={styles.input}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="Código de verificación"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              editable={!isLoading && countdown > 0}
            />

            <Text style={styles.countdownText}>
              {countdown > 0
                ? `Tiempo restante: ${countdown} segundos`
                : "Tiempo agotado, por favor solicita un nuevo código"}
            </Text>

            <Text style={styles.attemptsText}>
              Intentos restantes: {maxAttempts - attempts}
            </Text>

            <TouchableOpacity
              style={[
                styles.button,
                (isLoading || countdown === 0) && styles.disabledButton,
              ]}
              onPress={handleVerification}
              disabled={isLoading || countdown === 0}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Verificando..." : "Verificar"}
              </Text>
            </TouchableOpacity>

            {verificationError ? (
              <Animatable.View animation="fadeIn" style={styles.errorContainer}>
                <Text style={styles.errorText}>{verificationError}</Text>
              </Animatable.View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Modal de éxito */}
      <Modal transparent={true} visible={showSuccessModal} animationType="fade">
        <View style={styles.successModalContainer}>
          <View style={styles.successModalContent}>
            <View style={styles.successIcon}>
              <Icon name="check-circle" size={60} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>¡Registro exitoso!</Text>
            <Text style={styles.successText}>
              Redirigiendo al inicio de sesión...
            </Text>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginBottom: 50,
  },
  card: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007BFF",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#007BFF",
    marginBottom: 8,
  },
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
    backgroundColor: "#00C9A7",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkText: {
    color: "#007BFF",
    marginTop: 16,
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#FF5252",
  },
  errorText: {
    color: "#D32F2F",
    textAlign: "center",
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#007BFF",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#555",
  },
  countdownText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  attemptsText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  successModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  successModalContent: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
    position: "relative",
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 10,
  },
  successText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    opacity: 0.7,
  },
});

const RegistroWrapper = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const setIsLoggedIn = () => {};
  const setUserRole = () => {};

  return (
    <Registro
      setIsLoggedIn={setIsLoggedIn}
      setUserRole={setUserRole}
      navigation={navigation}
    />
  );
};

export default RegistroWrapper;
