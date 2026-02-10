import React from "react";
import "./prestamos.css";
import { useDispositivos, usePrestamos, usePruebas } from "../../Funcionalidades/prestamos";
import { Tabs } from "./Tabs";
import { LoanHistorySection } from "./Secciones";
import { InventorySection } from "./InventorySection";
import type { prestamos } from "../../Models/prestamos";
import { PruebasSection } from "./Pruebas";
export type Tone = "ok" | "warn" | "bad" | "neutral";
export type PrestamosTabKey = "historial" | "inventario" | "pruebas";

export function loanStatusTone(s: string): Tone {
  if (s === "Cerrado") return "ok";
  if (s === "Mal") return "bad";
  return "neutral";
}

export function deviceStatusTone(s: string): Tone {
  if (s === "Disponible") return "ok";
  if (s === "Prestado") return "warn";
  return "neutral";
}

export function PrestamosPage() {
  const [activeTab, setActiveTab] = React.useState<PrestamosTabKey>("historial");
  const {notify, rows, estado, setEstado, search, setSearch, handleSubmit, state, setField, load: loadPrestamos, finalizeLoan: Terminar, notifyEstado } = usePrestamos()
  const {setState, deviceReturn, borrowDevice, load, setField: setFieldDispositivos, handleSubmit: crearDispositivo, rows: dispositivosRows, search: dispositivosSearch, setSearch: setDispositivosSearch, state: dispositivosState, editDevice } = useDispositivos()
  const {handleSubmit: createTest, editTest, createAllPruebas, loadAllPruebas, pruebasRows, state: pruebasState, setField: setFieldPruebas, setState: setPruebasState} = usePruebas()

  React.useEffect(() => {
    load();
    loadPrestamos()
    loadAllPruebas()
  }, [dispositivosSearch, estado, search,]);

  const createLoan = async (deviceId: string) => {
    const result = await handleSubmit();
    if (result && result.continue) {
      await createAllPruebas(result.created?.Id!)
      await borrowDevice(deviceId);
      notify(result.created!, dispositivosRows)
      load()
    }
  };

  const finalizeLoan = async (loan: prestamos, continuar: boolean) => {
    await Terminar(loan, continuar); //Marcar prestamo cerrado
    await notifyEstado(loan, dispositivosRows, continuar ? "Buen estado" : "Mal estado"); //Enviar notificacion de alerta
    alert("Se ha finalizado el prestamo. Se actualizará el estado del dispositivo.");
    await deviceReturn(loan.Id_dispositivo, continuar); //Organizar devolución del dispositivo
  };

  const onCreateDevice = async (mode: string) => {
    if(mode === "new"){
      await crearDispositivo();
    } else {
      await editDevice();
    }
  }

  const onCreateTest = async (mode: string) => {
    if(mode === "new"){
      await createTest();
    } else {
      await editTest();
    }
  }
  
  return (
    <div className="pl-page">
      <Tabs value={activeTab} onChange={setActiveTab} items={[{ key: "historial", label: "Historial" }, { key: "inventario", label: "Inventario" }, { key: "pruebas", label: "Pruebas" }]}/>

      {activeTab === "historial" && (
        <LoanHistorySection rows={rows} query={search} statusFilter={estado} onQueryChange={setSearch} onStatusFilterChange={setEstado} dispositivos={dispositivosRows} onCreateLoan={createLoan} state={state} setField={setField} onFinalizeLoan={finalizeLoan}/>
      )}

      {activeTab === "inventario" && (
        <InventorySection inventory={dispositivosRows} inventoryQuery={dispositivosSearch} onInventoryQueryChange={setDispositivosSearch} state={dispositivosState} setFieldState={setFieldDispositivos} onAddSubmit={onCreateDevice} load={load} setState={setState}/>
      )}

      {activeTab === "pruebas" && (
        <PruebasSection test={pruebasRows} state={pruebasState} setFieldState={setFieldPruebas} onAddSubmit={onCreateTest} load={loadAllPruebas} setState={setPruebasState}/>
      )}
    </div>
  );
}

