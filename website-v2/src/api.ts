import axios from "axios";
import { CONFIG } from "./config";
import { getAccessToken, getUserId } from "./auth";
import type { AlbumImage, TagMap } from "./types";

const http = axios.create({
  baseURL: CONFIG.apiBaseUrl,
});

function authHeaders() {
  return {
    Authorization: `Bearer ${getAccessToken()}`,
    userID: getUserId(),
  };
}

export async function fetchImages() {
  const response = await http.get("/file", {
    headers: authHeaders(),
  });

  return (response.data.data || []) as AlbumImage[];
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  await http.post("/file", formData, {
    headers: authHeaders(),
  });
}

export async function deleteImage(imageID: string) {
  await http.delete("/file", {
    headers: authHeaders(),
    data: { imageID },
  });
}

export async function updateTags(image: AlbumImage) {
  const cleanedTags = image.tags.filter((tag) => {
    const key = Object.keys(tag)[0];
    return key && key.trim() !== "";
  });

  await http.put(
    "/file",
    { ...image, tags: cleanedTags },
    { headers: authHeaders() },
  );
}

export async function searchByTags(tags: TagMap) {
  const response = await http.post(
    "/tag/search",
    { tags: JSON.stringify(tags) },
    { headers: authHeaders() },
  );

  const body = response.data.data?.body;
  return body ? (JSON.parse(body) as AlbumImage[]) : [];
}

export async function findSimilarByImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await http.post("/image/search", formData, {
    headers: authHeaders(),
  });

  const body = response.data.data?.body;
  return body ? (JSON.parse(body) as AlbumImage[]) : [];
}
