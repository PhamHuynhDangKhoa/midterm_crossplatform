import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform, Share } from "react-native";
import { serializeLecturersJson } from "../services/lecturerService";
import { Lecturer } from "../types";

export async function exportDatabaseJson(
  items: Lecturer[],
): Promise<"downloaded" | "shared"> {
  const json = serializeLecturersJson(items);

  if (Platform.OS === "web" && typeof document !== "undefined") {
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "GiangVien.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "downloaded";
  }

  const file = new File(Paths.cache, "GiangVien.json");
  file.create({ intermediates: true, overwrite: true });
  await file.write(json);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      dialogTitle: "Export GiangVien.json",
      ...(Platform.OS === "android"
        ? { mimeType: "application/json" }
        : { UTI: "public.json" }),
    });
    return "shared";
  }

  await Share.share({
    title: "GiangVien.json",
    message: json,
  });
  return "shared";
}
