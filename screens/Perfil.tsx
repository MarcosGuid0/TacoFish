import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Modal, Pressable } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";

const Perfil = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [modalVisible, setModalVisible] = useState(false);

  // Redirige a Login si el usuario no está autenticado
  useEffect(() => {
    if (!user) {
      navigation.navigate("Login");
    }
  }, [user]);

  const handleLogout = () => {
    setModalVisible(false);
    logout();
  };

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Text style={styles.title}>Perfil</Text>
          <View style={styles.profileInfo}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{user.nombre}</Text>

            <Text style={styles.label}>Teléfono:</Text>
            <Text style={styles.value}>
              {user.telefono || "No proporcionado"}
            </Text>
          </View>

          <Button
            title="Cerrar Sesión"
            onPress={() => setModalVisible(true)}
            color="#FF3B30"
          />

          {/* Modal de confirmación */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalTitle}>
                  Confirmar cierre de sesión
                </Text>
                <Text style={styles.modalText}>
                  ¿Estás seguro que deseas cerrar tu sesión?
                </Text>
                <View style={styles.modalButtons}>
                  <Pressable
                    style={[styles.button, styles.buttonCancel]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.textStyle}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.button, styles.buttonConfirm]}
                    onPress={handleLogout}
                  >
                    <Text style={styles.textStyle}>Cerrar Sesión</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </>
      ) : (
        <Text style={styles.notAuthText}>No autenticado</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  profileInfo: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
    paddingLeft: 10,
  },
  notAuthText: {
    fontSize: 18,
    color: "#FF3B30",
    textAlign: "center",
    marginTop: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2E86C1",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#34495E",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    width: "48%",
  },
  buttonCancel: {
    backgroundColor: "#D6DBDF",
  },
  buttonConfirm: {
    backgroundColor: "#FF3B30",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default Perfil;
