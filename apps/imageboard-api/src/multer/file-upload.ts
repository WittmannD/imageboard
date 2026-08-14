export type FileUpload = Express.Multer.File & {
  uuid: string;
};
