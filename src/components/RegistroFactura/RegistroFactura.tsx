//distribufact

import DistribucionFactura from "./DistribucionFactura/DistribucionFactura";


// src/components/RegistrarFactura/RegistroFactura.tsx
import React, { useEffect, useState } from "react";
import { useFacturas } from "../../Funcionalidades/RegistrarFactura";
import FacturasLista from "./FacturasLista/FacturasLista";
import type { ReFactura } from "../../Models/RegistroFacturaInterface";
import "./RegistroFactura.css";
import { useAuth } from "../../auth/authContext";
import Select from "react-select";
import { useProveedores } from "../../Funcionalidades/ProveedoresFactura";
import ProveedorModal from "./ProveedorModal/ProveedorModal";
import type { Compra } from "../../Models/Compras";
import { ComprasService } from "../../Services/Compras.service";
import { GraphRest } from "../../graph/GraphRest";
import { formatPesosEsCO, toNumberFromEsCO } from "../../utils/Number";


 // Diccionario de opciones----------------------------------------------------------------------------------------------
 export const opcionesFactura = [
    { codigo: "SC11", descripcion: "ARREND. EQ. COMPUTAC Y COMUNICACIÓN" },
    { codigo: "SC40", descripcion: "MMTO. EQ. COMPUTO Y COMU COMPRAS RC" },
    { codigo: "SC41", descripcion: "MMTO. EQ. COMPUTO Y COMU SERVICIOS RC" },
    { codigo: "SC70", descripcion: "UTILES, PAPELERIA Y FOTOCOPIAS RC" },
    { codigo: "SC80", descripcion: "SERVICIO DE TELEFONIA" },
  ];

// Diccionario de cc----------------------------------------------------------------------------------------------
 export const opcionescc = [
        {codigo: "12111", descripcion: "PRESIDENCIA" },
        { codigo: "12112", descripcion: "BROKEN CHAINS" },
        { codigo: "13111", descripcion: "PROYECTO CIR" },
        { codigo: "13112", descripcion: "PROYECTO JAA" },
        { codigo: "13113", descripcion: "PROYECTO JCA" },
        { codigo: "13114", descripcion: "PROYECTO ESR" },
        { codigo: "13115", descripcion: "PROYECTO LAV" },
        { codigo: "13116", descripcion: "PROYECTO DH" },
        { codigo: "13117", descripcion: "PROYECTO TU CUOTA" },
        { codigo: "13118", descripcion: "PROYECTO 3ACES" },
        { codigo: "13119", descripcion: "PROYECTO MOVIMIENTO VISUAL" },
        { codigo: "13120", descripcion: "PROYECTO META GRAPHICS" },
        { codigo: "13121", descripcion: "PROYECTO DH RETAIL" },
        { codigo: "14111", descripcion: "REVISORIA FISCAL" },
        { codigo: "14112", descripcion: "CONTROL INTERNO" },
        { codigo: "15111", descripcion: "FLETES" },
        { codigo: "21111", descripcion: "DIRECCION MARCAS IMPORTADAS" },
        { codigo: "22111", descripcion: "DIRECCION MARCAS NACIONALES + CSC" },
        { codigo: "23111", descripcion: "DIRECCION RETAIL + CSC" },
        { codigo: "31211", descripcion: "ABASTECIMIENTO - GERENCIA Y GENERAL" },
        { codigo: "31212", descripcion: "CALIDAD" },
        { codigo: "31221", descripcion: "LOGISTICA INTERNACIONAL" },
        { codigo: "31222", descripcion: "OPERADOR ECONOMICO AUTORIZADO (OEA)" },
        { codigo: "31231", descripcion: "PRODUCCION" },
        { codigo: "31232", descripcion: "COSTURA" },
        { codigo: "31233", descripcion: "TRAZO" },
        { codigo: "31234", descripcion: "COMPRAS" },
        { codigo: "31235", descripcion: "DISEÑO" },
        { codigo: "31236", descripcion: "TRANSPORTE" },
        { codigo: "31241", descripcion: "SERVICIOS Y SUMINISTROS" },
        { codigo: "31311", descripcion: "CEDI" },
        { codigo: "31411", descripcion: "PROCESOS Y TI - GERENCIA Y GENERAL" },
        { codigo: "31421", descripcion: "SISTEMAS DE INFORMACION - PROCESOS" },
        { codigo: "31431", descripcion: "INFRAESTRUCTURA INFORMATICA" },
        { codigo: "31511", descripcion: "GERENCIA FINANCIERA - GERENCIA Y GENERAL" },
        { codigo: "31521", descripcion: "CONTABILIDAD" },
        { codigo: "31531", descripcion: "TESORERIA" },
        { codigo: "31532", descripcion: "CARTERA" },
        { codigo: "31533", descripcion: "VENEZUELA" },
        { codigo: "31541", descripcion: "PLANEACION FINANCIERA" },
        { codigo: "31611", descripcion: "SERVICIOS ADMINISTRATIVOS" },
        { codigo: "31711", descripcion: "JURIDICA" },
        { codigo: "31712", descripcion: "CUMPLIMIENTO" },
        { codigo: "31713", descripcion: "CONTROL INTERNO" },
        { codigo: "31811", descripcion: "CAPITAL HUMANO" },
        { codigo: "31812", descripcion: "APRENDICES" },
        { codigo: "41211", descripcion: "DIESEL - GERENCIA Y GENERAL" },
        { codigo: "41212", descripcion: "DIESEL - WHOLESALE" },
        { codigo: "41213", descripcion: "DIESEL - RETAIL" },
        { codigo: "41311", descripcion: "CELIO - GERENCIA Y GENERAL" },
        { codigo: "41312", descripcion: "CELIO - WHOLESALE" },
        { codigo: "41313", descripcion: "CELIO - RETAIL" },
        { codigo: "41411", descripcion: "KIPLING - GERENCIA Y GENERAL" },
        { codigo: "41412", descripcion: "KIPLING - WHOLESALE" },
        { codigo: "41413", descripcion: "KIPLING - RETAIL" },
        { codigo: "41511", descripcion: "SUPERDRY - GERENCIA Y GENERAL" },
        { codigo: "41512", descripcion: "SUPERDRY - WHOLESALE" },
        { codigo: "41513", descripcion: "SUPERDRY - RETAIL" },
        { codigo: "41611", descripcion: "FOSSIL - GERENCIA Y GENERAL" },
        { codigo: "41612", descripcion: "FOSSIL - WHOLESALE" },
        { codigo: "41613", descripcion: "FOSSIL - RETAIL" },
        { codigo: "42111", descripcion: "GENERAL MARCAS NACIONALES" },
        { codigo: "42211", descripcion: "MFG - GERENCIA Y GENERAL" },
        { codigo: "42212", descripcion: "MFG - WHOLESALE" },
        { codigo: "42213", descripcion: "MFG - RETAIL" },
        { codigo: "42311", descripcion: "NEW PROJECT - GERENCIA Y GENERAL" },
        { codigo: "42312", descripcion: "NEW PROJECT - WHOLESALE" },
        { codigo: "42313", descripcion: "NEW PROJECT - RETAIL" },
        { codigo: "42411", descripcion: "REPLAY - GERENCIA Y GENERAL" },
        { codigo: "42412", descripcion: "REPLAY - WHOLESALE" },
        { codigo: "42413", descripcion: "REPLAY - RETAIL" },
        { codigo: "42511", descripcion: "PILATOS - GERENCIA Y GENERAL" },
        { codigo: "42512", descripcion: "PILATOS - WHOLESALE" },
        { codigo: "42513", descripcion: "PILATOS - RETAIL" },
        { codigo: "42514", descripcion: "SMART SALE" },
        { codigo: "42515", descripcion: "PILATOS - MARCA WHOLESALE" },
        { codigo: "42611", descripcion: "NEW BALANCE - GERENCIA Y GENERAL" },
        { codigo: "42612", descripcion: "NEW BALANCE - WHOLESALE" },
        { codigo: "42613", descripcion: "NEW BALANCE - RETAIL" },
        { codigo: "42711", descripcion: "OTRAS MARCAS - GERENCIA Y GENERAL" },
        { codigo: "42712", descripcion: "OTRAS MARCAS - WHOLESALE" },
        { codigo: "42713", descripcion: "OTRAS MARCAS - RETAIL" },
        { codigo: "42811", descripcion: "ASES COMERCIALES WHOLESALE" },
        { codigo: "42911", descripcion: "PILATOS - GERENCIA Y GENERAL" },
        { codigo: "42913", descripcion: "PILATOS - MARCA" },
        { codigo: "43011", descripcion: "CHOPPER ONLINE" },
        { codigo: "44011", descripcion: "BROKEN CHAINS" },
        { codigo: "51112", descripcion: "PRODUCTO" },
        { codigo: "51113", descripcion: "OPERACIONES" },
        { codigo: "51114", descripcion: "MERCADEO" },
        { codigo: "51115", descripcion: "VISUAL MERCHANDISING" },
        { codigo: "51116", descripcion: "E-COMMERCE" },
        { codigo: "51117", descripcion: "COMPRAS Y PLANEACION DE DEMANDA" },
        { codigo: "51118", descripcion: "INTELIGENCIA COMERCIAL" },
        { codigo: "51119", descripcion: "NOVEDADES ONLINE" },
        { codigo: "51120", descripcion: "FRANCQUES" },
        { codigo: "51121", descripcion: "COSTA RICA" },
        { codigo: "51122", descripcion: "FRANCQUES EDM" },
        { codigo: "51123", descripcion: "BODEGAJE ZONA FRANCA" },
  ];

   // Diccionario de co----------------------------------------------------------------------------------------------
 export const opcionesco = [
    { codigo: "017", descripcion: "3 ACES DE MODA" },
    { codigo: "062", descripcion: "ALMACENES CERRADOS" },
    { codigo: "BC2", descripcion: "BROKEN CHAINS BOGOTA" },
    { codigo: "BC3", descripcion: "BROKEN CHAINS CALI" },
    { codigo: "BC1", descripcion: "BROKEN CHAINS MEDELLIN" },
    { codigo: "BC5", descripcion: "BROKEN CHAINS ONLINE" },
    { codigo: "BC4", descripcion: "BROKEN CHAINS PEREIRA" },
    { codigo: "516", descripcion: "CELIO ARKADIA MEDELLIN" },
    { codigo: "321", descripcion: "CELIO OUTLET PLAZA AMERICAS BOGOTA" },
    { codigo: "CH1", descripcion: "CHOPPER ONLINE" },
    { codigo: "406", descripcion: "DIESEL ANDINO BOGOTA" },
    { codigo: "415", descripcion: "DIESEL ARBOLEDA PEREIRA" },
    { codigo: "402", descripcion: "DIESEL BUENAVISTA BARRANQUILLA" },
    { codigo: "488", descripcion: "DIESEL CENTRO COMERCIAL EL EDÉN" },
    { codigo: "409", descripcion: "DIESEL CHIPICHAPE CALI" },
    { codigo: "430", descripcion: "DIESEL DE MODA PRIME OUTLET LC 109 MEDEL" },
    { codigo: "407", descripcion: "DIESEL EL RETIRO BOGOTA" },
    { codigo: "411", descripcion: "DIESEL EL TESORO MEDELLIN" },
    { codigo: "421", descripcion: "DIESEL FONTANAR CHIA" },
    { codigo: "405", descripcion: "DIESEL GRAN ESTACION BOGOTA" },
    { codigo: "416", descripcion: "DIESEL JARDIN PLAZA CALI" },
    { codigo: "429", descripcion: "DIESEL LA QUINTA BUCARAMANGA" },
    { codigo: "426", descripcion: "DIESEL MULTIPLAZA LA FELICIDAD BOGOTA" },
    { codigo: "208", descripcion: "DIESEL ONLINE" },
    { codigo: "481", descripcion: "DIESEL OUTLET AMERICAS FACTORY BOGOTA" },
    { codigo: "422", descripcion: "DIESEL OUTLET MAYORCA SABANETA" },
    { codigo: "413", descripcion: "DIESEL OVIEDO MEDELLIN" },
    { codigo: "423", descripcion: "DIESEL PARQUE LA COLINA BOGOTA" },
    { codigo: "412", descripcion: "DIESEL SANDIEGO MEDELLIN" },
    { codigo: "425", descripcion: "DIESEL SANTA LUCIA NEIVA" },
    { codigo: "419", descripcion: "DIESEL SANTAFE BOGOTA" },
    { codigo: "414", descripcion: "DIESEL SANTAFE MEDELLIN" },
    { codigo: "483", descripcion: "DIESEL TITAN PLAZA BOGOTA" },
    { codigo: "410", descripcion: "DIESEL UNICENTRO CALI" },
    { codigo: "424", descripcion: "DIESEL VIVA BARRANQUILLA" },
    { codigo: "001", descripcion: "FABRICA" },
    { codigo: "056", descripcion: "GENERALES CELIO" },
    { codigo: "059", descripcion: "GENERALES CUSTO" },
    { codigo: "061", descripcion: "GENERALES DE TIENDAS" },
    { codigo: "057", descripcion: "GENERALES DIESEL" },
    { codigo: "060", descripcion: "GENERALES FRANQUICIAS" },
    { codigo: "054", descripcion: "GENERALES KIPLING" },
    { codigo: "058", descripcion: "GENERALES MFG" },
    { codigo: "053", descripcion: "GENERALES NEW PROJECT" },
    { codigo: "051", descripcion: "GENERALES PILATOS" },
    { codigo: "052", descripcion: "GENERALES PILATOS OULET" },
    { codigo: "063", descripcion: "GENERALES REPLAY" },
    { codigo: "055", descripcion: "GENERALES SUPERDRY" },
    { codigo: "669", descripcion: "KIPLING CENTRO COMERCIAL EL EDÉN" },
    { codigo: "666", descripcion: "KIPLING DE MODA PRIME OUTLET LC 152" },
    { codigo: "655", descripcion: "KIPLING EL TESORO MEDELLIN" },
    { codigo: "664", descripcion: "KIPLING LA QUINTA BUCARAMANGA" },
    { codigo: "203", descripcion: "KIPLING ONLINE" },
    { codigo: "668", descripcion: "KIPLING SANTAFE MEDELLIN" },
    { codigo: "658", descripcion: "KIPLING TITAN PLAZA BOGOTA" },
    { codigo: "215", descripcion: "MARKETPLACE ÉXITO" },
    { codigo: "206", descripcion: "MARKETPLACE ONLINE" },
    { codigo: "217", descripcion: "MARKETPLACE UNICO" },
    { codigo: "M08", descripcion: "MFG BUENAVISTA BARRANQUILLA" },
    { codigo: "742", descripcion: "MFG CACIQUE" },
    { codigo: "743", descripcion: "MFG CACIQUE" },
    { codigo: "M03", descripcion: "MFG CARACOLI BUCARAMANGA" },
    { codigo: "M12", descripcion: "MFG CENTRO COMERCIAL EL EDÉN" },
    { codigo: "M09", descripcion: "MFG CHIPICHAPE CALI" },
    { codigo: "M11", descripcion: "MFG FLORIDA PARQUE COMERCIAL" },
    { codigo: "739", descripcion: "MFG FUNDADORES MANIZALES" },
    { codigo: "M13", descripcion: "MFG FUNDADORES MANIZALES" },
    { codigo: "741", descripcion: "MFG IPIALES" },
    { codigo: "M05", descripcion: "MFG MULTIPLAZA LA FELICIDAD BOGOTA" },
    { codigo: "M01", descripcion: "MFG NUEVA 1" },
    { codigo: "M14", descripcion: "MFG NUEVO 2" },
    { codigo: "204", descripcion: "MFG ONLINE" },
    { codigo: "M02", descripcion: "MFG OVIEDO MEDELLIN" },
    { codigo: "M07", descripcion: "MFG PLAZA FABRICATO BELLO" },
    { codigo: "M10", descripcion: "MFG SAN NICOLAS RIONEGRO" },
    { codigo: "M06", descripcion: "MFG VIVA BARRANQUILLA" },
    { codigo: "207", descripcion: "MOVIL EVENTO" },
    { codigo: "197", descripcion: "MOVIL EVENTO 1" },
    { codigo: "198", descripcion: "MOVIL EVENTO 2" },
    { codigo: "200", descripcion: "MOVIL EVENTO 3" },
    { codigo: "201", descripcion: "MOVIL EVENTO 4" },
    { codigo: "218", descripcion: "NEW BALANCE ARBOLEDA" },
    { codigo: "214", descripcion: "NEW BALANCE BUENAVISTA BARRANQUILLA" },
    { codigo: "212", descripcion: "NEW BALANCE CARACOLI BUCARAMANGA" },
    { codigo: "226", descripcion: "NEW BALANCE CENTRO COMERCIAL EL EDÉN" },
    { codigo: "213", descripcion: "NEW BALANCE DE MODA PRIME OUTLET LC 121" },
    { codigo: "210", descripcion: "NEW BALANCE EL TESORO MEDELLIN" },
    { codigo: "225", descripcion: "NEW BALANCE FLORIDA PARQUE COMERCIAL" },
    { codigo: "222", descripcion: "NEW BALANCE MALL PLAZA CARTAGENA" },
    { codigo: "223", descripcion: "NEW BALANCE MALL PLAZA MANIZALES" },
    { codigo: "211", descripcion: "NEW BALANCE MAYORCA SABANETA" },
    { codigo: "221", descripcion: "NEW BALANCE NQS MALLPLAZA BOGOTA" },
    { codigo: "224", descripcion: "NEW BALANCE PLAZA FABRICATO BELLO" },
    { codigo: "219", descripcion: "NEW BALANCE VIVA ENVIGADO" },
    { codigo: "205", descripcion: "NEWPROJECT ONLINE" },
    { codigo: "744", descripcion: "PILATOS LETICIA AMAZONAS" },
    { codigo: "P09", descripcion: "PILATOS (EVACUACIÓN VENTA DE BODEGA) BOG" },
    { codigo: "177", descripcion: "PILATOS ACCESORIOS CALLE 6 POPAYAN" },
    { codigo: "155", descripcion: "PILATOS ACCESORIOS EL TESORO MEDELLIN" },
    { codigo: "P07", descripcion: "PILATOS ACCESORIOS MALL PLAZA CARTAGENA" },
    { codigo: "738", descripcion: "PILATOS ACCESORIOS MALL PLAZA MANIZALES" },
    { codigo: "P04", descripcion: "PILATOS ACCESORIOS PARQUE LA COLINA BOGO" },
    { codigo: "129", descripcion: "PILATOS ACCESORIOS PUERTA DEL NORTE BELL" },
    { codigo: "17P", descripcion: "PILATOS ACCESORIOS SAN NICOLAS RIONEGRO" },
    { codigo: "721", descripcion: "PILATOS ACCESORIOS SAN SILVIESTRE" },
    { codigo: "151", descripcion: "PILATOS ACCESORIOS VIVA ENVIGADO" },
    { codigo: "713", descripcion: "PILATOS ARAUCA" },
    { codigo: "116", descripcion: "PILATOS ARBOLEDA PEREIRA" },
    { codigo: "148", descripcion: "PILATOS ARKADIA LC 175 MEDELLIN" },
    { codigo: "122", descripcion: "PILATOS ARRECIFE SANTA MARTA" },
    { codigo: "P03", descripcion: "PILATOS BARRANQUILLA" },
    { codigo: "101", descripcion: "PILATOS BUENAVISTA BARRANQUILLA" },
    { codigo: "141", descripcion: "PILATOS BUENAVISTA MONTERIA" },
    { codigo: "104", descripcion: "PILATOS BUENAVISTA SANTA MARTA" },
    { codigo: "726", descripcion: "PILATOS CABLE PLAZA MANIZALES" },
    { codigo: "188", descripcion: "PILATOS CACIQUE BUCARAMANGA" },
    { codigo: "166", descripcion: "PILATOS CAMPANARIO POPAYAN" },
    { codigo: "143", descripcion: "PILATOS CARACOLI BUCARAMANGA" },
    { codigo: "119", descripcion: "PILATOS CARIBE PLAZA CARTAGENA" },
    { codigo: "732", descripcion: "PILATOS CC PLAZA BARCELONA SOGAMOSO" },
    { codigo: "P11", descripcion: "PILATOS CENCO LIMONAR CALI" },
    { codigo: "P08", descripcion: "PILATOS CENTRO COMERCIAL EL EDÉN" },
    { codigo: "112", descripcion: "PILATOS CHIPICHAPE CALI" },
    { codigo: "145", descripcion: "PILATOS DE MODA PRIME OUTLET LC 108" },
    { codigo: "729", descripcion: "PILATOS DORADA" },
    { codigo: "113", descripcion: "PILATOS EL TESORO MEDELLIN" },
    { codigo: "P06", descripcion: "PILATOS FLORIDA PARQUE COMERCIAL" },
    { codigo: "727", descripcion: "PILATOS FUNDADORES MANIZALES" },
    { codigo: "734", descripcion: "PILATOS FUSAGASUGA" },
    { codigo: "03P", descripcion: "PILATOS GRAN ESTACION 2 BOGOTA" },
    { codigo: "108", descripcion: "PILATOS GRAN ESTACION BOGOTA" },
    { codigo: "04P", descripcion: "PILATOS GRAN PLAZA DEL SOL BQUILL" },
    { codigo: "182", descripcion: "PILATOS GRAN PLAZA FLORENCIA" },
    { codigo: "131", descripcion: "PILATOS GRAN PLAZA IPIALES" },
    { codigo: "183", descripcion: "PILATOS IPIALES" },
    { codigo: "110", descripcion: "PILATOS JARDIN PLAZA CALI" },
    { codigo: "P05", descripcion: "PILATOS JEANS ANDINO BOGOTA" },
    { codigo: "163", descripcion: "PILATOS LA ESTACION IBAGUE" },
    { codigo: "737", descripcion: "PILATOS LA ESTACION IBAGUE" },
    { codigo: "19P", descripcion: "PILATOS LA HERRADURA TULUA" },
    { codigo: "731", descripcion: "PILATOS LA HERRADURA TULUA" },
    { codigo: "161", descripcion: "PILATOS LLANOGRANDE PALMIRA" },
    { codigo: "107", descripcion: "PILATOS MALL PLAZA CARTAGENA" },
    { codigo: "192", descripcion: "PILATOS MALL PLAZA MANIZALES" },
    { codigo: "147", descripcion: "PILATOS MAYORCA SABANETA" },
    { codigo: "142", descripcion: "PILATOS MEGAMALL BUCARAMANGA" },
    { codigo: "P01", descripcion: "PILATOS MOCOA" },
    { codigo: "162", descripcion: "PILATOS MULTICENTRO IBAGUE" },
    { codigo: "724", descripcion: "PILATOS MULTICENTRO IBAGUE" },
    { codigo: "736", descripcion: "PILATOS MULTICENTRO IBAGUE" },
    { codigo: "P10", descripcion: "PILATOS MULTICENTRO IBAGUE" },
    { codigo: "135", descripcion: "PILATOS MULTIPLAZA LA FELICIDAD BOGOTA" },
    { codigo: "05P", descripcion: "PILATOS NIZA BOGOTA" },
    { codigo: "13P", descripcion: "PILATOS NQS MALL PLAZA BOGOTA" },
    { codigo: "P15", descripcion: "PILATOS NUESTRO ATLANTICO" },
    { codigo: "149", descripcion: "PILATOS NUESTRO BOGOTA" },
    { codigo: "P14", descripcion: "PILATOS NUESTRO MONTERIA" },
    { codigo: "199", descripcion: "PILATOS ONLINE" },
    { codigo: "335", descripcion: "PILATOS OUTLET AMERICAS 2 BOGOTA" },
    { codigo: "314", descripcion: "PILATOS OUTLET CALIMA BOGOTA" },
    { codigo: "334", descripcion: "PILATOS OUTLET CHAPINERO" },
    { codigo: "319", descripcion: "PILATOS OUTLET LA TORRE ITAGUI" },
    { codigo: "336", descripcion: "PILATOS OUTLET NUEVO 2" },
    { codigo: "150", descripcion: "PILATOS PASEO VILLA DEL RIO BOGOTA" },
    { codigo: "720", descripcion: "PILATOS PASTO" },
    { codigo: "302", descripcion: "PILATOS PLAZA CENTRAL BOGOTA" },
    { codigo: "153", descripcion: "PILATOS PLAZA FABRICATO BELLO" },
    { codigo: "102", descripcion: "PILATOS PORTAL DEL QUINDIO ARMENIA" },
    { codigo: "07P", descripcion: "PILATOS PREMIUM SOPO" },
    { codigo: "746", descripcion: "PILATOS PRIMERAVERA URBANA VILLAVICENCIO" },
    { codigo: "P02", descripcion: "PILATOS PUERTO ASIS" },
    { codigo: "190", descripcion: "PILATOS QUIBDO" },
    { codigo: "717", descripcion: "PILATOS SALITRE BOGOTA" },
    { codigo: "14P", descripcion: "PILATOS SAN NICOLAS RIONEGRO" },
    { codigo: "180", descripcion: "PILATOS SAN SILVESTRE BARRANCABERMEJA" },
    { codigo: "194", descripcion: "PILATOS SAN SILVESTRE BARRANCABERMEJA" },
    { codigo: "725", descripcion: "PILATOS SANTA ROSA" },
    { codigo: "730", descripcion: "PILATOS SANTA ROSA" },
    { codigo: "132", descripcion: "PILATOS SANTAFE MEDELLIN" },
    { codigo: "121", descripcion: "PILATOS TITAN PLAZA BOGOTA" },
    { codigo: "123", descripcion: "PILATOS UNICENTRO ARMENIA" },
    { codigo: "111", descripcion: "PILATOS UNICENTRO CALI" },
    { codigo: "15P", descripcion: "PILATOS UNICENTRO MEDELLIN" },
    { codigo: "317", descripcion: "PILATOS UNICENTRO PEREIRA" },
    { codigo: "193", descripcion: "PILATOS UNICENTRO TUNJA" },
    { codigo: "170", descripcion: "PILATOS UNICENTRO VILLAVICENCIO" },
    { codigo: "172", descripcion: "PILATOS UNICENTRO YOPAL" },
    { codigo: "08P", descripcion: "PILATOS UNICO BARRANQUILLA" },
    { codigo: "18P", descripcion: "PILATOS UNICO BUCARAMANGA" },
    { codigo: "09P", descripcion: "PILATOS UNICO CALI" },
    { codigo: "P13", descripcion: "PILATOS UNICO CALI 2" },
    { codigo: "10P", descripcion: "PILATOS UNICO PASTO" },
    { codigo: "11P", descripcion: "PILATOS UNICO PEREIRA" },
    { codigo: "12P", descripcion: "PILATOS UNICO VILLAVICENCIO" },
    { codigo: "P12", descripcion: "PILATOS VERGEL PLAZA IBAGUE" },
    { codigo: "138", descripcion: "PILATOS VIVA BARRANQUILLA" },
    { codigo: "146", descripcion: "PILATOS VIVA LC 143 ENVIGADO" },
    { codigo: "745", descripcion: "PILATOS VIVA TUNJA" },
    { codigo: "139", descripcion: "PILATOS VIVA VILLAVICENCIO" },
    { codigo: "187", descripcion: "PLAY TIENDAS DE ROPA 2" },
    { codigo: "202", descripcion: "REPLAY ONLINE" },
    { codigo: "810", descripcion: "SMART SALE" },
    { codigo: "619", descripcion: "SUPERDRY ARBOLEDA PEREIRA" },
    { codigo: "613", descripcion: "SUPERDRY ARKADIA LC 255 MEDELLIN" },
    { codigo: "196", descripcion: "SUPERDRY BIMA BOGOTA" },
    { codigo: "718", descripcion: "SUPERDRY CAMPANARIO POPAYAN" },
    { codigo: "623", descripcion: "SUPERDRY CARACOLI BUCARAMANGA" },
    { codigo: "626", descripcion: "SUPERDRY CENTRO COMERCIAL EL EDÉN" },
    { codigo: "607", descripcion: "SUPERDRY DE MODA PRIME OUTLET LC 110" },
    { codigo: "618", descripcion: "SUPERDRY EL RETIRO BOGOTA" },
    { codigo: "602", descripcion: "SUPERDRY EL TESORO MEDELLIN" },
    { codigo: "625", descripcion: "SUPERDRY FLORIDA PARQUE COMERCIAL" },
    { codigo: "617", descripcion: "SUPERDRY GRAN ESTACION BOGOTA" },
    { codigo: "712", descripcion: "SUPERDRY IPIALES" },
    { codigo: "714", descripcion: "SUPERDRY LA ESTACION IBAGUE" },
    { codigo: "605", descripcion: "SUPERDRY MAYORCA SABANETA" },
    { codigo: "624", descripcion: "SUPERDRY NQS MALL PLAZA BOGOTA" },
    { codigo: "615", descripcion: "SUPERDRY NUESTRO BOGOTA" },
    { codigo: "S02", descripcion: "SUPERDRY NUEVA 1" },
    { codigo: "S03", descripcion: "SUPERDRY NUEVA 2" },
    { codigo: "209", descripcion: "SUPERDRY ONLINE" },
    { codigo: "606", descripcion: "SUPERDRY OVIEDO MEDELLIN" },
    { codigo: "616", descripcion: "SUPERDRY PASEO VILLA DEL RIO BOGOTA" },
    { codigo: "728", descripcion: "SUPERDRY PASTO" },
    { codigo: "S01", descripcion: "SUPERDRY PASTO" },
    { codigo: "614", descripcion: "SUPERDRY PLAZA CENTRAL BOGOTA" },
    { codigo: "622", descripcion: "SUPERDRY PLAZA FABRICATO BELLO" },
    { codigo: "630", descripcion: "SUPERDRY SAN NICOLAS RIONEGRO" },
    { codigo: "611", descripcion: "SUPERDRY SANTAFE LC 240 BOGOTA" },
    { codigo: "601", descripcion: "SUPERDRY TITAN PLAZA BOGOTA" },
    { codigo: "716", descripcion: "SUPERDRY VENTURA CUCUTA" },
    { codigo: "609", descripcion: "SUPERDRY VIVA LC 142 ENVIGADO" },
  ];

 // Diccionario de un----------------------------------------------------------------------------------------------
 export const opcionesun = [
{ codigo: "101", descripcion: "RETAIL LINEA CORNER" },
{ codigo: "102", descripcion: "RETAIL LINEA MONOMARCA" },
{ codigo: "201", descripcion: "RETAIL OUTLET MONOMARCA" },
{ codigo: "202", descripcion: "RETAIL OUTLET CORNER" },
{ codigo: "302", descripcion: "FRANQUICIAS" },
{ codigo: "301", descripcion: "SOCIOS COMERCIALES FIRME" },
{ codigo: "401", descripcion: "TIENDAS POR DEPARTAMENTO" },
{ codigo: "602", descripcion: "GASTOS ADMINISTRATIVOS Y VENTAS" },
{ codigo: "501", descripcion: "EXPORTACIONES" },
{ codigo: "601", descripcion: "GENERAL" },
{ codigo: "303", descripcion: "RETAIL ONLINE CORNER" },
{ codigo: "305", descripcion: "SOCIOS COMERCIALES VMI" },
{ codigo: "306", descripcion: "SOCIOS COMERCIALES OUTLET" },
{ codigo: "304", descripcion: "RETAIL ONLINE MONOMARCA" },
{ codigo: "307", descripcion: "MARKETPLACE ONLINE" },
{ codigo: "603", descripcion: "SMART SALE" },
{ codigo: "604", descripcion: "FRANCQUES" },
{ codigo: "308", descripcion: "RETAIL ONLINE OUTLET" },
{ codigo: "309", descripcion: "BROKEN CHAINS" },
  ];

export default function RegistroFactura() {
  const { getToken } = useAuth();
  const [compras, setCompras] = useState<Compra[]>([]);

  const [mostrarFechas, setMostrarFechas] = useState(false);
  const [initialDate, setInitialDate] = useState("");
  const [finalDate, setFinalDate] = useState("");

  const [selectedCompra, setSelectedCompra] = useState<string>("");
  const { proveedores, loading, error, agregarProveedor  } = useProveedores();
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const graph = new GraphRest(getToken);
  const comprasService = new ComprasService(graph);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [mostrarDistribucion, setMostrarDistribucion] = useState(false);
  const {account} = useAuth()

  //conector
  


  const [formData, setFormData] = useState<ReFactura>({
    FechaEmision: "",
    NoFactura: "",
    Proveedor: "",
    Title: "",
    Items: "",
    DescripItems: "",
    ValorAnIVA: 0,
    CC: "",
    CO: "",
    un: "",
    DetalleFac: "",
    FecEntregaCont: null,
    DocERP: "",
    Observaciones: "",
    RegistradoPor: account?.name ?? "",
  });
  const [displayValor, setDisplayValor] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCompras = async () => {
      try {
        // 🎯 Filtramos solo las compras con estado permitido
        const filtro = [
          "Pendiente por registro de inventario",
          "Pendiente por entrega al usuario",
          "Pendiente por registro de factura"
        ]
          .map(e => `fields/Estado eq '${e}'`)
          .join(" or ");

        const { items } = await comprasService.getAll({
          filter: filtro,
          orderby: "fields/FechaSolicitud desc", // opcional
          top: 100,
        });

        setCompras(items);
      } catch (error) {
        console.error("Error cargando compras filtradas:", error);
      }
    };
    fetchCompras();
  }, []);
  const { registrarFactura, handleConector } = useFacturas();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "Items") {
      const seleccion = opcionesFactura.find((o) => o.codigo === value);
      setFormData((prev) => ({
        ...prev,
        Items: value,
        DescripItems: seleccion ? seleccion.descripcion : "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "ValorAnIVA" ? toNumberFromEsCO(value) : value,
      }));
    }
  };
  const handleCompraSeleccionada = async (id: string) => {
    // ✅ Actualizamos el estado local de la compra seleccionada
    setSelectedCompra(id);

    // 🚫 Si el usuario deselecciona (elige la opción vacía), limpiamos los campos relacionados
    if (!id) {
      setFormData((prev) => ({
        ...prev,
        CC: "",            // Centro de Costos
        CO: "",            // Centro Operativo
        un: "",            // Unidad de Negocio
        DetalleFac: "",    // Detalle de la factura
        Items: "",         // Código de ítem
        DescripItems: "",  // Descripción del ítem
      }));
      return;
    }

    try {
      // 📦 Cargar los datos completos de la compra seleccionada
      const compra = await comprasService.get(id);

      // 🧩 Mapeo de campos comunes entre la compra y el formulario
      setFormData((prev) => ({
        ...prev,
        Items: compra.CodigoItem || "",       // Código del ítem
        DescripItems: compra.DescItem || "",  // Descripción del ítem
        CC: compra.CCosto || "",              // Centro de Costos
        CO: compra.CO || "",                  // Centro Operativo
        un: compra.UN || "",                  // Unidad de Negocio
        DetalleFac: compra.Dispositivo || "", // Detalle / Dispositivo relacionado
      }));
    } catch (error) {
      console.error("❌ Error al cargar la compra seleccionada:", error);
    }
  };

  const handleProveedorSeleccionado = (id: string) => {
    setProveedorSeleccionado(id);

    // Si no hay proveedor seleccionado, limpiar campos
    if (!id) {
      setFormData(prev => ({
        ...prev,
        Proveedor: "", // ← campo del input en el formulario
        Title: "",     // ← campo del input del NIT
      }));
      return;
    }

    // Buscar el proveedor por Id en la lista del hook
    const prov = proveedores.find(p => String(p.Id) === String(id));

    if (prov) {
      setFormData(prev => ({
        ...prev,
        Proveedor: prov.Nombre ?? "", // ← Nombre del proveedor  aca ya se guardan, pero el input de proveedor se quita para no ser redundantes
        Title: prov.Title ?? "",      // ← NIT del proveedor     este si lo trae y lo llena automaticamwnte
      }));
    } else {
      console.warn("Proveedor seleccionado no encontrado en lista:", id);
    }
  };

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!formData.Proveedor)      e.Proveedor  = "Proveedor Requerido.";
    if (!formData.FechaEmision)   e.FechaEmision = "Seleccione fecha de emision.";
    if (!formData.Items)          e.Items              = "Seleccione item.";
    if (!formData.ValorAnIVA)     e.ValorAnIVA          = "Requerida.";
    if (!formData.ValorAnIVA)     e.ValorAnIVA          = "Requerida.";
    if (!formData.DetalleFac)     e.DetalleFact          = "Requerida.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!(validate())) return
    
    await registrarFactura(formData);

    alert("✅ Factura registrada con éxito");

    // Limpiar campos
    setFormData({
      FechaEmision: "",
      NoFactura: "",
      Proveedor: "",
      Title: "",
      Items: "",
      DescripItems: "",
      ValorAnIVA: 0,
      CC: "",
      CO: "",
      un: "",
      DetalleFac: "",
      FecEntregaCont: null,
      DocERP: "",
      Observaciones: "",
      RegistradoPor: account?.name ?? "",
    });
  };

return (
  <div className="registro-container">
    {/* ✅ Si se pide mostrar el formulario de Distribución, lo mostramos */}
    {mostrarDistribucion ? (
     <>
      <button
        type="button"
        className="btn-volver"
        onClick={() => setMostrarDistribucion(false)}
      >
        🔙 Volver al registro de factura
      </button>

      {/* 🔹 Bloque para el conector con selectores de fecha */}
      {!mostrarFechas ? (
        <button
          type="button"
          className="btn-volver"
          onClick={() => setMostrarFechas(true)}
        >
          📅 Prueba conector
        </button>
      ) : (
        <div className="selector-fechas-container">
          <label className="selector-label">
            Fecha inicial:
            <input
              type="date"
              value={initialDate}
              onChange={(e) => setInitialDate(e.target.value)}
            />
          </label>

          <label className="selector-label">
            Fecha final:
            <input
              type="date"
              value={finalDate}
              onChange={(e) => setFinalDate(e.target.value)}
            />
          </label>

          <div className="selector-botones">
            <button
              type="button"
              className="btn-volver"
              onClick={async () => {
                if (!initialDate || !finalDate) {
                  alert("⚠️ Debes seleccionar ambas fechas.");
                  return;
                }
                await handleConector(initialDate, finalDate);
                setMostrarFechas(false);
                setInitialDate("");
                setFinalDate("");
              }}
            >
              ✅ Ejecutar conector
            </button>

            <button
              type="button"
              className="btn-cancelar"
              onClick={() => {
                setMostrarFechas(false);
                setInitialDate("");
                setFinalDate("");
              }}
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      )}

        <DistribucionFactura />
      </>
    ) : (
      <>
        <h2>{mostrarLista ? "📄 Facturas Registradas" : "Registro de Facturas"}</h2>

        {!mostrarLista ? (
          <form className="registro-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* relacionamiento con compras  */}
              <div className="form-group mb-3">
                <label htmlFor="compraSelect">Seleccionar compra relacionada:</label>
                <select
                  id="compraSelect"
                  className="form-control"
                  value={selectedCompra}
                  onChange={(e) => handleCompraSeleccionada(e.target.value)}
                >
                  <option value="">-- Seleccione una compra --</option>
                  {compras.map((c) => (
                    <option key={c.Id} value={c.Id}>
                      {c.Title} - {c.SolicitadoPor} - {c.Estado}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🔹 Desplegable de proveedores */}
              <div className="form-group mb-3">
                <div>
                  <label htmlFor="proveedor-select">Proveedor:</label>
                  {loading ? (
                    <span>Cargando...</span>
                  ) : error ? (
                    <span style={{ color: "red" }}>{error}</span>
                  ) : (
                    <select
                      id="proveedor-select"
                      value={proveedorSeleccionado}
                      onChange={(e) => handleProveedorSeleccionado(e.target.value)}
                    >
                      <option value="">-- Selecciona un proveedor --</option>
                      {proveedores.map((p) => (
                        <option key={p.Id} value={p.Id}>
                          {p.Nombre}
                        </option>
                      ))}
                    </select>
                  )}
                  <small className="error">{errors.Proveedor}</small>
                </div>

                {/* 🔹 Botón para abrir modal (se implementará más adelante) */}
                <button
                  type="button"
                  className="btn-nuevo-proveedor"
                  onClick={() => setIsModalOpen(true)}
                >
                  + Nuevo proveedor
                </button>
              </div>

              {/* 📆 Fecha de emisión */}
              <div className="campo">
                <label>
                  Fecha de emisión
                  <input
                    type="date"
                    name="FechaEmision"
                    value={formData.FechaEmision}
                    onChange={handleChange}
                    required
                  />
                  <small className="error">{errors.FechaEmision}</small>
                </label>
              </div>

              {/* 🔢 Número de factura */}
              <div className="campo">
                <label>
                  No. Factura
                  <input
                    type="text"
                    name="NoFactura"
                    value={formData.NoFactura}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>

              {/* 🧾 NIT (Title) (llenado automático; readonly) */}
              <div className="campo">
                <label>
                  NIT
                  <input
                    type="text"
                    name="Title"
                    value={formData.Title}
                    onChange={handleChange}
                    required
                    readOnly
                  />
                  <small className="error">{errors.Proveedor}</small>
                </label>
              </div>

              {/* 🧾 Ítem (Código + descripción automática con búsqueda) */}
              <div className="campo">
                <label>Ítem (Código + descripción)</label>
                <Select
                  classNamePrefix="rs"
                  className="rs-override"
                  options={opcionesFactura.map((op) => ({
                    value: op.codigo,
                    label: `${op.codigo} - ${op.descripcion}`,
                  }))}
                  placeholder="Buscar ítem…"
                  isClearable
                  value={
                    formData.Items
                      ? {
                          value: formData.Items,
                          label:
                            opcionesFactura.find((op) => op.codigo === formData.Items)
                              ?.descripcion || formData.Items,
                        }
                      : null
                  }
                  onChange={(opt) => {
                    setFormData((prev) => ({
                      ...prev,
                      Items: opt?.value || "",
                      DescripItems: opt?.label?.split(" - ")[1] || "",
                    }));
                  }}
                  filterOption={(option, input) =>
                    option.label.toLowerCase().includes(input.toLowerCase())
                  }
                />
                <small className="error">{errors.Items}</small>
              </div>

              {/* 📝 Descripción del ítem (solo lectura, se llena automático) */}
              <div className="campo">
                <label>
                  Descripción del ítem
                  <input name="DescripItems" value={formData.DescripItems} readOnly />
                  <small className="error">{errors.Items}</small>
                </label>
              </div>

              {/* 💰 Valor */}
              <div className="campo">
                <label>
                  Valor antes iva (en pesos)
                  <input
                    type="text"
                    inputMode="numeric"
                    name="ValorAnIVA"
                    placeholder="Ej: 100.000,00"
                    value={String(displayValor)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const f = formatPesosEsCO(raw);
                      const num = toNumberFromEsCO(f);
                      setDisplayValor(f);
                      handleChange({
                        target: { name: "ValorAnIVA", value: String(num) },
                      } as unknown as React.ChangeEvent<HTMLInputElement>);
                    }}
                    onBlur={() => {
                      const num = toNumberFromEsCO(displayValor);
                      setDisplayValor(
                        new Intl.NumberFormat("es-CO", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(Number.isFinite(num) ? num : 0)
                      );
                    }}
                  />
                  <small className="error">{errors.ValorAnIVA}</small>
                </label>
              </div>

              {/* 🏢 Centro de Costos (C.C) */}
              <div className="campo">
                <label>Centro de Costos (C.C)</label>
                <Select
                  classNamePrefix="rs"
                  className="rs-override"
                  options={opcionescc.map((cc) => ({
                    value: cc.codigo,
                    label: `${cc.codigo} - ${cc.descripcion}`,
                  }))}
                  placeholder="Buscar centro de costo…"
                  isClearable
                  value={
                    formData.CC
                      ? {
                          value: formData.CC,
                          label:
                            opcionescc.find((cc) => cc.codigo === formData.CC)
                              ?.descripcion || formData.CC,
                        }
                      : null
                  }
                  onChange={(opt) =>
                    setFormData((prev) => ({
                      ...prev,
                      CC: opt?.value || "",
                    }))
                  }
                  filterOption={(option, input) =>
                    option.label.toLowerCase().includes(input.toLowerCase())
                  }
                />
                <small className="error">{errors.CC}</small>
              </div>

              {/* 🏭 Centro Operativo (C.O) */}
              <div className="campo">
                <label>Centro Operativo (C.O)</label>
                <Select
                  classNamePrefix="rs"
                  className="rs-override"
                  options={opcionesco.map((co) => ({
                    value: co.codigo,
                    label: `${co.codigo} - ${co.descripcion}`,
                  }))}
                  placeholder="Buscar centro operativo…"
                  isClearable
                  value={
                    formData.CO
                      ? {
                          value: formData.CO,
                          label:
                            opcionesco.find((co) => co.codigo === formData.CO)
                              ?.descripcion || formData.CO,
                        }
                      : null
                  }
                  onChange={(opt) =>
                    setFormData((prev) => ({
                      ...prev,
                      CO: opt?.value || "",
                    }))
                  }
                  filterOption={(option, input) =>
                    option.label.toLowerCase().includes(input.toLowerCase())
                  }
                />
                <small className="error">{errors.CO}</small>
              </div>

              {/* 🧱 Unidad de Negocio (U.N) */}
              <div className="campo">
                <label>Unidad de Negocio (U.N)</label>
                <Select
                  classNamePrefix="rs"
                  className="rs-override"
                  options={opcionesun.map((un) => ({
                    value: un.codigo,
                    label: `${un.codigo} - ${un.descripcion}`,
                  }))}
                  placeholder="Buscar unidad de negocio…"
                  isClearable
                  value={
                    formData.un
                      ? {
                          value: formData.un,
                          label:
                            opcionesun.find((u) => u.codigo === formData.un)
                              ?.descripcion || formData.un,
                        }
                      : null
                  }
                  onChange={(opt) =>
                    setFormData((prev) => ({
                      ...prev,
                      un: opt?.value || "",
                    }))
                  }
                  filterOption={(option, input) =>
                    option.label.toLowerCase().includes(input.toLowerCase())
                  }
                />
                <small className="error">{errors.un}</small>
              </div>

              {/* 🧾 Detalle */}
              <div className="campo">
                <label>
                  Detalle Fac
                  <input name="DetalleFac" value={formData.DetalleFac} onChange={handleChange} />
                </label>
              </div>

              {/* 📦 Fecha de entrega contabilidad */}
              <div className="campo">
                <label>
                  Fecha de entrega contabilidad
                  <input
                    type="date"
                    name="FecEntregaCont"
                    value={formData.FecEntregaCont ?? ""}
                    onChange={handleChange}
                  />
                </label>
              </div>

              {/* 📎 Documento ERP */}
              <div className="campo">
                <label>
                  Documento ERP
                  <input type="text" name="DocERP" value={formData.DocERP} onChange={handleChange} />
                </label>
              </div>
            </div>

            {/* 🗒️ Observaciones */}
            <div className="campo">
              <label>
                Observaciones
                <textarea
                  name="Observaciones"
                  rows={2}
                  value={formData.Observaciones}
                  onChange={handleChange}
                  placeholder="Escribe observaciones si aplica..."
                />
              </label>
            </div>

            {/* Botones */}
            <div className="botones-container">
              <button type="submit" className="btn-registrar">
                ✅  Registrar Factura
              </button>

              <button
                type="button"
                className="btn-ver-facturas"
                onClick={() => setMostrarLista(true)}
              >
                📄 Mostrar Facturas
              </button>

              {/* botón para abrir DistribucionFactura */}
              <button
                type="button"
                className="btn-distribucion"
                onClick={() => setMostrarDistribucion(true)}
              >
                📦 Distribuir Factura
              </button>
            </div>
          </form>
        ) : (
          // 📋 Vista de facturas con su propio componente de filtros
          <div>
            <FacturasLista onVolver={() => setMostrarLista(false)} />
          </div>
        )}

        {/* Modal de proveedor (mantener como en tu versión) */}
        <ProveedorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={agregarProveedor}
        />
      </>
    )}
  </div>
);

}
