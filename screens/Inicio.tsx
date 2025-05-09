import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Carrusel from '@/components/Carrusel';
import { NavigationProp, ParamListBase } from '@react-navigation/native';

interface Props {
  navigation: NavigationProp<ParamListBase>;
}

const { width } = Dimensions.get('window');


export default function Inicio({ navigation }: Props) {

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('@/assets/images/Fondos/Fondo_Principal.png')}
        style={[StyleSheet.absoluteFillObject, styles.backgroundImage]}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.title}>TacoFish</Text>
          <Ionicons name="notifications-outline" size={28} color="#000000" />
        </View>
        <Text style={styles.subtitle}>La mejor comida del mar de la sierra</Text>
        <View style={styles.divider} />

        {/* Platillos Destacados */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Platillos Destacados</Text>
            <TouchableOpacity>
              <Text style={styles.link}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <Carrusel/>
        </View>

        {/* Categorías */}
        <View style={styles.section}>
          <Text style={styles.categoryTitle}>Nuestras Categorías</Text>
          <View style={styles.categories}>
            <View style={styles.categoryCard}>
              <Image source={require('@/assets/images/Categorias/Categoria1.jpg')} style={styles.categoryImage} />
              <View style={styles.categoryTextContainer}>
                <Text style={styles.bold}>Tacos</Text>
                <Text>7 Platillos</Text>
              </View>
            </View>
            <View style={styles.categoryCard}>
              <Image source={require('@/assets/images/Categorias/Categoria2.jpg')} style={styles.categoryImage} />
              <View style={styles.categoryTextContainer}>
                <Text style={styles.bold}>Mariscos Calientes</Text>
                <Text>9 Platillos</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: 250,
    top: 0,
    resizeMode: 'cover',
  },
  header: {
    padding: 20,
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0084FF',
  },
  subtitle: {
    fontSize: 14,
    marginHorizontal: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#00DDFF',
    marginHorizontal: 20,
    marginTop: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  link: {
    color: '#0084FF',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  categoryCard: {
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 10,
  },
  categoryImage: {
    width: '100%',
    height: 130,
    borderRadius: 10,
  },
  categoryTextContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#F2F2F2',
    paddingVertical: 5,
    alignItems: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
});
