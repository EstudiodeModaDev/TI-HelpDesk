import React from "react";
import "./prestamos.css";
import {
  usePrestamos,
  usePruebas,
  usePruebasDispositivos,
} from "../../Funcionalidades/loans/prestamos";
import { Tabs } from "./Tabs";
import { LoanHistorySection } from "./Secciones";

import type { dispositivos, prestamos } from "../../Models/prestamos";
import { PruebasSection } from "./Pruebas";
import { useActivoPrestamo } from "../../Funcionalidades/inventario/useActivoPrestamo";
import { useRepositories } from "../../repositories/repositoriesContext";
import type { ActivoTI } from "../../Models/ActivoTI";

export type Tone = "ok" | "warn" | "bad" | "neutral";
export type PrestamosTabKey = "historial" | "pruebas";

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
  const [activeTab, setActiveTab] =
    React.useState<PrestamosTabKey>("historial");
  const {
    notify,
    visibleRows,
    estado,
    setEstado,
    search,
    setSearch,
    handleSubmit,
    state,
    setField,
    load: loadPrestamos,
    finalizeLoan: Terminar,
    notifyEstado,
  } = usePrestamos();

  const {
    handleSubmit: createTest,
    editTest,
    createAllPruebas,
    loadAllPruebas,
    pruebasRows,
    state: pruebasState,
    setField: setFieldPruebas,
    setState: setPruebasState,
  } = usePruebas();
  const {
    assignTest,
    unassignTest,
    loadDeviceTests,
    testsAssigned,
    testsLoading,
  } = usePruebasDispositivos();
  const { iniciarPrestamoActivo, finalizarPrestamoActivo } =
    useActivoPrestamo();
  const { activosTI } = useRepositories();
  const [activos, setActivos] = React.useState<ActivoTI[]>([]);

  const cargarActivos = React.useCallback(async () => {
    const res = await activosTI?.loadActivos(); // sin paginar: trae todos
    if (res?.status) setActivos(res.data);
  }, [activosTI]);

  React.useEffect(() => {
    cargarActivos();
  }, [cargarActivos]);

  const equipos: dispositivos[] = React.useMemo(
    () =>
      activos.map((a) => ({
        Id: a.id,
        Title: [a.tipo, a.marca, a.modelo].filter(Boolean).join(" "),
        Referencia: a.codigo_inventario,
        Serial: a.numero_serie,
        Estado: a.estado,
      })),
    [activos],
  );
  React.useEffect(() => {
    loadPrestamos();
    loadAllPruebas();
  }, [estado, search]);

  const createLoan = async (deviceId: string): Promise<prestamos | null> => {
    const result = await handleSubmit();

    if (result && result.continue) {
      await createAllPruebas(result.created?.Id!, deviceId);
      await iniciarPrestamoActivo(result.created!);

      notify(result.created!, equipos);
      cargarActivos();
      return result.created;
    }
    return null;
  };

  const finalizeLoan = async (loan: prestamos, continuar: boolean) => {
    await Terminar(loan, continuar); //Marcar prestamo cerrado
    await notifyEstado(loan, equipos, continuar ? "Buen estado" : "Mal estado"); //Enviar notificacion de alerta
    alert(
      "Se ha finalizado el préstamo. El activo vuelve a su estado anterior.",
    );
    await finalizarPrestamoActivo(loan);
    cargarActivos();
    loadPrestamos();
  };

  const onCreateTest = async (mode: string) => {
    if (mode === "new") {
      await createTest();
    } else {
      await editTest();
    }
  };

  return (
    <div className="pl-page">
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { key: "historial", label: "Historial" },

          { key: "pruebas", label: "Pruebas" },
        ]}
      />

      {activeTab === "historial" && (
        <LoanHistorySection
          rows={visibleRows}
          query={search}
          statusFilter={estado}
          onQueryChange={setSearch}
          onStatusFilterChange={setEstado}
          dispositivos={equipos}
          onCreateLoan={createLoan}
          state={state}
          setField={setField}
          onFinalizeLoan={finalizeLoan}
        />
      )}

      {activeTab === "pruebas" && (
        <PruebasSection
          test={pruebasRows}
          state={pruebasState}
          setFieldState={setFieldPruebas}
          onAddSubmit={onCreateTest}
          load={loadAllPruebas}
          setState={setPruebasState}
          equipos={equipos}
          assigned={testsAssigned}
          loadingAssigned={testsLoading}
          loadAssignedByDevice={loadDeviceTests}
          onAssign={assignTest}
          onUnassign={unassignTest}
        />
      )}
    </div>
  );
}
