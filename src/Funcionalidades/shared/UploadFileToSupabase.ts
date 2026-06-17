import toast from "react-hot-toast";
import { supabase } from "../../Services/Supabase.service";

  const getFileExtension = (file: File) => {
    const nameExtension = file.name.split(".").pop()?.trim().toLowerCase();
    if (nameExtension) return nameExtension;

    const mimeExtension = file.type.split("/").pop()?.trim().toLowerCase();
    return mimeExtension || "png";
  };

export async function uploadImageToSupabase(file: File, bucket: string, path: string): Promise<{ok: boolean, url: string}>{
  const extension = getFileExtension(file);;
  const finalPath = `${path}.${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
      .from(bucket)
      .upload(finalPath, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
        upsert: false,
      });

    if (error) {
      toast.error("Algo ha salido mal subiendo el archivo " + error.message)
      throw new Error(error.message || "No se pudo subir la imagen a Supabase.");
    }

    const data = await getPubliURLFromSupabase(bucket, finalPath)

    return {
      ok: true,
      url: data.url
    };
  };

export async function getPubliURLFromSupabase(bucket: string, path: string): Promise<{url: string}>{
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    if (!data?.publicUrl) {
      toast.error("No se ha podido obtener la URL pública")
      throw new Error("No se pudo obtener la URL pública de la imagen.");
    }

    return {
      url: data.publicUrl
    };
  };