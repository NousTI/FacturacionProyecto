export interface Provincia {
  id: string;
  nombre: string;
}

export interface Ciudad {
  id: string;
  nombre: string;
  provinciaId: string;
}

export const PROVINCIAS: Provincia[] = [
  { id: 'AZUAY', nombre: 'Azuay' },
  { id: 'BOLIVAR', nombre: 'Bolívar' },
  { id: 'CANAR', nombre: 'Cañar' },
  { id: 'CARCHI', nombre: 'Carchi' },
  { id: 'CHIMBORAZO', nombre: 'Chimborazo' },
  { id: 'COTOPAXI', nombre: 'Cotopaxi' },
  { id: 'EL_ORO', nombre: 'El Oro' },
  { id: 'ESMERALDAS', nombre: 'Esmeraldas' },
  { id: 'GALAPAGOS', nombre: 'Galápagos' },
  { id: 'GUAYAS', nombre: 'Guayas' },
  { id: 'IMBABURA', nombre: 'Imbabura' },
  { id: 'LOJA', nombre: 'Loja' },
  { id: 'LOS_RIOS', nombre: 'Los Ríos' },
  { id: 'MANABI', nombre: 'Manabí' },
  { id: 'MORONA_SANTIAGO', nombre: 'Morona Santiago' },
  { id: 'NAPO', nombre: 'Napo' },
  { id: 'ORELLANA', nombre: 'Orellana' },
  { id: 'PASTAZA', nombre: 'Pastaza' },
  { id: 'PICHINCHA', nombre: 'Pichincha' },
  { id: 'SANTA_ELENA', nombre: 'Santa Elena' },
  { id: 'SANTO_DOMINGO', nombre: 'Santo Domingo de los Tsáchilas' },
  { id: 'SUCUMBIOS', nombre: 'Sucumbíos' },
  { id: 'TUNGURAHUA', nombre: 'Tungurahua' },
  { id: 'ZAMORA_CHINCHIPE', nombre: 'Zamora Chinchipe' }
];

export const CIUDADES: Ciudad[] = [
  // AZUAY
  { id: 'CUENCA', nombre: 'Cuenca', provinciaId: 'AZUAY' },
  { id: 'GUALACEO', nombre: 'Gualaceo', provinciaId: 'AZUAY' },
  { id: 'PAUTE', nombre: 'Paute', provinciaId: 'AZUAY' },
  { id: 'SANTA_ISABEL', nombre: 'Santa Isabel', provinciaId: 'AZUAY' },
  { id: 'CAMILO_PONCE', nombre: 'Camilo Ponce Enríquez', provinciaId: 'AZUAY' },

  // BOLIVAR
  { id: 'GUARANDA', nombre: 'Guaranda', provinciaId: 'BOLIVAR' },
  { id: 'SAN_MIGUEL_BOL', nombre: 'San Miguel', provinciaId: 'BOLIVAR' },
  { id: 'CHIMBO', nombre: 'Chimbo', provinciaId: 'BOLIVAR' },
  { id: 'ECHEANDÍA', nombre: 'Echeandía', provinciaId: 'BOLIVAR' },

  // CANAR
  { id: 'AZOGUES', nombre: 'Azogues', provinciaId: 'CANAR' },
  { id: 'CAÑAR_CIUDAD', nombre: 'Cañar', provinciaId: 'CANAR' },
  { id: 'LA_TRONCAL', nombre: 'La Troncal', provinciaId: 'CANAR' },
  { id: 'BIBLAN', nombre: 'Biblián', provinciaId: 'CANAR' },

  // CARCHI
  { id: 'TULCAN', nombre: 'Tulcán', provinciaId: 'CARCHI' },
  { id: 'SAN_GABRIEL', nombre: 'San Gabriel', provinciaId: 'CARCHI' },
  { id: 'BOLIVAR_CARCHI', nombre: 'Bolívar', provinciaId: 'CARCHI' },
  { id: 'HUACA', nombre: 'Huaca', provinciaId: 'CARCHI' },

  // CHIMBORAZO
  { id: 'RIOBAMBA', nombre: 'Riobamba', provinciaId: 'CHIMBORAZO' },
  { id: 'ALAUSÍ', nombre: 'Alausí', provinciaId: 'CHIMBORAZO' },
  { id: 'GUANO', nombre: 'Guano', provinciaId: 'CHIMBORAZO' },
  { id: 'COLTA', nombre: 'Colta', provinciaId: 'CHIMBORAZO' },
  { id: 'CUMANDÁ', nombre: 'Cumandá', provinciaId: 'CHIMBORAZO' },

  // COTOPAXI
  { id: 'LATACUNGA', nombre: 'Latacunga', provinciaId: 'COTOPAXI' },
  { id: 'PUJILÍ', nombre: 'Pujilí', provinciaId: 'COTOPAXI' },
  { id: 'SALCEDO', nombre: 'Salcedo', provinciaId: 'COTOPAXI' },
  { id: 'LA_MANA', nombre: 'La Maná', provinciaId: 'COTOPAXI' },
  { id: 'SAQUISILÍ', nombre: 'Saquisilí', provinciaId: 'COTOPAXI' },

  // ESMERALDAS
  { id: 'ESMERALDAS_CIUDAD', nombre: 'Esmeraldas', provinciaId: 'ESMERALDAS' },
  { id: 'QUININDE', nombre: 'Quinindé', provinciaId: 'ESMERALDAS' },
  { id: 'ATACAMES', nombre: 'Atacames', provinciaId: 'ESMERALDAS' },
  { id: 'SAN_LORENZO', nombre: 'San Lorenzo', provinciaId: 'ESMERALDAS' },
  { id: 'MUISNE', nombre: 'Muisne', provinciaId: 'ESMERALDAS' },

  // GALAPAGOS
  { id: 'PUERTO_BAQUERIZO', nombre: 'Puerto Baquerizo Moreno', provinciaId: 'GALAPAGOS' },
  { id: 'PUERTO_AYORA', nombre: 'Puerto Ayora', provinciaId: 'GALAPAGOS' },
  { id: 'PUERTO_VILLAMIL', nombre: 'Puerto Villamil', provinciaId: 'GALAPAGOS' },

  // GUAYAS
  { id: 'GUAYAQUIL', nombre: 'Guayaquil', provinciaId: 'GUAYAS' },
  { id: 'DURÁN', nombre: 'Durán', provinciaId: 'GUAYAS' },
  { id: 'MILAGRO', nombre: 'Milagro', provinciaId: 'GUAYAS' },
  { id: 'SAMBORONDON', nombre: 'Samborondón', provinciaId: 'GUAYAS' },
  { id: 'DAULE', nombre: 'Daule', provinciaId: 'GUAYAS' },
  { id: 'PLAYAS', nombre: 'Playas', provinciaId: 'GUAYAS' },

  // IMBABURA
  { id: 'IBARRA', nombre: 'Ibarra', provinciaId: 'IMBABURA' },
  { id: 'OTAVALO', nombre: 'Otavalo', provinciaId: 'IMBABURA' },
  { id: 'COTACACHI', nombre: 'Cotacachi', provinciaId: 'IMBABURA' },
  { id: 'ATUNTAQUI', nombre: 'Atuntaqui', provinciaId: 'IMBABURA' },

  // LOJA
  { id: 'LOJA_CIUDAD', nombre: 'Loja', provinciaId: 'LOJA' },
  { id: 'CATAMAYO', nombre: 'Catamayo', provinciaId: 'LOJA' },
  { id: 'CARIAMANGA', nombre: 'Cariamanga', provinciaId: 'LOJA' },
  { id: 'MACARÁ', nombre: 'Macará', provinciaId: 'LOJA' },
  { id: 'SARAGURO', nombre: 'Saraguro', provinciaId: 'LOJA' },

  // LOS_RIOS
  { id: 'BABAHOYO', nombre: 'Babahoyo', provinciaId: 'LOS_RIOS' },
  { id: 'QUEVEDO', nombre: 'Quevedo', provinciaId: 'LOS_RIOS' },
  { id: 'VENTANAS', nombre: 'Ventanas', provinciaId: 'LOS_RIOS' },
  { id: 'VINCES', nombre: 'Vinces', provinciaId: 'LOS_RIOS' },
  { id: 'BUENA_FE', nombre: 'Buena Fe', provinciaId: 'LOS_RIOS' },

  // MANABI
  { id: 'PORTOVIEJO', nombre: 'Portoviejo', provinciaId: 'MANABI' },
  { id: 'MANTA', nombre: 'Manta', provinciaId: 'MANABI' },
  { id: 'CHONE', nombre: 'Chone', provinciaId: 'MANABI' },
  { id: 'MONTECRISTI', nombre: 'Montecristi', provinciaId: 'MANABI' },
  { id: 'BAHIA', nombre: 'Bahía de Caráquez', provinciaId: 'MANABI' },

  // MORONA_SANTIAGO
  { id: 'MACAS', nombre: 'Macas', provinciaId: 'MORONA_SANTIAGO' },
  { id: 'GUALAQUIZA', nombre: 'Gualaquiza', provinciaId: 'MORONA_SANTIAGO' },
  { id: 'SUCUA', nombre: 'Sucúa', provinciaId: 'MORONA_SANTIAGO' },
  { id: 'LIMON_INDANZA', nombre: 'Limón Indanza', provinciaId: 'MORONA_SANTIAGO' },

  // NAPO
  { id: 'TENA', nombre: 'Tena', provinciaId: 'NAPO' },
  { id: 'ARCHIDONA', nombre: 'Archidona', provinciaId: 'NAPO' },
  { id: 'BAEZA', nombre: 'Baeza', provinciaId: 'NAPO' },
  { id: 'EL_CHACO', nombre: 'El Chaco', provinciaId: 'NAPO' },

  // ORELLANA
  { id: 'FRANCISCO_ORELLANA', nombre: 'El Coca', provinciaId: 'ORELLANA' },
  { id: 'LA_JOYA_SACHAS', nombre: 'La Joya de los Sachas', provinciaId: 'ORELLANA' },
  { id: 'LORETO', nombre: 'Loreto', provinciaId: 'ORELLANA' },
  { id: 'AGUARICO', nombre: 'Aguarico', provinciaId: 'ORELLANA' },

  // PASTAZA
  { id: 'PUYO', nombre: 'Puyo', provinciaId: 'PASTAZA' },
  { id: 'MERA', nombre: 'Mera', provinciaId: 'PASTAZA' },
  { id: 'SANTA_CLARA_PAST', nombre: 'Santa Clara', provinciaId: 'PASTAZA' },
  { id: 'PASTAZA_CIUDAD', nombre: 'Pastaza', provinciaId: 'PASTAZA' },

  // PICHINCHA
  { id: 'QUITO', nombre: 'Quito', provinciaId: 'PICHINCHA' },
  { id: 'SANGOLQUÍ', nombre: 'Sangolquí', provinciaId: 'PICHINCHA' },
  { id: 'CAYAMBE', nombre: 'Cayambe', provinciaId: 'PICHINCHA' },
  { id: 'MACHACHI', nombre: 'Machachi', provinciaId: 'PICHINCHA' },
  { id: 'PUERTO_QUITO', nombre: 'Puerto Quito', provinciaId: 'PICHINCHA' },

  // SANTA_ELENA
  { id: 'SANTA_ELENA_CIUDAD', nombre: 'Santa Elena', provinciaId: 'SANTA_ELENA' },
  { id: 'LA_LIBERTAD', nombre: 'La Libertad', provinciaId: 'SANTA_ELENA' },
  { id: 'SALINAS', nombre: 'Salinas', provinciaId: 'SANTA_ELENA' },

  // SANTO_DOMINGO
  { id: 'SANTO_DOMINGO_CIUDAD', nombre: 'Santo Domingo', provinciaId: 'SANTO_DOMINGO' },
  { id: 'LA_CONCORDIA', nombre: 'La Concordia', provinciaId: 'SANTO_DOMINGO' },

  // SUCUMBIOS
  { id: 'NUEVA_LOJA', nombre: 'Nueva Loja', provinciaId: 'SUCUMBIOS' },
  { id: 'SHUSHUFINDI', nombre: 'Shushufindi', provinciaId: 'SUCUMBIOS' },
  { id: 'LAGO_AGRIO', nombre: 'Lago Agrio', provinciaId: 'SUCUMBIOS' },
  { id: 'CASCALES', nombre: 'Cascales', provinciaId: 'SUCUMBIOS' },

  // TUNGURAHUA
  { id: 'AMBATO', nombre: 'Ambato', provinciaId: 'TUNGURAHUA' },
  { id: 'BAÑOS', nombre: 'Baños de Agua Santa', provinciaId: 'TUNGURAHUA' },
  { id: 'PELILEO', nombre: 'Pelileo', provinciaId: 'TUNGURAHUA' },
  { id: 'PILLARO', nombre: 'Píllaro', provinciaId: 'TUNGURAHUA' },

  // ZAMORA_CHINCHIPE
  { id: 'ZAMORA', nombre: 'Zamora', provinciaId: 'ZAMORA_CHINCHIPE' },
  { id: 'YANTZAZA', nombre: 'Yantzaza', provinciaId: 'ZAMORA_CHINCHIPE' },
  { id: 'EL_PANGUI', nombre: 'El Pangui', provinciaId: 'ZAMORA_CHINCHIPE' },
  { id: 'CHINCHIPE', nombre: 'Chinchipe', provinciaId: 'ZAMORA_CHINCHIPE' },

  // EL_ORO
  { id: 'MACHALA', nombre: 'Machala', provinciaId: 'EL_ORO' },
  { id: 'PASAJE', nombre: 'Pasaje', provinciaId: 'EL_ORO' },
  { id: 'SANTA_ROSA', nombre: 'Santa Rosa', provinciaId: 'EL_ORO' },
  { id: 'HUAQUILLAS', nombre: 'Huaquillas', provinciaId: 'EL_ORO' },
  { id: 'PIÑAS', nombre: 'Piñas', provinciaId: 'EL_ORO' }
];

export const getCiudadesByProvincia = (provinciaId: string): Ciudad[] => {
  return CIUDADES.filter(ciudad => ciudad.provinciaId === provinciaId);
};
