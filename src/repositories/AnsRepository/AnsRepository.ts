import type { ANS } from "../../Models/Tickets";

export type propsANS = {
  id_categoria: number,
  id_sub_categoria: number,
  id_articulo?: number
}

export type ANSLoadResult = {
  data: ANS
  status: boolean
  message: string | null
}

export interface ANSRepository {
  loadANS(filter: propsANS): Promise<ANSLoadResult>;
}
