import React, { createContext, useContext, useState, ReactNode } from "react";

interface Platillo {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string | null;
  cantidad?: number;
}

interface CarritoContextType {
  carrito: Platillo[];
  agregarAlCarrito: (platillo: Platillo) => void;
  quitarDelCarrito: (id: number) => void;
  limpiarCarrito: () => void;
}

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

export const CarritoProvider = ({ children }: { children: ReactNode }) => {
  const [carrito, setCarrito] = useState<Platillo[]>([]);

  const agregarAlCarrito = (platillo: Platillo) => {
    setCarrito((prev) => {
      const existente = prev.find((item) => item.id === platillo.id);
      if (existente) {
        return prev.map((item) =>
          item.id === platillo.id
            ? { ...item, cantidad: (item.cantidad || 1) + 1 }
            : item
        );
      } else {
        return [...prev, { ...platillo, cantidad: 1 }];
      }
    });
  };

  const quitarDelCarrito = (id: number) => {
    setCarrito((prev) => prev.filter((item) => item.id !== id));
  };

  const limpiarCarrito = () => {
    setCarrito([]);
  };

  return (
    <CarritoContext.Provider
      value={{ carrito, agregarAlCarrito, quitarDelCarrito, limpiarCarrito }}
    >
      {children}
    </CarritoContext.Provider>
  );
};

export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error("useCarrito debe usarse dentro de un CarritoProvider");
  }
  return context;
};
