import * as React from "react";
import CompraFormulario from "./FormularioCompra/Compras";
import TablaCompras from "./TablaCompras/TablaCompras";
import "./Compras.css"


export default function ComprasPage() {
  const [mostrarLista, setmostrarLista] = React.useState<boolean>(true); // ← por defecto FORM

  return (
    <div className="compra-wrap">

      {!mostrarLista ? (
        <section id="compras-form" aria-labelledby="compras-form-title">
          <h2 id="compras-form-title" className="sr-only">Formulario de compras</h2>
          <CompraFormulario submitting={false} onClick={setmostrarLista}  />
        </section>
      ) : (
        <section id="compras-tabla" aria-labelledby="compras-tabla-title">
          <h2 id="compras-tabla-title" className="sr-only">Tabla de solicitudes de compra</h2>
          <TablaCompras onClick={setmostrarLista} mostrar={true}/>
        </section>
      )}
    </div>
  );
}
