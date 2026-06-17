/*import React from "react";
import type { AnsService } from "../../../services/AnsTbl.service"
import type { ANS } from "../../../Models/Categorias";

export function useANS(ansSvc: AnsService) {
    const [loading, setLoading] = React.useState<boolean>(false)

    const obtainANS = React.useCallback(async (categoriaId: string, subCategoriaId: string,): Promise<ANS | null> => {
        if (!categoriaId || !subCategoriaId) return null;


        console.log(categoriaId)
        console.log(subCategoriaId)
        setLoading(true);
        try {
            const cat = Number(categoriaId);
            const sub = Number(subCategoriaId);

            const r2 = await ansSvc.getAll({filter: `fields/CategoriaId eq ${cat} and fields/SubCategoriaId eq ${sub}`, top: 1,});
            console.log(r2)
            return r2?.items?.length ? r2.items[0] : null;
        } catch {
            return null;
        } finally {
            setLoading(false);
        }
    },[ansSvc]);

  return {
    loading, obtainANS
  };
}*/