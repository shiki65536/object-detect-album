export type TagMap = Record<string, number>;

export type AlbumImage = {
  imageID: string;
  link: string;
  tags: TagMap[];
  userID: string;
};

export type AuthView = "login" | "register" | "confirm";
