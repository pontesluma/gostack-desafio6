import path from 'path';
import multer from 'multer';
import crypto from 'crypto';

const tmpDir = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: tmpDir,

  storage: multer.diskStorage({
    destination: tmpDir,
    filename: (Request, file, callback) => {
      const fileHash = crypto.randomBytes(10).toString('HEX');
      const filename = `${fileHash}-${file.originalname}`;

      return callback(null, filename);
    },
  }),
};
